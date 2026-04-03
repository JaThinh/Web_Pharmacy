const db = require('../../db_config');
const { buildLocalProductImageUrl, isGenericImage } = require('../utils/productImageFallback');

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy giỏ hàng của user
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Giỏ hàng của user
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.Id;

    const query = `
      SELECT 
        ci."Id",
        ci."ProductId",
        ci."Qty",
        p."Name" as "ProductName",
        p."Image" as "ProductImage",
        p."ImageURL" as "ProductImageURL",
        p."Price",
        (ci."Qty" * p."Price") as "Subtotal"
      FROM "CartItems" ci
      JOIN "Products" p ON ci."ProductId" = p."Id"
      WHERE ci."UserId" = $1
      ORDER BY ci."Id" DESC
    `;

    const result = await db.query(query, [userId]);

    // Build absolute URL for images - Ưu tiên ImageURL (Cloudinary)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const cartItemsWithAbsoluteUrls = result.rows.map(item => {
      let imageUrl = `${baseUrl}/images/default.jpg`;
      
      // Ưu tiên ImageURL từ Cloudinary
      if (item.ProductImageURL && !isGenericImage(item.ProductImageURL)) {
        imageUrl = item.ProductImageURL;
      } else if (item.ProductImage && !isGenericImage(item.ProductImage)) {
        const img = item.ProductImage;
        if (img.startsWith('http://') || img.startsWith('https://')) {
          imageUrl = img;
        } else if (img.startsWith('/images/')) {
          imageUrl = `${baseUrl}${img}`;
        } else {
          imageUrl = `${baseUrl}/images/${img}`;
        }
      } else {
        const fallbackUrl = buildLocalProductImageUrl(baseUrl, item.ProductName);
        if (fallbackUrl) imageUrl = fallbackUrl;
      }
      
      return {
        ...item,
        ProductImage: imageUrl // Return absolute URL
      };
    });

    // Tính tổng tiền
    const total = cartItemsWithAbsoluteUrls.reduce((sum, item) => sum + parseFloat(item.Subtotal), 0);

    res.json({
      cartItems: cartItemsWithAbsoluteUrls,
      total: total
    });

  } catch (error) {
    console.error('Lỗi getCart:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy giỏ hàng!' });
  }
};

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               qty:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Đã thêm vào giỏ hàng
 */
const addToCart = async (req, res) => {
  try {
    console.log('=== addToCart START ===');
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);

    // Bảo vệ: yêu cầu phải đăng nhập
    const userId = req.user?.Id;
    if (!userId) {
      console.log('ERROR: Missing req.user');
      return res.status(401).json({ error: 'Chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.' });
    }

    // Parse & validate input
    const productId = Number.parseInt(req.body?.productId, 10);
    let qty = Number.parseInt(req.body?.qty ?? 1, 10);

    console.log('userId:', userId);
    console.log('productId (parsed):', productId);
    console.log('qty (parsed):', qty);

    if (!Number.isFinite(productId)) {
      console.log('ERROR: Thiếu/không hợp lệ productId');
      return res.status(400).json({ error: 'Thiếu hoặc sai thông tin sản phẩm!' });
    }

    if (!Number.isFinite(qty) || qty < 1) qty = 1; // ép về tối thiểu 1

    // Kiểm tra sản phẩm tồn tại
    console.log('Checking product in DB...');
    const productCheck = await db.query(
      'SELECT "Id", "Stock" FROM "Products" WHERE "Id" = $1 AND "IsActive" = true',
      [productId]
    );

    console.log('productCheck result:', productCheck.rows);

    if (productCheck.rows.length === 0) {
      console.log('ERROR: Sản phẩm không tồn tại');
      return res.status(404).json({ error: 'Sản phẩm không tồn tại!' });
    }

    const stock = Number(productCheck.rows[0].Stock) || 0;

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    console.log('Checking existing cart item...');
    const existingItem = await db.query(
      'SELECT "Id", "Qty" FROM "CartItems" WHERE "UserId" = $1 AND "ProductId" = $2',
      [userId, productId]
    );

    console.log('existingItem result:', existingItem.rows);

    if (existingItem.rows.length > 0) {
      // Update số lượng nếu đã có
      const currentQty = Number(existingItem.rows[0].Qty) || 0;
      const newQty = currentQty + qty;

      if (newQty > stock) {
        console.log('ERROR: Vượt quá tồn kho. Stock:', stock, 'Requested newQty:', newQty);
        return res.status(400).json({ error: 'Sản phẩm không đủ số lượng trong kho!' });
      }

      await db.query(
        'UPDATE "CartItems" SET "Qty" = $1 WHERE "Id" = $2',
        [newQty, existingItem.rows[0].Id]
      );

      console.log('=== addToCart SUCCESS (UPDATE) ===');
      return res.json({
        message: 'Đã cập nhật số lượng trong giỏ hàng!',
        cartItemId: existingItem.rows[0].Id,
        qty: newQty
      });
    }

    // Thêm mới vào giỏ
    if (qty > stock) {
      console.log('ERROR: Không đủ số lượng để thêm mới. Stock:', stock, 'Requested qty:', qty);
      return res.status(400).json({ error: 'Sản phẩm không đủ số lượng trong kho!' });
    }

    console.log('Inserting new cart item...');
    const insertQuery = `
      INSERT INTO "CartItems" ("UserId", "ProductId", "Qty")
      VALUES ($1, $2, $3)
      RETURNING "Id", "Qty"
    `;

    try {
      const result = await db.query(insertQuery, [userId, productId, qty]);
      console.log('Insert result:', result.rows);

      console.log('=== addToCart SUCCESS (INSERT) ===');
      return res.json({
        message: 'Đã thêm vào giỏ hàng!',
        cartItemId: result.rows[0].Id,
        qty: result.rows[0].Qty
      });
    } catch (err) {
      // Xử lý trùng UNIQUE("UserId","ProductId"): update cộng dồn thay vì 500
      if (err && err.code === '23505') { // unique_violation
        console.log('Conflict UNIQUE, fallback to increment update');
        const upd = await db.query(
          'UPDATE "CartItems" SET "Qty" = LEAST("Qty" + $1, $4) WHERE "UserId"=$2 AND "ProductId"=$3 RETURNING "Id", "Qty"',
          [qty, userId, productId, stock]
        );
        return res.json({
          message: 'Đã cập nhật số lượng trong giỏ hàng!',
          cartItemId: upd.rows[0].Id,
          qty: upd.rows[0].Qty
        });
      }
      throw err; // rethrow để vào catch ngoài
    }

  } catch (error) {
    console.error('=== addToCart ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error full:', error);
    res.status(500).json({ error: 'Lỗi server khi thêm vào giỏ hàng!' });
  }
};

/**
 * @swagger
 * /api/cart/items/{id}:
 *   patch:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qty:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Đã cập nhật giỏ hàng
 */
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.Id;
    const { id } = req.params;
    const { qty } = req.body;

    if (!qty || qty < 1) {
      return res.status(400).json({ error: 'Số lượng không hợp lệ!' });
    }

    // Kiểm tra cart item thuộc user
    const checkQuery = `
      SELECT ci."Id", ci."ProductId", p."Stock"
      FROM "CartItems" ci
      JOIN "Products" p ON ci."ProductId" = p."Id"
      WHERE ci."Id" = $1 AND ci."UserId" = $2
    `;
    
    const checkResult = await db.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng!' });
    }

    // Kiểm tra tồn kho
    if (checkResult.rows[0].Stock < qty) {
      return res.status(400).json({ error: 'Sản phẩm không đủ số lượng trong kho!' });
    }

    // Update số lượng
    await db.query(
      'UPDATE "CartItems" SET "Qty" = $1 WHERE "Id" = $2',
      [qty, id]
    );

    res.json({ message: 'Đã cập nhật giỏ hàng!' });

  } catch (error) {
    console.error('Lỗi updateCartItem:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật giỏ hàng!' });
  }
};

/**
 * @swagger
 * /api/cart/items/{id}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã xóa khỏi giỏ hàng
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.Id;
    const { id } = req.params;

    // Kiểm tra cart item thuộc user
    const checkResult = await db.query(
      'SELECT "Id" FROM "CartItems" WHERE "Id" = $1 AND "UserId" = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm trong giỏ hàng!' });
    }

    // Xóa
    await db.query('DELETE FROM "CartItems" WHERE "Id" = $1', [id]);

    res.json({ message: 'Đã xóa khỏi giỏ hàng!' });

  } catch (error) {
    console.error('Lỗi removeFromCart:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa khỏi giỏ hàng!' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};

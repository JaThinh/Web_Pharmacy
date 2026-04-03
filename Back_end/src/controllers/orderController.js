const db = require('../../db_config');
const { createMomoPayment } = require('../services/momoService');
const { createPayment: createZaloPayPayment } = require('../services/zaloPayService');


const mapPaymentMethod = (method) => {
  const lowerMethod = String(method || '').toLowerCase();
  // BỔ SUNG: 'zalopay'
  if (lowerMethod === 'zalopay') return 'ZaloPay';
  if (lowerMethod === 'momo') return 'Momo';
  if (lowerMethod === 'bank' || lowerMethod === 'banking') return 'ZaloPay';
  return 'COD';
};

// =================== CHECKOUT ===================
const checkout = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const userId = req.user.Id;
    const {
      fullName = '',
      email = '',
      address = '',
      phone = '',
      note = '',
      city = '',
      district = '',
      ward = '',
      paymentMethod = 'COD' // Dùng paymentMethod từ req.body
    } = req.body;

    // Validate cơ bản (GIỮ NGUYÊN)
    if (!address || !phone) {
      return res.status(400).json({ error: 'Thiếu địa chỉ hoặc số điện thoại!' });
    }

    // Build địa chỉ đầy đủ (GIỮ NGUYÊN)
    const fullAddress = `${address}, ${ward || ''}, ${district || ''}, ${city || ''}`
      .replace(/(,\s*)+/g, ', ')
      .trim();

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    await client.query('BEGIN');

    // Lấy giỏ hàng (GIỮ NGUYÊN)
    const cartQuery = `
      SELECT 
        ci."Id" as "CartItemId",
        ci."ProductId",
        ci."Qty",
        p."Name" as "ProductName",
        p."Image" as "ProductImage",
        p."ImageURL" as "ProductImageURL",
        p."Price",
        p."Stock"
      FROM "CartItems" ci
      JOIN "Products" p ON ci."ProductId" = p."Id"
      WHERE ci."UserId" = $1
    `;
    const cartResult = await client.query(cartQuery, [userId]);

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Giỏ hàng trống!' });
    }

    // Xử lý từng item (GIỮ NGUYÊN)
    const itemsWithUrls = [];
    let subtotal = 0;

    for (const item of cartResult.rows) {
      if (item.Stock < item.Qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Sản phẩm "${item.ProductName}" không đủ số lượng trong kho!`
        });
      }

      // Build URL ảnh (GIỮ NGUYÊN)
      let imageUrl = `${baseUrl}/images/default.jpg`;
      if (item.ProductImageURL) {
        imageUrl = item.ProductImageURL;
      } else if (item.ProductImage) {
        const img = item.ProductImage;
        if (img.startsWith('http')) imageUrl = img;
        else imageUrl = `${baseUrl}/images/${img.replace(/^\/+/, '')}`;
      }

      itemsWithUrls.push({
        ...item,
        ProductImage: imageUrl
      });

      subtotal += parseFloat(item.Price) * item.Qty;
    }

    const shippingFee = 30000;
    const finalTotal = subtotal + shippingFee;
    const dbPaymentMethod = mapPaymentMethod(paymentMethod); // [cite: orderController.js]

    // SỬA ĐỔI: Phân nhánh trạng thái đơn hàng (GIỮ NGUYÊN)
    const orderStatus = (dbPaymentMethod === 'COD') ? 'confirmed' : 'pending';

    // ✅ Tạo đơn hàng (GIỮ NGUYÊN) [cite: orderController.js]
    const orderQuery = `
      INSERT INTO "Orders" 
        ("UserId", "Total", "Address", "Phone", "Note", "PaymentMethod", "Status", "CreatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING "Id", "Total", "Status", "CreatedAt", "Code"
    `;
    const orderResult = await client.query(orderQuery, [
      userId, finalTotal, fullAddress, phone, note, dbPaymentMethod, orderStatus
    ]);
    const order = orderResult.rows[0];

    // ✅ Lưu thông tin người nhận (GIỮ NGUYÊN) [cite: orderController.js]
    await client.query('SAVEPOINT sp_recipients');
    try {
      await client.query(`
        INSERT INTO "OrderRecipients"
        ("OrderId", "FullName", "Email", "Phone", "Address", "City", "District", "Ward")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        order.Id,
        fullName || '(Chưa nhập)',
        email || null,
        phone,
        address,
        city,
        district,
        ward
      ]);
    } catch (e) {
      await client.query('ROLLBACK TO SAVEPOINT sp_recipients');
      console.warn('⚠️ Bỏ qua lưu OrderRecipients (bảng có thể chưa tồn tại)');
    } finally {
      await client.query('RELEASE SAVEPOINT sp_recipients');
    }

    // ✅ Thêm OrderItems VÀ Cập nhật kho (GIỮ NGUYÊN) [cite: orderController.js]
    for (const item of itemsWithUrls) {
      // Thêm OrderItems (GIỮ NGUYÊN)
      await client.query(`
        INSERT INTO "OrderItems" 
        ("OrderId", "ProductId", "ProductName", "ProductImage", "Qty", "Price")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.Id, item.ProductId, item.ProductName, item.ProductImage, item.Qty, item.Price]);

      // SỬA ĐỔI: Chỉ trừ kho nếu là COD (GIỮ NGUYÊN)
      if (dbPaymentMethod === 'COD') {
        await client.query(
          'UPDATE "Products" SET "Stock" = "Stock" - $1 WHERE "Id" = $2',
          [item.Qty, item.ProductId]
        );
      }
    }

    // === SỬA ĐỔI LỚN: LOGIC XÓA GIỎ VÀ TRẢ VỀ ===
    
    // Tạo response body (dùng chung) (GIỮ NGUYÊN)
    const orderResponse = {
      Id: order.Id,
      Code: order.Code, 
      Total: order.Total,
      Status: order.Status,
      Address: fullAddress,
      Phone: phone,
      PaymentMethod: dbPaymentMethod,
      CreatedAt: order.CreatedAt
    };

    if (dbPaymentMethod === 'COD') {
      // LOGIC COD (Giống file gốc) [cite: orderController.js]
      await client.query('DELETE FROM "CartItems" WHERE "UserId" = $1', [userId]);
      await client.query('COMMIT');
      res.status(201).json({ order: orderResponse });

    } else if (dbPaymentMethod === 'Momo') {
      // LOGIC MOMO (Giữ nguyên logic của bạn) [cite: orderController.js]
      const orderInfo = `Thanh toan don hang ${order.Code || order.Id}`; 
      const momoResponse = await createMomoPayment(order.Id, finalTotal, orderInfo);
      await client.query('DELETE FROM "CartItems" WHERE "UserId" = $1', [userId]);
      await client.query('COMMIT');

      res.status(201).json({
        order: orderResponse,
        payUrl: momoResponse.payUrl
      });
      
    // BỔ SUNG: LOGIC ZALOPAY (Mirror logic MoMo)
    } else if (dbPaymentMethod === 'ZaloPay') {
      // 1. Tạo link thanh toán ZaloPay
      // Chúng ta sẽ dùng Order.Code làm apptransid (giống MoMo dùng Order.Id)
      const orderInfo = `Thanh toan don hang ${order.Code}`;
      const zaloPayResponse = await createZaloPayPayment({
        apptransid: order.Code, // Dùng Code làm mã giao dịch
        totalAmount: finalTotal,
        description: orderInfo,
        userId: userId
      });

      // 2. Xóa giỏ hàng (Giống MoMo)
      await client.query('DELETE FROM "CartItems" WHERE "UserId" = $1', [userId]);

      // 3. Commit
      await client.query('COMMIT');

      // 4. Trả về payUrl cho frontend
      res.status(201).json({
        order: orderResponse,
        payUrl: zaloPayResponse.payUrl // 💡 Trả về link ZaloPay
      });

    } else { 
      // LOGIC KHÁC (Fall-back)
      await client.query('DELETE FROM "CartItems" WHERE "UserId" = $1', [userId]);
      await client.query('COMMIT');
      res.status(201).json({ order: orderResponse });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi checkout:', error);
    res.status(500).json({ error: 'Lỗi server khi đặt hàng!' });
  } finally {
    client.release();
  }
};

// =================== CÁC HÀM KHÁC GIỮ NGUYÊN ===================
// (GIỮ NGUYÊN)
const getOrders = async (req, res) => {
  // ... (code gốc của bạn) [cite: orderController.js]
  try {
    const userId = req.user.Id;
    const { status } = req.query;

    let query = `
      SELECT 
        o."Id", o."Code", o."Total", o."Status", o."Address", o."Phone",
        o."PaymentMethod", o."CreatedAt", COUNT(oi."Id") as "ItemsCount"
      FROM "Orders" o
      LEFT JOIN "OrderItems" oi ON o."Id" = oi."OrderId"
      WHERE o."UserId" = $1
    `;
    const params = [userId];
    if (status) {
      query += ` AND o."Status" = $2`;
      params.push(status);
    }
    query += ` GROUP BY o."Id" ORDER BY o."CreatedAt" DESC`;
    const result = await db.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Lỗi getOrders:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách đơn hàng!' });
  }
};

// (GIỮ NGUYÊN)
const getOrderById = async (req, res) => {
  // ... (code gốc của bạn) [cite: orderController.js]
  try {
    const userId = req.user.Id;
    const { id } = req.params;

    const orderQuery = `
      SELECT "Id", "Code", "Status", "Total", "Address", "Phone",
             "Note", "PaymentMethod", "ETA", "CreatedAt", "UpdatedAt"
      FROM "Orders"
      WHERE "Id" = $1 AND "UserId" = $2
    `;
    const orderResult = await db.query(orderQuery, [id, userId]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng!' });
    }

    const order = orderResult.rows[0];
    const itemsQuery = `
      SELECT "ProductId", "ProductName", "ProductImage", "Qty", "Price", ("Qty" * "Price") as "Subtotal"
      FROM "OrderItems"
      WHERE "OrderId" = $1
    `;
    const itemsResult = await db.query(itemsQuery, [id]);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itemsWithAbsoluteUrls = itemsResult.rows.map(item => {
      const imageUrl = item.ProductImage?.startsWith('http')
        ? item.ProductImage
        : `${baseUrl}/images/${item.ProductImage?.replace(/^\/+/, '') || 'default.jpg'}`;
      return { ...item, ProductImage: imageUrl };
    });

    res.json({ ...order, items: itemsWithAbsoluteUrls });
  } catch (error) {
    console.error('Lỗi getOrderById:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết đơn hàng!' });
  }
};

// (GIỮ NGUYÊN)
const cancelOrder = async (req, res) => {
  // ... (code gốc của bạn) [cite: orderController.js]
  const client = await db.pool.connect();
  try {
    const userId = req.user.Id;
    const { id } = req.params;
    await client.query('BEGIN');

    const checkQuery = `SELECT "Id", "Status" FROM "Orders" WHERE "Id" = $1 AND "UserId" = $2`;
    const checkResult = await client.query(checkQuery, [id, userId]);
    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng!' });
    }

    const currentStatus = checkResult.rows[0].Status;
    
    // SỬA ĐỔI: Cho phép hủy 'pending' (Online) hoặc 'confirmed' (COD)
    if (currentStatus !== 'pending' && currentStatus !== 'confirmed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn hàng chưa được giao!' });
    }

    // SỬA ĐỔI: Chỉ hoàn kho nếu đơn hàng là 'confirmed' (COD)
    // Vì đơn 'pending' (MoMo/ZaloPay) chưa hề bị trừ kho
    if (currentStatus === 'confirmed') {
      const itemsQuery = `SELECT "ProductId", "Qty" FROM "OrderItems" WHERE "OrderId" = $1`;
      const itemsResult = await client.query(itemsQuery, [id]);

      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE "Products" SET "Stock" = "Stock" + $1 WHERE "Id" = $2',
          [item.Qty, item.ProductId]
        );
      }
    }

    // Cập nhật trạng thái (GIỮ NGUYÊN)
    await client.query(
      'UPDATE "Orders" SET "Status" = $1 WHERE "Id" = $2',
      ['cancelled', id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Đã hủy đơn hàng thành công!' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi cancelOrder:', error);
    res.status(500).json({ error: 'Lỗi server khi hủy đơn hàng!' });
  } finally {
    client.release();
  }
};

/**
 * ============== ADMIN FUNCTIONS (GIỮ NGUYÊN) ==============
 */
const getAllOrders = async (req, res) => {
  // ... (code gốc của bạn) [cite: orderController.js]
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập!' });
    }

    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`o."Status" = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        LOWER(u."Fullname") LIKE LOWER($${paramIndex}) OR 
        LOWER(u."Email") LIKE LOWER($${paramIndex}) OR 
        o."Code" LIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM "Orders" o
      LEFT JOIN "Users" u ON o."UserId" = u."Id"
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get orders
    queryParams.push(limit, offset);
    const ordersQuery = `
      SELECT 
        o."Id", o."Code", o."UserId", o."Total", o."Status", 
        o."Address", o."Phone", o."PaymentMethod", o."CreatedAt", o."UpdatedAt",
        u."Fullname" as "CustomerName",
        u."Email" as "CustomerEmail",
        COUNT(oi."Id") as "ItemsCount"
      FROM "Orders" o
      LEFT JOIN "Users" u ON o."UserId" = u."Id"
      LEFT JOIN "OrderItems" oi ON o."Id" = oi."OrderId"
      ${whereClause}
      GROUP BY o."Id", u."Id"
      ORDER BY o."CreatedAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await db.query(ordersQuery, queryParams);

    res.json({
      orders: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Lỗi getAllOrders:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách đơn hàng!' });
  }
};

const getOrderByIdAdmin = async (req, res) => {
  // ... (code gốc của bạn) [cite: orderController.js]
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập!' });
    }

    const { id } = req.params;

    const orderQuery = `
      SELECT 
        o.*,
        u."Id" as "CustomerId",
        u."Fullname" as "CustomerName",
        u."Email" as "CustomerEmail",
        u."Phone" as "CustomerPhone"
      FROM "Orders" o
      LEFT JOIN "Users" u ON o."UserId" = u."Id"
      WHERE o."Id" = $1
    `;
    const orderResult = await db.query(orderQuery, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng!' });
    }

    const order = orderResult.rows[0];

    const itemsQuery = `
      SELECT 
        "ProductId", "ProductName", "ProductImage", 
        "Qty", "Price", ("Qty" * "Price") as "Subtotal"
      FROM "OrderItems"
      WHERE "OrderId" = $1
    `;
    const itemsResult = await db.query(itemsQuery, [id]);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const itemsWithAbsoluteUrls = itemsResult.rows.map(item => {
      const imageUrl = item.ProductImage?.startsWith('http')
        ? item.ProductImage
        : `${baseUrl}/images/${item.ProductImage?.replace(/^\/+/, '') || 'default.jpg'}`;
      return { ...item, ProductImage: imageUrl };
    });

    res.json({ 
      ...order, 
      items: itemsWithAbsoluteUrls 
    });

  } catch (error) {
    console.error('Lỗi getOrderByIdAdmin:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết đơn hàng!' });
  }
};

const updateOrderStatus = async (req, res) => {
  // ... (code gốc của bạn) [cite: orderController.js]
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền cập nhật!' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Trạng thái không hợp lệ! Các trạng thái hợp lệ: ' + validStatuses.join(', ')
      });
    }

    const query = `
      UPDATE "Orders"
      SET "Status" = $1, "UpdatedAt" = NOW()
      WHERE "Id" = $2
      RETURNING "Id", "Code", "Status"
    `;

    const result = await db.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng!' });
    }

    res.json({ 
      message: 'Đã cập nhật trạng thái đơn hàng!',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi updateOrderStatus:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật trạng thái!' });
  }
};

const getOrderStatistics = async (req, res) => {
  // ... (code gốc của bạn) [cite: orderController.js]
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập!' });
    }

    // Get statistics
    const stats = await Promise.all([
      // Total orders
      db.query('SELECT COUNT(*) as total FROM "Orders"'),
      
      // Orders by status
      db.query(`
        SELECT "Status", COUNT(*) as count
        FROM "Orders"
        GROUP BY "Status"
      `),
      
      // Total revenue (delivered orders only)
      db.query(`
        SELECT SUM("Total") as revenue
        FROM "Orders"
        WHERE "Status" = 'delivered'
      `),
      
      // Orders today
      db.query(`
        SELECT COUNT(*) as today
        FROM "Orders"
        WHERE DATE("CreatedAt") = CURRENT_DATE
      `),
      
      // Orders this month
      db.query(`
        SELECT COUNT(*) as this_month
        FROM "Orders"
        WHERE EXTRACT(MONTH FROM "CreatedAt") = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM "CreatedAt") = EXTRACT(YEAR FROM CURRENT_DATE)
      `),
      
      // Revenue this month
      db.query(`
        SELECT SUM("Total") as revenue_month
        FROM "Orders"
        WHERE "Status" = 'delivered'
        AND EXTRACT(MONTH FROM "CreatedAt") = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM "CreatedAt") = EXTRACT(YEAR FROM CURRENT_DATE)
      `)
    ]);

    const statusCounts = {};
    stats[1].rows.forEach(row => {
      statusCounts[row.Status] = parseInt(row.count);
    });

    res.json({
      totalOrders: parseInt(stats[0].rows[0].total),
      byStatus: statusCounts,
      totalRevenue: parseFloat(stats[2].rows[0].revenue || 0),
      ordersToday: parseInt(stats[3].rows[0].today),
      ordersThisMonth: parseInt(stats[4].rows[0].this_month),
      revenueThisMonth: parseFloat(stats[5].rows[0].revenue_month || 0)
    });

  } catch (error) {
    console.error('Lỗi getOrderStatistics:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thống kê!' });
  }
};

// (GIỮ NGUYÊN)
module.exports = { 
  checkout, 
  getOrders, 
  getOrderById, 
  cancelOrder,
  // Admin functions
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
  getOrderStatistics
};
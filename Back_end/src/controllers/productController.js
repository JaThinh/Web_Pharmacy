const db = require('../../db_config');
const { buildLocalProductImageUrl, isGenericImage } = require('../utils/productImageFallback');

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục (thuoc, vitamin, cham-soc, thiet-bi)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên sản phẩm
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số sản phẩm mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 */
const getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query động
    let whereConditions = ['"IsActive" = true'];
    let queryParams = [];
    let paramIndex = 1;

    // Filter theo category
    if (category) {
      whereConditions.push(`LOWER("Category") = LOWER($${paramIndex})`);
      queryParams.push(category);
      paramIndex++;
    }

    // Search theo tên
    if (search) {
      whereConditions.push(`LOWER("Name") LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count tổng số sản phẩm
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM "Products" 
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Query danh sách sản phẩm với pagination
    queryParams.push(limit, offset);
    const productsQuery = `
      SELECT 
        "Id", "Name", "Slug", "ShortDesc", 
        "Category", "Brand", "Image", "ImageURL", "Price", 
        "Stock", "IsActive", "CreatedAt"
      FROM "Products"
      ${whereClause}
      ORDER BY "CreatedAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await db.query(productsQuery, queryParams);

    // Map image field - Ưu tiên ImageURL từ Cloudinary, fallback về Image local
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const mappedRows = result.rows.map(r => {
      let imageUrl = `${baseUrl}/images/default.jpg`;

      // ✅ Ưu tiên ImageURL (Cloudinary) nếu có
      if (r.ImageURL && r.ImageURL.trim() !== '' && !isGenericImage(r.ImageURL)) {
        let cloudUrl = r.ImageURL.trim();
        // Nếu không bắt đầu bằng http, build full Cloudinary URL
        if (!cloudUrl.startsWith('http://') && !cloudUrl.startsWith('https://')) {
          cloudUrl = `https://res.cloudinary.com/dd1onmi19/image/upload/${cloudUrl}`;
        }
        imageUrl = cloudUrl;
        console.log('✅ Using Cloudinary URL:', imageUrl);
      } else if (r.Image && !isGenericImage(r.Image)) {
        // Fallback về Image field (local hoặc URL cũ)
        const image = r.Image;
        if (image.startsWith('http://') || image.startsWith('https://')) {
          imageUrl = image;
        } else if (image.startsWith('/images/')) {
          imageUrl = `${baseUrl}${image}`;
        } else {
          imageUrl = `${baseUrl}/images/${image}`;
        }
        console.log('⚠️ Using fallback image:', imageUrl);
      } else {
        const fallbackUrl = buildLocalProductImageUrl(baseUrl, r.Name);
        if (fallbackUrl) {
          imageUrl = fallbackUrl;
          console.log('🖼️ Using local fallback image:', imageUrl);
        } else {
          console.log('❌ No image data for product ID:', r.Id, '- using default');
        }
      }

      // Log để debug
      console.log(`Product ${r.Id} (${r.Name}): imageUrl = ${imageUrl}`);

      return {
        // camelCase (preferred)
        id: r.Id,
        name: r.Name,
        slug: r.Slug,
        shortDesc: r.ShortDesc,
        category: r.Category,
        brand: r.Brand,
        image: r.Image || null, // raw DB value (filename)
        imageUrl: imageUrl, // absolute URL for frontend
        price: r.Price,
        stock: r.Stock,
        isActive: r.IsActive,
        createdAt: r.CreatedAt,

        // legacy/compat keys (keep for existing frontend code)
        Id: r.Id,
        Name: r.Name,
        Slug: r.Slug,
        ShortDesc: r.ShortDesc,
        Image: r.Image,
        ImageUrl: imageUrl,
        Price: r.Price
      };
    });

    res.json({
      products: mappedRows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Lỗi getProducts:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách sản phẩm!' });
  }
};

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        "Id", "Name", "Slug", "ShortDesc", "Description",
        "Category", "Brand", "Image", "ImageURL", "Price", "Stock",
        "IsActive", "CreatedAt", "UpdatedAt"
      FROM "Products"
      WHERE "Id" = $1 AND "IsActive" = true
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm!' });
    }

    const r = result.rows[0];

    // Build image URL - Ưu tiên ImageURL từ Cloudinary
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let imageUrl = `${baseUrl}/images/default.jpg`;

    // ✅ Ưu tiên ImageURL (Cloudinary) nếu có
    if (r.ImageURL && r.ImageURL.trim() !== '' && !isGenericImage(r.ImageURL)) {
      let cloudUrl = r.ImageURL.trim();
      // Nếu không bắt đầu bằng http, build full Cloudinary URL
      if (!cloudUrl.startsWith('http://') && !cloudUrl.startsWith('https://')) {
        cloudUrl = `https://res.cloudinary.com/dd1onmi19/image/upload/${cloudUrl}`;
      }
      imageUrl = cloudUrl;
      console.log('✅ Product detail - Using Cloudinary URL:', imageUrl);
    } else if (r.Image && !isGenericImage(r.Image)) {
      // Fallback về Image local
      const image = r.Image;
      if (image.startsWith('http://') || image.startsWith('https://')) {
        imageUrl = image;
      } else if (image.startsWith('/images/')) {
        imageUrl = `${baseUrl}${image}`;
      } else {
        imageUrl = `${baseUrl}/images/${image}`;
      }
      console.log('⚠️ Product detail - Using fallback image:', imageUrl);
    } else {
      const fallbackUrl = buildLocalProductImageUrl(baseUrl, r.Name);
      if (fallbackUrl) {
        imageUrl = fallbackUrl;
        console.log('🖼️ Product detail - Using local fallback image:', imageUrl);
      } else {
        console.log('❌ Product detail - No image data for product ID:', r.Id, '- using default');
      }
    }

    const product = {
      id: r.Id,
      name: r.Name,
      slug: r.Slug,
      shortDesc: r.ShortDesc,
      description: r.Description,
      category: r.Category,
      brand: r.Brand,
      image: r.Image || null,
      imageUrl: imageUrl,
      price: r.Price,
      stock: r.Stock,
      isActive: r.IsActive,
      createdAt: r.CreatedAt,
      updatedAt: r.UpdatedAt
    };

    // also include legacy keys for backward compatibility
    product.Id = r.Id;
    product.Name = r.Name;
    product.Slug = r.Slug;
    product.ShortDesc = r.ShortDesc;
    product.Image = r.Image;
    product.ImageUrl = imageUrl;
    product.Price = r.Price;

    res.json(product);

  } catch (error) {
    console.error('Lỗi getProductById:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy chi tiết sản phẩm!' });
  }
};

/**
 * ============== ADMIN FUNCTIONS ==============
 */

/**
 * @swagger
 * /api/products/admin:
 *   post:
 *     summary: Tạo sản phẩm mới (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               shortDesc:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               image:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 description: Full Cloudinary URL (optional)
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 */
const createProduct = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền tạo sản phẩm!' });
    }

    const { 
      name, 
      shortDesc, 
      description, 
      category, 
      brand, 
      image, 
      imageUrl, // Thêm imageUrl từ Cloudinary
      price, 
      stock 
    } = req.body;

    // Validate
    if (!name || !price || stock === undefined) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (name, price, stock)!' });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const query = `
      INSERT INTO "Products" 
      ("Name", "Slug", "ShortDesc", "Description", "Category", "Brand", 
       "Image", "ImageURL", "Price", "Stock", "IsActive", "CreatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW())
      RETURNING *
    `;

    const result = await db.query(query, [
      name,
      slug,
      shortDesc || '',
      description || '',
      category || 'thuoc',
      brand || '',
      image || 'default.jpg',
      imageUrl || null, // Lưu imageUrl vào ImageURL
      price,
      stock
    ]);

    res.status(201).json({
      message: 'Tạo sản phẩm thành công!',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi createProduct:', error);
    res.status(500).json({ error: 'Lỗi server khi tạo sản phẩm!' });
  }
};

/**
 * @swagger
 * /api/products/admin/:id:
 *   patch:
 *     summary: Cập nhật sản phẩm (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateProduct = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền cập nhật sản phẩm!' });
    }

    const { id } = req.params;
    const { 
      name, 
      shortDesc, 
      description, 
      category, 
      brand, 
      image, 
      imageUrl, // Thêm imageUrl
      price, 
      stock,
      isActive
    } = req.body;

    // Build dynamic query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`"Name" = $${paramIndex}`);
      values.push(name);
      paramIndex++;

      // Update slug if name changes
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      updates.push(`"Slug" = $${paramIndex}`);
      values.push(slug);
      paramIndex++;
    }

    if (shortDesc !== undefined) {
      updates.push(`"ShortDesc" = $${paramIndex}`);
      values.push(shortDesc);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`"Description" = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (category !== undefined) {
      updates.push(`"Category" = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (brand !== undefined) {
      updates.push(`"Brand" = $${paramIndex}`);
      values.push(brand);
      paramIndex++;
    }

    if (image !== undefined) {
      updates.push(`"Image" = $${paramIndex}`);
      values.push(image);
      paramIndex++;
    }

    if (imageUrl !== undefined) {
      updates.push(`"ImageURL" = $${paramIndex}`);
      values.push(imageUrl);
      paramIndex++;
    }

    if (price !== undefined) {
      updates.push(`"Price" = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }

    if (stock !== undefined) {
      updates.push(`"Stock" = $${paramIndex}`);
      values.push(stock);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`"IsActive" = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Không có thông tin để cập nhật!' });
    }

    values.push(id);

    const query = `
      UPDATE "Products"
      SET ${updates.join(', ')}, "UpdatedAt" = NOW()
      WHERE "Id" = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm!' });
    }

    res.json({
      message: 'Cập nhật sản phẩm thành công!',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi updateProduct:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật sản phẩm!' });
  }
};

/**
 * @swagger
 * /api/products/admin/:id:
 *   delete:
 *     summary: Xóa sản phẩm (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
const deleteProduct = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền xóa sản phẩm!' });
    }

    const { id } = req.params;

    // Soft delete: set IsActive = false
    const query = `
      UPDATE "Products"
      SET "IsActive" = false, "UpdatedAt" = NOW()
      WHERE "Id" = $1
      RETURNING "Id", "Name"
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm!' });
    }

    res.json({ 
      message: 'Đã xóa sản phẩm thành công!',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi deleteProduct:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa sản phẩm!' });
  }
};

/**
 * @swagger
 * /api/products/admin/:id/toggle:
 *   patch:
 *     summary: Bật/tắt trạng thái sản phẩm (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const toggleProductStatus = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền thay đổi trạng thái!' });
    }

    const { id } = req.params;

    const query = `
      UPDATE "Products"
      SET "IsActive" = NOT "IsActive", "UpdatedAt" = NOW()
      WHERE "Id" = $1
      RETURNING "Id", "Name", "IsActive"
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm!' });
    }

    res.json({ 
      message: 'Đã cập nhật trạng thái sản phẩm!',
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi toggleProductStatus:', error);
    res.status(500).json({ error: 'Lỗi server khi thay đổi trạng thái!' });
  }
};

/**
 * @swagger
 * /api/products/admin/all:
 *   get:
 *     summary: Lấy tất cả sản phẩm kể cả inactive (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tất cả sản phẩm
 */
const getAllProductsAdmin = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập!' });
    }

    const { category, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query (không filter IsActive)
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`LOWER("Category") = LOWER($${paramIndex})`);
      queryParams.push(category);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`LOWER("Name") LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count
    const countQuery = `SELECT COUNT(*) as total FROM "Products" ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);
    // Get products
    queryParams.push(limit, offset);
    const productsQuery = `
      SELECT 
        "Id", "Name", "Slug", "ShortDesc", "Description",
        "Category", "Brand", "Image", "ImageURL", "Price", 
        "Stock", "IsActive", "CreatedAt", "UpdatedAt"
      FROM "Products"
      ${whereClause}
      ORDER BY "CreatedAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

 const result = await db.query(productsQuery, queryParams);

const baseUrl = `${req.protocol}://${req.get('host')}`;
const mappedRows = result.rows.map(r => {
  let imageUrl = `${baseUrl}/images/default.jpg`;
  
  // ✅ Ưu tiên ImageURL (Cloudinary)
  if (r.ImageURL && r.ImageURL.trim() !== '' && !isGenericImage(r.ImageURL)) {
    let cloudUrl = r.ImageURL.trim();
    // Nếu không bắt đầu bằng http, build full Cloudinary URL
    if (!cloudUrl.startsWith('http://') && !cloudUrl.startsWith('https://')) {
      cloudUrl = `https://res.cloudinary.com/dd1onmi19/image/upload/${cloudUrl}`;
    }
    imageUrl = cloudUrl;
    console.log('✅ Admin - Using Cloudinary URL:', imageUrl);
  } else if (r.Image && !isGenericImage(r.Image)) {
    const image = r.Image;
    if (image.startsWith('http')) {
      imageUrl = image;
    } else if (image.startsWith('/images/')) {
      imageUrl = `${baseUrl}${image}`;
    } else {
      imageUrl = `${baseUrl}/images/${image}`;
    }
    console.log('⚠️ Admin - Using fallback image:', imageUrl);
  } else {
    const fallbackUrl = buildLocalProductImageUrl(baseUrl, r.Name);
    if (fallbackUrl) {
      imageUrl = fallbackUrl;
      console.log('🖼️ Admin - Using local fallback image:', imageUrl);
    } else {
      console.log('❌ Admin - No image data for product ID:', r.Id, '- using default');
    }
  }

  return {
    ...r,
    ImageURL: imageUrl, 
  };
});

res.json({
  products: mappedRows,
  pagination: {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalItems / limit),
    totalItems: totalItems,
    itemsPerPage: parseInt(limit)
  }
});

} catch (error) {
  console.error('Lỗi getAllProductsAdmin:', error);
  res.status(500).json({ error: 'Lỗi server khi lấy danh sách sản phẩm!' });
}
};


/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Lấy 1 sản phẩm ngẫu nhiên từ 30 sản phẩm đầu
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Sản phẩm nổi bật ngẫu nhiên
 */
const getFeaturedProduct = async (req, res) => {
  try {
    // Lấy 30 sản phẩm đầu tiên (hoạt động)
    const query = `
      SELECT 
        "Id", 
        "ProductName", 
        "Category", 
        "Price", 
        "Stock", 
        "ImageURL", 
        "ShortDesc",
        "IsActive"
      FROM "Products"
      WHERE "IsActive" = true
      ORDER BY "CreatedAt" DESC
      LIMIT 30
    `;
    
    const result = await db.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không có sản phẩm nào!' });
    }
    
    // Random 1 sản phẩm từ 30 sản phẩm
    const randomIndex = Math.floor(Math.random() * result.rows.length);
    const product = result.rows[randomIndex];
    
    // Map sang format frontend
    const fallbackUrl = buildLocalProductImageUrl(`${req.protocol}://${req.get('host')}`, product.ProductName || product.Name);
    const rawFeaturedImage = product.ImageURL;
    let featuredUrl = null;
    if (rawFeaturedImage && !isGenericImage(rawFeaturedImage)) {
      if (rawFeaturedImage.startsWith('http://') || rawFeaturedImage.startsWith('https://')) {
        featuredUrl = rawFeaturedImage;
      } else {
        featuredUrl = `${req.protocol}://${req.get('host')}/images/products/${rawFeaturedImage}`;
      }
    }

    const mappedProduct = {
      id: product.Id,
      name: product.ProductName,
      category: product.Category,
      price: parseFloat(product.Price),
      stock: product.Stock,
      imageUrl: featuredUrl || fallbackUrl || null,
      shortDesc: product.ShortDesc,
      isActive: product.IsActive
    };
    
    res.json({ product: mappedProduct });
  } catch (error) {
    console.error('Lỗi getFeaturedProduct:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy sản phẩm nổi bật!' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getFeaturedProduct,
  // Admin functions
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getAllProductsAdmin
};

const db = require('../../db_config');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Lấy thông tin cá nhân
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.Id;

    const query = `
      SELECT 
        "Id", "Username", "Fullname", "Email", 
        "Phone", "Address", "Role", "Avatar", "CreatedAt"
      FROM "Users"
      WHERE "Id" = $1
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin người dùng!' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Lỗi getProfile:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin cá nhân!' });
  }
};

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Cập nhật thông tin cá nhân
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.Id;
    const { fullname, phone, address, avatar } = req.body;

    // Build query động
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (fullname !== undefined) {
      updates.push(`"Fullname" = $${paramIndex}`);
      values.push(fullname);
      paramIndex++;
    }

    if (phone !== undefined) {
      updates.push(`"Phone" = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }

    if (address !== undefined) {
      updates.push(`"Address" = $${paramIndex}`);
      values.push(address);
      paramIndex++;
    }

    // Thêm avatar (base64)
    if (avatar !== undefined) {
      updates.push(`"Avatar" = $${paramIndex}`);
      values.push(avatar);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Không có thông tin để cập nhật!' });
    }

    values.push(userId);

    const query = `
      UPDATE "Users"
      SET ${updates.join(', ')}, "UpdatedAt" = NOW()
      WHERE "Id" = $${paramIndex}
      RETURNING "Id", "Fullname", "Phone", "Address", "Avatar"
    `;

    const result = await db.query(query, values);

    res.json({
      message: 'Cập nhật thông tin thành công!',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi updateProfile:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật thông tin!' });
  }
};

/**
 * @swagger
 * /api/users/change-password:
 *   patch:
 *     summary: Đổi mật khẩu
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.Id;
    const { currentPassword, newPassword } = req.body;

    // Validate
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Thiếu thông tin mật khẩu!' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
    }

    // Lấy mật khẩu hiện tại
    const query = 'SELECT "Password" FROM "Users" WHERE "Id" = $1';
    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng!' });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].Password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng!' });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    await db.query(
      'UPDATE "Users" SET "Password" = $1, "UpdatedAt" = NOW() WHERE "Id" = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Đổi mật khẩu thành công!' });

  } catch (error) {
    console.error('Lỗi changePassword:', error);
    res.status(500).json({ error: 'Lỗi server khi đổi mật khẩu!' });
  }
};

/**
 * ============== ADMIN FUNCTIONS ==============
 */

/**
 * @swagger
 * /api/users/admin/all:
 *   get:
 *     summary: Lấy danh sách tất cả users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo username, email, fullname
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Lọc theo role (user, admin)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách users
 */
const getAllUsers = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập!' });
    }

    const { search, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(
        LOWER("Username") LIKE LOWER($${paramIndex}) OR 
        LOWER("Email") LIKE LOWER($${paramIndex}) OR 
        LOWER("Fullname") LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`"Role" = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM "Users" ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalItems = parseInt(countResult.rows[0].total);

    // Get users
    queryParams.push(limit, offset);
    const usersQuery = `
      SELECT 
        "Id", "Username", "Fullname", "Email", "Phone", 
        "Address", "Role", "Avatar", "CreatedAt", "UpdatedAt"
      FROM "Users"
      ${whereClause}
      ORDER BY "CreatedAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await db.query(usersQuery, queryParams);

    res.json({
      users: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems: totalItems,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Lỗi getAllUsers:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách người dùng!' });
  }
};

/**
 * @swagger
 * /api/users/admin/:id:
 *   get:
 *     summary: Lấy thông tin chi tiết 1 user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin user
 */
const getUserById = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập!' });
    }

    const { id } = req.params;

    const query = `
      SELECT 
        "Id", "Username", "Fullname", "Email", "Phone", 
        "Address", "Role", "Avatar", "CreatedAt", "UpdatedAt"
      FROM "Users"
      WHERE "Id" = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng!' });
    }

    // Get user's orders count
    const ordersCount = await db.query(
      'SELECT COUNT(*) as total FROM "Orders" WHERE "UserId" = $1',
      [id]
    );

    // Get user's total spending
    const totalSpending = await db.query(
      'SELECT SUM("Total") as total FROM "Orders" WHERE "UserId" = $1 AND "Status" != $2',
      [id, 'cancelled']
    );

    res.json({
      user: result.rows[0],
      stats: {
        ordersCount: parseInt(ordersCount.rows[0].total),
        totalSpending: parseFloat(totalSpending.rows[0].total || 0)
      }
    });

  } catch (error) {
    console.error('Lỗi getUserById:', error);
    res.status(500).json({ error: 'Lỗi server khi lấy thông tin người dùng!' });
  }
};

/**
 * @swagger
 * /api/users/admin/:id:
 *   patch:
 *     summary: Cập nhật thông tin user (Admin only)
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
 *               role:
 *                 type: string
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
const updateUser = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền cập nhật!' });
    }

    const { id } = req.params;
    const { role, fullname, email, phone, address } = req.body;

    // Build dynamic query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (role !== undefined) {
      updates.push(`"Role" = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (fullname !== undefined) {
      updates.push(`"Fullname" = $${paramIndex}`);
      values.push(fullname);
      paramIndex++;
    }

    if (email !== undefined) {
      updates.push(`"Email" = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (phone !== undefined) {
      updates.push(`"Phone" = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }

    if (address !== undefined) {
      updates.push(`"Address" = $${paramIndex}`);
      values.push(address);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Không có thông tin để cập nhật!' });
    }

    values.push(id);

    const query = `
      UPDATE "Users"
      SET ${updates.join(', ')}, "UpdatedAt" = NOW()
      WHERE "Id" = $${paramIndex}
      RETURNING "Id", "Username", "Fullname", "Email", "Phone", "Address", "Role"
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng!' });
    }

    res.json({
      message: 'Cập nhật thông tin người dùng thành công!',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Lỗi updateUser:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật người dùng!' });
  }
};

/**
 * @swagger
 * /api/users/admin/:id:
 *   delete:
 *     summary: Xóa user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
const deleteUser = async (req, res) => {
  try {
    // Check admin role
    if (req.user.Role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền xóa!' });
    }

    const { id } = req.params;

    // Check if user is admin (prevent deleting admin)
    const checkQuery = 'SELECT "Role" FROM "Users" WHERE "Id" = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng!' });
    }

    if (checkResult.rows[0].Role === 'admin') {
      return res.status(400).json({ error: 'Không thể xóa tài khoản admin!' });
    }

    // Delete user
    await db.query('DELETE FROM "Users" WHERE "Id" = $1', [id]);

    res.json({ message: 'Đã xóa người dùng thành công!' });

  } catch (error) {
    console.error('Lỗi deleteUser:', error);
    res.status(500).json({ error: 'Lỗi server khi xóa người dùng!' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  // Admin functions
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};

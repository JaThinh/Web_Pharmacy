const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// ========== USER ROUTES ==========
// GET /api/users/me - Thông tin cá nhân
router.get('/me', getProfile);

// PATCH /api/users/me - Cập nhật thông tin
router.patch('/me', updateProfile);

// PATCH /api/users/change-password - Đổi mật khẩu
router.patch('/change-password', changePassword);

// ========== ADMIN ROUTES ==========
// GET /api/users/admin/all - Danh sách tất cả users (Admin only)
router.get('/admin/all', getAllUsers);

// GET /api/users/admin/:id - Chi tiết 1 user (Admin only)
router.get('/admin/:id', getUserById);

// PATCH /api/users/admin/:id - Cập nhật user (Admin only)
router.patch('/admin/:id', updateUser);

// DELETE /api/users/admin/:id - Xóa user (Admin only)
router.delete('/admin/:id', deleteUser);

module.exports = router;

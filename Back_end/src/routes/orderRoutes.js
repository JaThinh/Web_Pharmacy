const express = require('express');
const router = express.Router();
const { 
  checkout, 
  getOrders, 
  getOrderById, 
  cancelOrder,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
  getOrderStatistics
} = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// ========== USER ROUTES ==========
// POST /api/orders/checkout - Đặt hàng
router.post('/checkout', checkout);

// GET /api/orders - Danh sách đơn hàng của user
router.get('/', getOrders);

// GET /api/orders/:id - Chi tiết đơn hàng
router.get('/:id', getOrderById);

// PATCH /api/orders/:id/cancel - Hủy đơn hàng
router.patch('/:id/cancel', cancelOrder);

// ========== ADMIN ROUTES ==========
// GET /api/orders/admin/statistics - Thống kê đơn hàng (Admin only)
router.get('/admin/statistics', getOrderStatistics);

// GET /api/orders/admin/all - Tất cả đơn hàng (Admin only)
router.get('/admin/all', getAllOrders);

// GET /api/orders/admin/:id - Chi tiết đơn hàng (Admin only)
router.get('/admin/:id', getOrderByIdAdmin);

// PATCH /api/orders/admin/:id/status - Cập nhật trạng thái (Admin only)
router.patch('/admin/:id/status', updateOrderStatus);

module.exports = router;

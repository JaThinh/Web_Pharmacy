const express = require('express');
const router = express.Router();
const { 
  getDashboardStatistics,
  getRevenueChart
} = require('../controllers/dashboardController');

// Import cả 2 middleware từ file auth.js
const { authenticateToken, isAdmin } = require('../middleware/auth');



// Thay vào đó, áp dụng cả 2 middleware cho từng route
// Yêu cầu: 1. Phải đăng nhập (authenticateToken) VÀ 2. Phải là admin (isAdmin)

// GET /api/dashboard/statistics - Thống kê tổng quan
router.get('/statistics', [authenticateToken, isAdmin], getDashboardStatistics);

// GET /api/dashboard/revenue-chart - Dữ liệu biểu đồ doanh thu
router.get('/revenue-chart', [authenticateToken, isAdmin], getRevenueChart);


module.exports = router;
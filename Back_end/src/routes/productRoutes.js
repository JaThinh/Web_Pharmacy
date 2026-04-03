const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById,
  getFeaturedProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getAllProductsAdmin
} = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');

// ========== PUBLIC ROUTES ==========
// GET /api/products/featured - Sản phẩm nổi bật ngẫu nhiên
router.get('/featured', getFeaturedProduct);

// GET /api/products - Danh sách sản phẩm (chỉ active)
router.get('/', getProducts);

// GET /api/products/:id - Chi tiết sản phẩm
router.get('/:id', getProductById);

// ========== ADMIN ROUTES (cần authentication) ==========
// GET /api/products/admin/all - Tất cả sản phẩm (Admin only)
router.get('/admin/all', authenticateToken, getAllProductsAdmin);

// POST /api/products/admin - Tạo sản phẩm mới (Admin only)
router.post('/admin', authenticateToken, createProduct);

// PATCH /api/products/admin/:id - Cập nhật sản phẩm (Admin only)
router.patch('/admin/:id', authenticateToken, updateProduct);

// PATCH /api/products/admin/:id/toggle - Bật/tắt sản phẩm (Admin only)
router.patch('/admin/:id/toggle', authenticateToken, toggleProductStatus);

// DELETE /api/products/admin/:id - Xóa sản phẩm (Admin only)
router.delete('/admin/:id', authenticateToken, deleteProduct);

module.exports = router;

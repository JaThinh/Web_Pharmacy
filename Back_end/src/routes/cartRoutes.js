const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

// Tất cả routes đều cần authentication
router.use(authenticateToken);

// GET /api/cart - Xem giỏ hàng
router.get('/', getCart);

// POST /api/cart/items - Thêm vào giỏ
router.post('/items', addToCart);

// PATCH /api/cart/items/:id - Cập nhật số lượng
router.patch('/items/:id', updateCartItem);

// DELETE /api/cart/items/:id - Xóa khỏi giỏ
router.delete('/items/:id', removeFromCart);

module.exports = router;

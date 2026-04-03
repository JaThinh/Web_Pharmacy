const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Import từng function riêng biệt để debug
const {
  getCommentsByProduct,
  addComment,
  checkCanReview,
  deleteComment
} = require('../controllers/commentController');

// GET /api/comments/check/:productId - Kiểm tra quyền đánh giá (cần đăng nhập)
//  PHẢI ĐẶT TRƯỚC /:productId để không bị nhầm
router.get('/check/:productId', authenticateToken, checkCanReview);

//  GET /api/comments/:productId - Lấy tất cả đánh giá của sản phẩm (public)
router.get('/:productId', getCommentsByProduct);

//  POST /api/comments - Thêm đánh giá mới (cần đăng nhập)
router.post('/', authenticateToken, addComment);

//  DELETE /api/comments/:id - Xóa đánh giá (admin hoặc chủ comment)
router.delete('/:id', authenticateToken, deleteComment);

module.exports = router;

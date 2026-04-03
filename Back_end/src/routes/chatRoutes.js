// Chat Routes
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatThread:
 *       type: object
 *       required:
 *         - UserId
 *         - Title
 *       properties:
 *         Id:
 *           type: integer
 *           description: ID của thread
 *         UserId:
 *           type: integer
 *           description: ID của user tạo thread
 *         Title:
 *           type: string
 *           description: Tiêu đề cuộc hội thoại
 *         AttachmentType:
 *           type: string
 *           enum: [product, order, general]
 *           description: Loại đính kèm
 *         AttachmentId:
 *           type: string
 *           description: ID của đối tượng đính kèm
 *         Status:
 *           type: string
 *           enum: [active, closed]
 *           description: Trạng thái thread
 *         CreatedAt:
 *           type: string
 *           format: date-time
 *         UpdatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ChatMessage:
 *       type: object
 *       required:
 *         - ThreadId
 *         - SenderId
 *         - SenderRole
 *         - Content
 *       properties:
 *         Id:
 *           type: integer
 *           description: ID của tin nhắn
 *         ThreadId:
 *           type: integer
 *           description: ID của thread
 *         SenderId:
 *           type: integer
 *           description: ID của người gửi
 *         SenderRole:
 *           type: string
 *           enum: [admin, customer]
 *           description: Vai trò người gửi
 *         Content:
 *           type: string
 *           description: Nội dung tin nhắn
 *         CreatedAt:
 *           type: string
 *           format: date-time
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Lấy danh sách threads của user
router.get('/threads', authenticateToken, chatController.getUserThreads);

// Lấy tất cả threads (Admin only)
router.get('/admin/threads', authenticateToken, chatController.getAllThreads);

// Tạo thread mới
router.post('/threads', authenticateToken, chatController.createThread);

// Lấy tin nhắn trong thread
router.get('/threads/:threadId/messages', authenticateToken, chatController.getThreadMessages);

// Gửi tin nhắn
router.post('/threads/:threadId/messages', authenticateToken, chatController.sendMessage);

// Đóng thread (chỉ admin)
router.patch('/threads/:threadId/close', authenticateToken, chatController.closeThread);

// Thống kê chat (chỉ admin)
router.get('/stats', authenticateToken, chatController.getChatStats);

module.exports = router;
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API đăng ký, đăng nhập, tạo admin
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email,password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *               fullname: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: 
 *         description: Tạo tài khoản thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     Id: { type: string }
 *                     Username: { type: string }
 *                     Fullname: { type: string }
 *                     Email: { type: string }
 *                     Phone: { type: string }
 *                     Role: { type: string }
 *                 token: { type: string }
 *       400: { description: Dữ liệu không hợp lệ }
 */
router.post("/register", authController.registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email,password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Đăng nhập thành công }
 *       401: { description: Sai email hoặc mật khẩu }
 */
router.post("/login", authController.loginUser);

/**
 * @swagger
 * /api/auth/admin-init:
 *   post:
 *     summary: Khởi tạo admin (chỉ 1 lần)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email,password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Admin đã tạo }
 *       409: { description: Admin đã tồn tại }
 */
router.post("/admin-init", authController.createAdmin);

module.exports = router;

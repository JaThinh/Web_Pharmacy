/*
 * Tên file: Back_End/src/routes/paymentRoutes.js
 * (Cập nhật)
 */
const express = require('express');
// SỬA ĐỔI: Import cả 2 hàm
const { handleMomoIPN, handleZaloPayIPN } = require('../controllers/paymentController');

const router = express.Router();

// Route MoMo (GIỮ NGUYÊN) [cite: paymentRoutes.js]
router.post('/momo-ipn', handleMomoIPN);

// BỔ SUNG: Route ZaloPay IPN
// Đây là link chúng ta khai báo trong .env (ZALOPAY_IPN_URL)
router.post('/zalopay-ipn', handleZaloPayIPN);

module.exports = router;
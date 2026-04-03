const axios = require('axios');
const crypto = require('crypto');
const db = require('../../db_config');

// Lấy thông tin từ file .env
const partnerCode = process.env.MOMO_PARTNER_CODE;
const accessKey = process.env.MOMO_ACCESS_KEY;
const secretKey = process.env.MOMO_SECRET_KEY;
const apiEndpoint = process.env.MOMO_API_ENDPOINT;
const redirectUrl = process.env.MOMO_REDIRECT_URL;
const ipnUrl = process.env.MOMO_IPN_URL;

/**
 * Tạo chữ ký HMAC SHA256 cho MoMo
 * @param {string} rawSignature - Chuỗi dữ liệu thô cần ký
 * @returns {string} Chữ ký hex
 */
const createSignature = (rawSignature) => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');
};

/**
 * Tạo một yêu cầu thanh toán MoMo
 * @param {string} orderId - Mã đơn hàng của hệ thống bạn (kiểu số/string)
 * @param {number} amount - Tổng số tiền thanh toán
 * @param {string} orderInfo - Thông tin đơn hàng (ví dụ: "Thanh toan don hang #123")
 * @returns {Promise<object>} Dữ liệu phản hồi từ MoMo (chứa payUrl)
 */
const createMomoPayment = async (orderId, amount, orderInfo) => {
  const momoOrderId = `MOMO_${orderId}_${Date.now()}`;
  const requestId = momoOrderId;
  const requestType = "captureWallet";
  const extraData = ""; // Dữ liệu thêm (nếu cần)

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = createSignature(rawSignature);

  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount: amount.toString(),
    orderId: momoOrderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'vi'
  };

  try {
    console.log("Đang gửi yêu cầu thanh toán MoMo:", JSON.stringify(requestBody));
    
    const response = await axios.post(apiEndpoint, requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Cập nhật CSDL (dùng pool)
    try {
      // Bạn cần thêm cột MomoRequestId (VARCHAR(255)) vào bảng Orders
      await db.query('UPDATE "Orders" SET "MomoRequestId" = $1 WHERE "Id" = $2', [requestId, orderId]);
    } catch (dbError) {
      console.error("Lỗi khi cập nhật MomoRequestId vào CSDL:", dbError.message);
      // Có thể bảng Orders chưa có cột MomoRequestId
    }
    
    console.log("MoMo Response:", response.data);
    return response.data;

  } catch (error) {
    console.error("Lỗi khi gọi API MoMo:", error.response ? error.response.data : error.message);
    throw new Error('Tạo thanh toán MoMo thất bại');
  }
};

// Xuất file theo chuẩn CommonJS
module.exports = {
  createMomoPayment
};
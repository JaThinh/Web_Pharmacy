/*
 * Tên file: Back_End/src/services/zaloPayService.js
 * File mới
 */
const axios = require('axios');
const crypto = require('crypto'); // Dùng native crypto
const qs = require('qs'); // Dùng qs

// 1. Lấy config từ .env
const config = {
  appid: process.env.ZALOPAY_APPID,
  key1: process.env.ZALOPAY_KEY1,
  key2: process.env.ZALOPAY_KEY2,
  endpoint: process.env.ZALOPAY_ENDPOINT,
  ipn_url: process.env.ZALOPAY_IPN_URL,
  redirect_url: process.env.ZALOPAY_REDIRECT_URL,
};

/**
 * Tạo yêu cầu thanh toán ZaloPay
 * @param {object} orderInfo
 * @param {string} orderInfo.apptransid - Mã đơn hàng (chính là Order.Code)
 * @param {number} orderInfo.totalAmount - Tổng tiền
 * @param {string} orderInfo.description - Mô tả
 * @param {string | number} orderInfo.userId - ID người dùng
 */
async function createPayment(orderInfo) {
  
  const { apptransid, totalAmount, description, userId } = orderInfo;

  const embed_data = {
    redirecturl: config.redirect_url,
  };

  const items = []; // Chi tiết sản phẩm, có thể để trống
  
  const order = {
    appid: config.appid,
    apptransid: apptransid, // Mã giao dịch (duy nhất, dùng Order.Code)
    appuser: userId ? userId.toString() : 'guest',
    apptime: Date.now(),
    item: JSON.stringify(items),
    embeddata: JSON.stringify(embed_data), // Tên đúng là embeddata
    amount: totalAmount,
    description: description,
    bankcode: 'zalopayapp',
    ipnUrl: config.ipn_url, // Tên đúng là ipnUrl
  };

  // Tạo chữ ký (mac)
  // Data: appid|apptransid|appuser|amount|apptime|embeddata|item
  const data = `${order.appid}|${order.apptransid}|${order.appuser}|${order.amount}|${order.apptime}|${order.embeddata}|${order.item}`;
  
  // Dùng native crypto giống file mẫu của bạn bạn
  order.mac = crypto.createHmac('sha256', config.key1).update(data).digest('hex');

  try {
    // Gọi API ZaloPay (dùng qs.stringify)
    const body = qs.stringify(order);
    const response = await axios.post(config.endpoint, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    // Trả về orderurl (tên key của ZaloPay)
    return {
      payUrl: response.data.orderurl,
      app_trans_id: apptransid
    };

  } catch (error) {
    console.error("ZaloPay Create Payment Error:", error.response ? error.response.data : error.message);
    throw new Error("Lỗi khi tạo thanh toán ZaloPay");
  }
}

/**
 * Xác thực Callback (IPN) từ ZaloPay
 * @param {string} dataStr - Dữ liệu ZaloPay gửi qua (JSON string)
 * @param {string} mac - Chữ ký ZaloPay gửi qua
 */
function verifyCallback(dataStr, mac) {
  try {
    // Dùng Key 2 để xác thực IPN
    const hmac = crypto.createHmac('sha256', config.key2).update(dataStr).digest('hex');

    if (hmac !== mac) {
      console.warn('ZaloPay IPN Verification: INVALID MAC');
      return {
        return_code: -1,
        return_message: 'invalid mac',
      };
    }
    
    // Xác thực thành công
    console.log('ZaloPay IPN Verification: SUCCESS');
    return {
      return_code: 1,
      return_message: 'success',
    };

  } catch (ex) {
    console.error('ZaloPay IPN Verification Error:', ex.message);
    return {
      return_code: 0,
      return_message: ex.message,
    };
  }
}

module.exports = {
  createPayment,
  verifyCallback
};
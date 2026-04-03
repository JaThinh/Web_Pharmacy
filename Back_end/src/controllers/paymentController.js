/*
 * Tên file: Back_End/src/controllers/paymentController.js
 * (Cập nhật)
 */
const db = require('../../db_config');
const crypto = require('crypto');
// BỔ SUNG: Import service ZaloPay
const { verifyCallback: verifyZaloPayCallback } = require('../services/zaloPayService');

// Lấy key từ .env để xác thực chữ ký của MoMo
const secretKey = process.env.MOMO_SECRET_KEY;

/**
 * Xử lý IPN (Instant Payment Notification) từ MoMo (GIỮ NGUYÊN)
 */
const handleMomoIPN = async (req, res) => {
  const {
    partnerCode,
    orderId, // Đây là orderId của MoMo (ví dụ: MOMO_123_timestamp)
    requestId, // Đây là requestId (cũng là MoMo orderId)
    amount,
    orderInfo,
    orderType,
    transId,
    resultCode,
    message,
    payType,
    responseTime,
    extraData,
    signature // Chữ ký của MoMo gửi qua
  } = req.body;

  console.log("--- Đã nhận MoMo IPN ---:", req.body);

  // 1. Tạo chữ ký (giống hệt lúc tạo link) để XÁC THỰC
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${process.env.MOMO_IPN_URL}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&redirectUrl=${process.env.MOMO_REDIRECT_URL}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  // 2. So sánh chữ ký
  if (signature !== expectedSignature) {
    console.error("MoMo IPN: Chữ ký không hợp lệ!");
    // Báo lỗi cho MoMo, họ sẽ không gửi lại
    return res.status(400).json({ resultCode: 99, message: 'Invalid Signature' });
  }

  // 3. Xử lý Logic nghiệp vụ (Trừ kho, Xóa giỏ)
  // Chỉ xử lý khi thanh toán thành công (resultCode == 0)
  if (resultCode === 0) {
    console.log(`Thanh toán MoMo thành công cho đơn hàng (requestId): ${requestId}`);
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // 3a. Tìm đơn hàng trong CSDL bằng MomoRequestId
      // Đây là bước mấu chốt: tìm đơn hàng 'pending' khớp với requestId
      const orderResult = await client.query(
        'SELECT * FROM "Orders" WHERE "MomoRequestId" = $1 AND "Status" = $2 FOR UPDATE',
        [requestId, 'pending'] // Chỉ tìm đơn hàng 'pending' và KHÓA HÀNG (FOR UPDATE)
      );

      if (orderResult.rows.length === 0) {
        // Đơn hàng không tồn tại hoặc đã được xử lý (ví dụ IPN gọi 2 lần)
        console.warn(`MoMo IPN: Không tìm thấy đơn hàng ${requestId} hoặc đã xử lý.`);
        await client.query('ROLLBACK');
        // Vẫn trả 200 để MoMo không gửi lại
        return res.status(200).json({ resultCode: 0, message: 'Order processed or not found' });
      }

      const order = orderResult.rows[0];
      const orderId_internal = order.Id; // ID đơn hàng trong hệ thống
      const userId = order.UserId;

      // 3b. Lấy các sản phẩm trong đơn hàng
      const itemsResult = await client.query(
        'SELECT "ProductId", "Qty" FROM "OrderItems" WHERE "OrderId" = $1',
        [orderId_internal]
      );
      const orderItems = itemsResult.rows;

      // 3c. TRỪ KHO
      for (const item of orderItems) {
        await client.query(
          'UPDATE "Products" SET "Stock" = "Stock" - $1 WHERE "Id" = $2',
          [item.Qty, item.ProductId]
        );
      }
      
      // 3d. XÓA GIỎ HÀNG
      await client.query('DELETE FROM "CartItems" WHERE "UserId" = $1', [userId]);

      // 3e. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
      await client.query(
        'UPDATE "Orders" SET "Status" = $1, "MomoTransId" = $2 WHERE "Id" = $3',
        ['confirmed', transId.toString(), orderId_internal] // Chuyển sang 'confirmed'
      );
      
      await client.query('COMMIT');
      console.log(`Đã xử lý thành công (Trừ kho & Xóa giỏ) cho đơn hàng ${orderId_internal}.`);
      
      // Trả về 200 cho MoMo (bắt buộc)
      return res.status(200).json({ resultCode: 0, message: 'Success' });

    } catch (error) {
      console.error("Lỗi nghiêm trọng khi xử lý IPN:", error);
      await client.query('ROLLBACK');
      // Trả 500 để MoMo biết và gửi lại IPN
      return res.status(500).json({ resultCode: 99, message: 'Server Error' });
    } finally {
      client.release();
    }
    
  } else {
    // Thanh toán thất bại (resultCode != 0)
    console.warn(`Thanh toán MoMo thất bại cho ${requestId}, resultCode: ${resultCode}`);
    // Cập nhật trạng thái đơn hàng (ví dụ: 'cancelled')
    await db.pool.query('UPDATE "Orders" SET "Status" = $1 WHERE "MomoRequestId" = $2 AND "Status" = $3', 
        ['cancelled', requestId, 'pending']);
    
    // Vẫn trả 200 cho MoMo
    return res.status(200).json({ resultCode: 0, message: 'Failed transaction logged' });
  }
};

// BỔ SUNG: HÀM XỬ LÝ ZALOPAY IPN (Mirror logic MoMo)
const handleZaloPayIPN = async (req, res) => {
  const { data, mac } = req.body;

  console.log("--- Đã nhận ZaloPay IPN ---:", req.body);

  try {
    // 1. Xác thực MAC
    const verification = verifyZaloPayCallback(data, mac);

    if (verification.return_code !== 1) {
      // MAC không hợp lệ
      console.error("ZaloPay IPN: Chữ ký không hợp lệ!");
      return res.status(200).json(verification); // Trả 200 cho ZaloPay
    }

    // 2. MAC hợp lệ, xử lý logic đơn hàng
    const zaloData = JSON.parse(data);
    const app_trans_id = zaloData.apptransid; // Mã đơn hàng (Order.Code)

    // 3. Kiểm tra trạng thái thanh toán
    if (zaloData.return_code == 1) {
      // Thanh toán THÀNH CÔNG
      console.log(`Thanh toán ZaloPay thành công cho đơn hàng (Code): ${app_trans_id}`);
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // 3a. Tìm đơn hàng 'pending' bằng Order.Code (chính là app_trans_id)
        const orderResult = await client.query(
          'SELECT * FROM "Orders" WHERE "Code" = $1 AND "Status" = $2 FOR UPDATE',
          [app_trans_id, 'pending']
        );

        if (orderResult.rows.length === 0) {
          console.warn(`ZaloPay IPN: Không tìm thấy đơn hàng ${app_trans_id} hoặc đã xử lý.`);
          await client.query('ROLLBACK');
          return res.status(200).json(verification);
        }

        const order = orderResult.rows[0];
        const orderId_internal = order.Id;
        const userId = order.UserId;

        // 3b. Lấy các sản phẩm trong đơn hàng
        const itemsResult = await client.query(
          'SELECT "ProductId", "Qty" FROM "OrderItems" WHERE "OrderId" = $1',
          [orderId_internal]
        );
        const orderItems = itemsResult.rows;

        // 3c. TRỪ KHO (Logic giống MoMo IPN)
        for (const item of orderItems) {
          await client.query(
            'UPDATE "Products" SET "Stock" = "Stock" - $1 WHERE "Id" = $2',
            [item.Qty, item.ProductId]
          );
        }
        
        // 3d. XÓA GIỎ HÀNG (Logic giống MoMo IPN)
        // (Về lý thuyết giỏ hàng đã bị xóa lúc checkout, nhưng chạy lại cho chắc)
        await client.query('DELETE FROM "CartItems" WHERE "UserId" = $1', [userId]);

        // 3e. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
        await client.query(
          'UPDATE "Orders" SET "Status" = $1 WHERE "Id" = $2',
          ['confirmed', orderId_internal] // Chuyển sang 'confirmed'
        );
        
        await client.query('COMMIT');
        console.log(`Đã xử lý thành công (Trừ kho) cho đơn hàng ${orderId_internal}.`);
        
        return res.status(200).json(verification); // Trả 200 cho ZaloPay

      } catch (error) {
        console.error("Lỗi nghiêm trọng khi xử lý ZaloPay IPN:", error);
        await client.query('ROLLBACK');
        return res.status(500).json({ return_code: 99, return_message: 'Server Error' });
      } finally {
        client.release();
      }
      
    } else {
      // Thanh toán thất bại (resultCode != 0)
      console.warn(`Thanh toán ZaloPay thất bại cho ${app_trans_id}`);
      await db.pool.query(
        'UPDATE "Orders" SET "Status" = $1 WHERE "Code" = $2 AND "Status" = $3', 
        ['cancelled', app_trans_id, 'pending']
      );
      
      return res.status(200).json(verification);
    }
  } catch (error) {
    console.error("handleZaloPayIPN Error:", error);
    res.status(500).json({ return_code: -1, return_message: "Server Error" });
  }
};


// SỬA ĐỔI: Thêm handleZaloPayIPN
module.exports = {
  handleMomoIPN,
  handleZaloPayIPN
};
/*
 * Tên file: Front_end/src/pages/user/Checkout/CheckoutSuccess.jsx
 * (Cập nhật)
 */
// SỬA: Thêm useContext (GIỮ NGUYÊN)
import React, { useEffect, useContext } from 'react'; 
import { Link, useSearchParams } from 'react-router-dom';
import './CheckoutSuccess.css';

// SỬA: Import AuthContext (GIỮ NGUYÊN) [cite: CheckoutSuccess.jsx]
// (Giả sử đường dẫn này là đúng)
import { AuthContext } from '../../../context/AuthContext/AuthContext'; 

function CheckoutSuccess() {
  const [searchParams] = useSearchParams();

  // SỬA: Lấy hàm cập nhật giỏ hàng từ AuthContext (GIỮ NGUYÊN) [cite: CheckoutSuccess.jsx]
  const { setCartCount } = useContext(AuthContext); 

  // Đọc các tham số MoMo trả về (để kiểm tra) [cite: CheckoutSuccess.jsx]
  const momoResultCode = searchParams.get('resultCode');
  const momoMessage = searchParams.get('message');
  const momoOrderId = searchParams.get('orderId'); 
  
  // BỔ SUNG: Đọc các tham số ZaloPay trả về
  // ZaloPay (sandbox) trả về: status=1 (thành công), status=0 (thất bại)
  const zaloStatus = searchParams.get('status');
  const zaloAppTransID = searchParams.get('apptransid'); // Mã đơn hàng

  // BỔ SUNG: Kiểm tra cả MoMo và ZaloPay
  const isSuccess = momoResultCode === '0' || zaloStatus === '1';

  // Xóa giỏ hàng (nếu thành công) (GIỮ NGUYÊN LOGIC) [cite: CheckoutSuccess.jsx]
  useEffect(() => {
    if (isSuccess) {
      if (typeof setCartCount === 'function') {
        console.log("Thanh toán thành công, cập nhật badge giỏ hàng về 0.");
        setCartCount(0); // Cập nhật badge về 0
      }
    }
  }, [isSuccess, setCartCount]); 

  return (
    <div className="checkout-success-container">
      <div className="success-card">
        {isSuccess ? (
          <>
            <div className="success-icon success">✓</div>
            <h1>Thanh toán thành công!</h1>
            <p>Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đang được xử lý.</p>
            {/* BỔ SUNG: Hiển thị mã giao dịch ZaloPay hoặc MoMo */}
            {momoOrderId && <p>Mã giao dịch MoMo: {momoOrderId}</p>}
            {zaloAppTransID && <p>Mã đơn hàng ZaloPay: {zaloAppTransID}</p>}
          </>
        ) : (
          <>
            <div className="success-icon fail">✕</div>
            <h1>Thanh toán thất bại</h1>
            <p>Đã có lỗi xảy ra trong quá trình thanh toán.</p>
            {/* BỔ SUNG: Hiển thị thông báo lỗi MoMo hoặc ZaloPay */}
            {(momoMessage || zaloStatus) && 
              <p>Thông báo: {momoMessage || `Trạng thái ZaloPay: ${zaloStatus === '0' ? 'Giao dịch bị hủy' : `Lỗi ${zaloStatus}`}`}</p>
            }
          </>
        )}
        
        <div className="success-actions">
          <Link to="/orders" className="btn-primary">
            Xem lịch sử đơn hàng
          </Link>
          <Link to="/shop" className="btn-secondary">
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CheckoutSuccess;
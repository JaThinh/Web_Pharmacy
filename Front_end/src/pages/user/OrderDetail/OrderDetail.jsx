import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderDetail, cancelOrder } from '../../../api';
import ReviewModal from '../../../components/ReviewModal/ReviewModal';
import './OrderDetail.css';

const BACKEND_URL = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5001';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const STATUS_CONFIG = {
    pending: { label: 'Chờ xác nhận', color: '#ffc107', icon: '⏳', description: 'Đơn hàng đang chờ được xác nhận' },
    confirmed: { label: 'Đã xác nhận', color: '#17a2b8', icon: '✓', description: 'Đơn hàng đã được xác nhận và đang chuẩn bị' },
    shipping: { label: 'Đang giao', color: '#007bff', icon: '🚚', description: 'Đơn hàng đang trên đường giao đến bạn' },
    delivered: { label: 'Đã giao', color: '#28a745', icon: '✓', description: 'Đơn hàng đã được giao thành công' },
    cancelled: { label: 'Đã hủy', color: '#dc3545', icon: '✕', description: 'Đơn hàng đã bị hủy' }
  };

  const PAYMENT_METHOD_LABELS = {
    'COD': 'Thanh toán khi nhận hàng (COD)',
    'Banking': 'Chuyển khoản ngân hàng',
    'Momo': 'Ví điện tử MoMo'
  };

  useEffect(() => {
    const loadOrderDetail = async () => {
      try {
        setLoading(true);
        const data = await getOrderDetail(id);
        setOrder(data);
        setError(null);
      } catch (err) {
        console.error("Error loading order detail:", err);
        setError("Không thể tải chi tiết đơn hàng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetail();
  }, [id, refreshKey]);

  const handleCancelOrder = async () => {
    if (window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      try {
        await cancelOrder(id);
        alert('Đã hủy đơn hàng thành công!');
        setRefreshKey(prev => prev + 1); // Trigger reload
      } catch (err) {
        alert(err.response?.data?.error || 'Không thể hủy đơn hàng.');
      }
    }
  };

  const handleReviewProduct = (product) => {
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    console.log('Review submitted successfully');
    // Optionally refresh order data
  };

  if (loading) {
    return <div className="loading">Đang tải chi tiết đơn hàng...</div>;
  }

  if (error || !order) {
    return (
      <div className="error-container">
        <div className="error-message">{error || 'Không tìm thấy đơn hàng'}</div>
        <button className="btn-back" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </button>
      </div>
    );
  }

  const status = STATUS_CONFIG[order.Status] || STATUS_CONFIG.pending;
  const subtotal = (order.items || []).reduce((sum, item) => sum + parseFloat(item.Subtotal), 0);
  const shippingFee = 30000;

  return (
    <div className="order-detail-container">
      {/* Header */}
      <div className="order-detail-header">
        <button className="btn-back" onClick={() => navigate('/orders')}>
          ← Quay lại
        </button>
        <div className="order-header-info">
          <h1>Chi tiết đơn hàng</h1>
          <p className="order-code">Mã đơn: <strong>{order.Code}</strong></p>
          <p className="order-date">
            Ngày đặt: {new Date(order.CreatedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="order-status-section">
        <div 
          className="status-badge" 
          style={{ 
            background: `${status.color}15`,
            color: status.color,
            borderColor: status.color
          }}
        >
          <span className="status-icon">{status.icon}</span>
          <div>
            <div className="status-label">{status.label}</div>
            <div className="status-description">{status.description}</div>
          </div>
        </div>

        {order.Status === 'pending' && (
          <button className="btn-cancel-order" onClick={handleCancelOrder}>
            Hủy đơn hàng
          </button>
        )}
      </div>

      {/* Shipping Info */}
      <div className="info-section">
        <h2>📍 Thông tin giao hàng</h2>
        <div className="info-card">
          <div className="info-row">
            <span className="info-label">Địa chỉ:</span>
            <span className="info-value">{order.Address}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Số điện thoại:</span>
            <span className="info-value">{order.Phone}</span>
          </div>
          {order.Note && (
            <div className="info-row">
              <span className="info-label">Ghi chú:</span>
              <span className="info-value">{order.Note}</span>
            </div>
          )}
          {order.ETA && (
            <div className="info-row">
              <span className="info-label">Dự kiến giao:</span>
              <span className="info-value">
                {new Date(order.ETA).toLocaleString('vi-VN')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Info */}
      <div className="info-section">
        <h2>💳 Phương thức thanh toán</h2>
        <div className="info-card">
          <div className="info-row">
            <span className="info-value">
              {PAYMENT_METHOD_LABELS[order.PaymentMethod] || order.PaymentMethod}
            </span>
          </div>
          {order.PaymentMethod === 'COD' && (
            <p className="payment-note">
              ℹ️ Vui lòng chuẩn bị {parseFloat(order.Total).toLocaleString('vi-VN')}đ khi nhận hàng
            </p>
          )}
        </div>
      </div>

      {/* Products List */}
      <div className="info-section">
        <h2>📦 Danh sách sản phẩm ({order.items?.length || 0} sản phẩm)</h2>
        <div className="products-list">
          {(order.items || []).map((item, index) => {
            // Backend already returns absolute URL, use it directly
            const imageUrl = item.ProductImage || `${BACKEND_URL}/images/default.jpg`;
            
            return (
              <div key={index} className="product-item">
                <img 
                  src={imageUrl}
                  alt={item.ProductName}
                  className="product-image"
                  onError={(e) => e.target.src = `${BACKEND_URL}/images/default.jpg`}
                />
                <div className="product-info">
                  <h3>{item.ProductName}</h3>
                  <p className="product-price">
                    {parseFloat(item.Price).toLocaleString('vi-VN')}đ × {item.Qty}
                  </p>
                </div>
                <div className="product-actions">
                  <div className="product-subtotal">
                    {parseFloat(item.Subtotal).toLocaleString('vi-VN')}đ
                  </div>
                  {order.Status === 'delivered' && (
                    <button 
                      className="btn-review-product"
                      onClick={() => handleReviewProduct(item)}
                    >
                      ⭐ Đánh giá
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div className="order-summary-section">
        <h2>💰 Tổng thanh toán</h2>
        <div className="summary-card">
          <div className="summary-row">
            <span>Tạm tính ({order.items?.length || 0} sản phẩm):</span>
            <span>{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <span className="total-amount">
              {parseFloat(order.Total).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="info-section">
        <h2>📅 Lịch sử đơn hàng</h2>
        <div className="info-card">
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-time">
                  {new Date(order.CreatedAt).toLocaleString('vi-VN')}
                </div>
                <div className="timeline-text">Đơn hàng được tạo</div>
              </div>
            </div>
            {order.UpdatedAt && order.UpdatedAt !== order.CreatedAt && (
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-time">
                    {new Date(order.UpdatedAt).toLocaleString('vi-VN')}
                  </div>
                  <div className="timeline-text">
                    Cập nhật trạng thái: {status.label}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="order-actions">
        {order.Status === 'delivered' && (
          <button className="btn-action btn-review">
            ⭐ Đánh giá sản phẩm
          </button>
        )}
        <button className="btn-action btn-support" onClick={() => navigate('/support')}>
          💬 Liên hệ hỗ trợ
        </button>
        <button className="btn-action btn-continue" onClick={() => navigate('/shop')}>
          🛒 Tiếp tục mua sắm
        </button>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onReviewSuccess={handleReviewSuccess}
      />
    </div>
  );
}

export default OrderDetail;

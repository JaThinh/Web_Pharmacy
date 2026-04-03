import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, cancelOrder, getOrderDetail } from '../../../api';
import ReviewModal from '../../../components/ReviewModal/ReviewModal';
import './Orders.css';
import Swal from 'sweetalert2';

function Orders() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const STATUS_CONFIG = {
    pending: { label: 'Chờ xác nhận', color: '#ffc107', icon: '⏳' },
    confirmed: { label: 'Đã xác nhận', color: '#17a2b8', icon: '✓' },
    shipping: { label: 'Đang giao', color: '#007bff', icon: '🚚' },
    delivered: { label: 'Đã giao', color: '#28a745', icon: '✓' },
    cancelled: { label: 'Đã hủy', color: '#dc3545', icon: '✕' }
  };

  // Load orders từ API
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const params = activeFilter !== 'all' ? { status: activeFilter } : {};
        const data = await getOrders(params);
        
        // Transform API data
        const transformedOrders = (data.orders || []).map(order => ({
          id: order.Code,
          orderId: order.Id,
          date: new Date(order.CreatedAt).toLocaleDateString('vi-VN'),
          status: order.Status,
          total: parseFloat(order.Total),
          itemsCount: parseInt(order.ItemsCount || 0)
        }));
        
        setOrders(transformedOrders);
        setError(null);
      } catch (err) {
        console.error("Error loading orders:", err);
        setError("Không thể tải đơn hàng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [activeFilter]);

  const handleCancelOrder = async (orderId) => {
    Swal.fire({
      title: 'Bạn có chắc muốn hủy đơn hàng này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'OK',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await cancelOrder(orderId);
          Swal.fire({
            icon: 'success',
            title: 'Đã hủy đơn hàng thành công!',
            confirmButtonText: 'OK'
          });
          // Reload orders by toggling filter
          setActiveFilter(activeFilter === 'all' ? 'pending' : 'all');
          setTimeout(() => setActiveFilter('all'), 100);
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: err.response?.data?.message || 'Không thể hủy đơn hàng.',
            confirmButtonText: 'OK'
          });
        }
      }
    });
  };

  // Handle review button - load order products and show modal
  const handleReviewOrder = async (orderId) => {
    try {
      setLoadingProducts(true);
      const orderDetail = await getOrderDetail(orderId);
      
      console.log('📦 Order detail loaded:', orderDetail);
      
      if (orderDetail && orderDetail.items && orderDetail.items.length > 0) {
        // Show first product for review (can be enhanced to show all products)
        const firstProduct = orderDetail.items[0];
        console.log('🎯 First product for review:', firstProduct);
        console.log('🖼️ Product image field:', firstProduct.ProductImage);
        
        setSelectedProduct(firstProduct);
        setShowReviewModal(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Không tìm thấy sản phẩm trong đơn hàng này',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error loading order products:', error);
      Swal.fire({
        icon: 'error',
        title: 'Không thể tải thông tin sản phẩm',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleReviewSuccess = () => {
    // Optionally reload orders or show success message
    console.log('Review submitted successfully');
  };

  const filteredOrders = orders;

  if (loading) {
    return <div className="loading">Đang tải đơn hàng...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Đơn hàng của tôi</h1>
        <p>Quản lý và theo dõi đơn hàng của bạn</p>
      </div>

      <div className="orders-filters">
        <button 
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Tất cả
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          Chờ xác nhận
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'shipping' ? 'active' : ''}`}
          onClick={() => setActiveFilter('shipping')}
        >
          Đang giao
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'delivered' ? 'active' : ''}`}
          onClick={() => setActiveFilter('delivered')}
        >
          Đã giao
        </button>
        <button 
          className={`filter-btn ${activeFilter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveFilter('cancelled')}
        >
          Đã hủy
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <h2>Chưa có đơn hàng</h2>
          <p>Bạn chưa có đơn hàng nào trong danh mục này</p>
          <button className="btn-shop" onClick={() => navigate('/shop')}>
            Tiếp tục mua sắm
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id-date">
                  <span className="order-id">{order.id}</span>
                  <span className="order-date">{order.date}</span>
                </div>
                <span 
                  className="order-status" 
                  style={{ 
                    background: `${STATUS_CONFIG[order.status].color}15`,
                    color: STATUS_CONFIG[order.status].color 
                  }}
                >
                  <span>{STATUS_CONFIG[order.status].icon}</span>
                  {STATUS_CONFIG[order.status].label}
                </span>
              </div>

              <div className="order-summary">
                <span className="order-total-label">
                  {order.itemsCount} sản phẩm - Tổng: 
                </span>
                <span className="order-total">
                  {order.total.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div className="order-footer">
                <div className="order-actions">
                  {order.status === 'delivered' && (
                    <button 
                      className="btn-review"
                      onClick={() => handleReviewOrder(order.orderId)}
                      disabled={loadingProducts}
                    >
                      {loadingProducts ? 'Đang tải...' : '⭐ Đánh giá'}
                    </button>
                  )}
                  {order.status === 'shipping' && (
                    <button className="btn-track">📍 Theo dõi</button>
                  )}
                  {order.status === 'pending' && (
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancelOrder(order.orderId)}
                    >
                      ✕ Hủy đơn
                    </button>
                  )}
                  <button 
                    className="btn-detail"
                    onClick={() => navigate(`/orders/${order.orderId}`)}
                  >
                    📄 Chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default Orders;

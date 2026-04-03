// ProductCard Component - Hiển thị sản phẩm trong chat
import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import './ChatProductCard.css';

const ChatProductCard = ({ product, isInMessage = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  if (!product) return null;

  const handleClick = () => {
    // Normalize product ID - hỗ trợ nhiều format
    const productId = product.id || product.Id || product.ProductId;
    console.log('🔍 ChatProductCard - Navigating to product:', productId, product);
    
    if (!productId) {
      console.error('❌ No product ID found in:', product);
      alert('Không tìm thấy ID sản phẩm');
      return;
    }

    const productUrl = `/product/${productId}`;
    
    // Kiểm tra xem người dùng có phải admin và đang ở trang admin không
    const isAdminPage = location.pathname.startsWith('/admin');
    const isAdmin = user?.role === 'admin' || user?.Role === 'admin';
    
    if (isAdmin && isAdminPage) {
      // Admin: Mở trong tab mới để không bị rời khỏi trang admin
      console.log('👨‍💼 Admin - Opening product in new tab:', productUrl);
      window.open(productUrl, '_blank', 'noopener,noreferrer');
    } else {
      // User: Navigate bình thường
      console.log('👤 User - Navigating to product:', productUrl);
      navigate(productUrl);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Normalize product fields - hỗ trợ nhiều format
  // ============ ⭐️ SỬA LỖI ẢNH (BẮT ĐẦU) ⭐️ ============
  // Sửa: Đọc "imageUrl" (link tuyệt đối) thay vì "image" (tên file)
  // Backend (chatService.js) đã gửi về "image" là link tuyệt đối
  const productImage = product.image || product.Image || product.ProductImage || product.ImageURL;
  const productName = product.name || product.Name || product.ProductName;
  const productPrice = product.price || product.Price || product.ProductPrice;

  // Sửa: Dùng trực tiếp link (productImage)
  const imageUrl = productImage || 'https://via.placeholder.com/80x80?text=No+Image';
  // Xóa code build link thủ công bị sai:
  // const imageUrl = productImage
  //   ? `http://localhost:5001/images/products/${productImage}`
  //   : 'https://via.placeholder.com/80x80?text=No+Image';
  // ============ ⭐️ SỬA LỖI ẢNH (KẾT THÚC) ⭐️ ============

  console.log('📦 ChatProductCard render:', { 
    productName, 
    productPrice, 
    productImage, 
    imageUrl,
    fullProduct: product 
  });

  // Kiểm tra có phải admin đang ở trang admin không
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAdmin = user?.role === 'admin' || user?.Role === 'admin';
  const willOpenNewTab = isAdmin && isAdminPage;

  return (
    <div 
      className={`chat-product-card ${isInMessage ? 'in-message' : ''}`} 
      onClick={handleClick}
      title={willOpenNewTab ? 'Click để mở trong tab mới' : 'Click để xem chi tiết'}
    >
      <div className="product-image-wrapper">
        <img 
          src={imageUrl}
          alt={productName || 'Sản phẩm'}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
          }}
        />
      </div>
      <div className="product-info">
        <h4 className="product-name">{productName || 'Tên sản phẩm'}</h4>
        <p className="product-price">{formatPrice(productPrice || 0)}</p>
        <button className="view-product-btn">
          {willOpenNewTab && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          )}
          {!willOpenNewTab && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
              <path d="M9 5l7 7-7 7"/>
            </svg>
          )}
          {willOpenNewTab ? 'Mở tab mới' : 'Xem sản phẩm'}
        </button>
      </div>
    </div>
  );
};

export default ChatProductCard;
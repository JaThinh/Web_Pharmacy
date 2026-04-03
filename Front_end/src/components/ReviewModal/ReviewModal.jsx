// Review Modal Component - Đánh giá sản phẩm sau khi mua
import React, { useState } from 'react';
import axios from 'axios';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, product, onReviewSuccess }) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    if (content.trim().length < 10) {
      alert('Nội dung đánh giá phải có ít nhất 10 ký tự!');
      return;
    }

    try {
      setIsSubmitting(true);
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      
      // ⭐️ SỬA LỖI: Đọc đúng key "ph_auth" từ localStorage
      let token = null;
      try {
        const authData = JSON.parse(localStorage.getItem("ph_auth") || "{}");
        token = authData.token; // Lấy token từ object
      } catch (e) {
        console.error("Không thể đọc auth token", e);
      }
      
      console.log('🔐 Review - Token from localStorage ("ph_auth"):', token ? 'Exists' : 'NOT FOUND');
      console.log('📦 Review - Product data:', product);
      console.log('📝 Review - Submitting:', {
        productId: product.ProductId || product.id,
        rating,
        content: content.substring(0, 50) + '...'
      });

      if (!token) {
        // ⭐️ SỬA LỖI: Thông báo lỗi rõ ràng hơn
        alert('⚠️ Phiên đăng nhập đã hết (Không tìm thấy "ph_auth"). Vui lòng đăng nhập lại!');
        window.location.href = '/login';
        return;
      }

      const response = await axios.post(
        `${baseURL}/api/comments`,
        {
          productId: product.ProductId || product.id,
          rating: rating,
          content: content.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Review response:', response.data);

      alert('✅ Cảm ơn bạn đã đánh giá sản phẩm!');
      
      // Reset form
      setRating(5);
      setContent('');
      
      // Callback để refresh danh sách
      if (onReviewSuccess) {
        onReviewSuccess(product.ProductId || product.id);
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || 'Không thể gửi đánh giá. Vui lòng thử lại.';
      
      // Nếu lỗi authentication, redirect về login
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('❌ ' + errorMsg + '\n\nBạn sẽ được chuyển đến trang đăng nhập.');
        // ⭐️ SỬA LỖI: Xóa đúng key "ph_auth"
        localStorage.removeItem('ph_auth'); 
        window.location.href = '/login';
        return;
      }
      
      alert('❌ ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setRating(5);
    setContent('');
    setHoveredRating(0);
    onClose();
  };

  const renderStars = () => {
    return (
      <div className="star-rating-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= (hoveredRating || rating) ? 'filled' : ''}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            ★
          </span>
        ))}
        <span className="rating-text">
          {hoveredRating || rating} sao
        </span>
      </div>
    );
  };

  // Get image URL - handle both absolute and relative paths
  const getImageUrl = () => {
    const productImage = product.ProductImage || product.image || product.Image;
    
    console.log('🖼️ ReviewModal - Product data:', product);
    console.log('🖼️ ReviewModal - ProductImage field:', productImage);
    
    // If already absolute URL (starts with http), use it directly
    if (productImage && productImage.startsWith('http')) {
      console.log('✅ Using absolute URL:', productImage);
      return productImage;
    }
    
    // If relative path, build full URL
    if (productImage) {
      const cleanPath = productImage.replace(/^\/+/, ''); // Remove leading slashes
      const fullUrl = `http://localhost:5001/images/products/${cleanPath}`;
      console.log('🔧 Built URL from relative path:', fullUrl);
      return fullUrl;
    }
    
    // Default fallback
    console.log('⚠️ Using default image');
    return 'http://localhost:5001/images/products/default.jpg';
  };

  return (
    <div className="review-modal-overlay" onClick={handleClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>Đánh giá sản phẩm</h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="review-modal-body">
          {/* Product Info */}
          <div className="review-product-info">
            <img 
              src={getImageUrl()}
              alt={product.ProductName || product.name}
              onError={(e) => e.target.src = 'https://via.placeholder.com/60?text=No+Image'}
            />
            <div className="product-details">
              <h3>{product.ProductName || product.name}</h3>
              <p className="product-price">
                {(product.Price || product.price || 0).toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="review-form">
            <div className="form-group">
              <label>Đánh giá của bạn <span className="required">*</span></label>
              {renderStars()}
              <p className="help-text">Click vào số sao để đánh giá</p>
            </div>

            <div className="form-group">
              <label>Nhận xét của bạn <span className="required">*</span></label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này... (tối thiểu 10 ký tự)"
                rows="6"
                disabled={isSubmitting}
                maxLength="1000"
              />
              <div className="char-count">
                {content.length}/1000 ký tự
              </div>
            </div>

            <div className="review-tips">
              <h4>💡 Gợi ý viết đánh giá:</h4>
              <ul>
                <li>Chất lượng sản phẩm như thế nào?</li>
                <li>Hiệu quả có đúng như mô tả không?</li>
                <li>Bạn có hài lòng với sản phẩm không?</li>
                <li>Có điều gì bạn muốn chia sẻ với người mua khác?</li>
              </ul>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmitting || !content.trim()}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
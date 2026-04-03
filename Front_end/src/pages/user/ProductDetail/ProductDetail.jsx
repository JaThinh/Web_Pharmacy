import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductDetail, addToCart } from "../../../api";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import axios from "axios";
import "./ProductDetail.css";

// Helper function to check if token is expired
const _isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (_e) {
    return true;
  }
};

// Helper function to get product specifications
const getProductSpecs = (productName) => {
  const name = productName.toLowerCase();
  
  if (name.includes('paracetamol')) {
    return {
      thanhPhan: 'Paracetamol 500mg',
      lieuDung: 'Người lớn: 1-2 viên/lần, 3-4 lần/ngày. Trẻ em: Theo cân nặng, không quá 60mg/kg/ngày.',
      cachDung: 'Uống với nước, có thể uống trước hoặc sau ăn. Không dùng quá 10 ngày liên tục.',
      chiDinh: 'Giảm đau, hạ sốt do cảm cúm, đau đầu, đau răng.',
      chongChiDinh: 'Bệnh nhân dị ứng với Paracetamol, suy gan nặng.',
      tacDungPhu: 'Buồn nôn, phát ban nhẹ (hiếm gặp).',
      baoQuan: 'Nơi khô ráo, dưới 30°C.',
      keDon: 'Thuốc không kê đơn (OTC).'
    };
  }
  
  if (name.includes('amoxicillin')) {
    return {
      thanhPhan: 'Amoxicillin 500mg (dạng viên nén)',
      lieuDung: 'Người lớn: 500mg/lần, 3 lần/ngày. Trẻ em: 20-40mg/kg/ngày chia 3 lần.',
      cachDung: 'Uống trước ăn 30 phút - 1 giờ, uống đủ nước.',
      chiDinh: 'Nhiễm trùng đường hô hấp, tai mũi họng, da, tiết niệu.',
      chongChiDinh: 'Dị ứng với penicillin, bệnh gan thận nặng.',
      tacDungPhu: 'Tiêu chảy, buồn nôn, phát ban.',
      baoQuan: 'Nơi mát, dưới 25°C.',
      keDon: 'Thuốc kê đơn.'
    };
  }
  
  if (name.includes('vitamin c')) {
    return {
      thanhPhan: 'Vitamin C (Ascorbic Acid) 1000mg',
      lieuDung: 'Người lớn: 500-1000mg/ngày. Trẻ em: 100-500mg/ngày.',
      cachDung: 'Uống sau ăn để tránh kích ứng dạ dày.',
      chiDinh: 'Bổ sung Vitamin C, tăng cường miễn dịch, chống oxy hóa.',
      chongChiDinh: 'Sỏi thận, thalassemia.',
      tacDungPhu: 'Buồn nôn, tiêu chảy nếu liều cao.',
      baoQuan: 'Nơi khô ráo, tránh ánh sáng.',
      keDon: 'Thuốc không kê đơn (OTC).'
    };
  }
  
  if (name.includes('omega') || name.includes('fish oil')) {
    return {
      thanhPhan: 'Omega-3 Fish Oil (EPA + DHA) 1000mg',
      lieuDung: '1-2 viên/ngày với bữa ăn.',
      cachDung: 'Uống cùng thức ăn để tăng hấp thu.',
      chiDinh: 'Hỗ trợ tim mạch, giảm cholesterol, cải thiện trí nhớ.',
      chongChiDinh: 'Dị ứng hải sản, rối loạn đông máu.',
      tacDungPhu: 'Ợ nóng, mùi tanh (hiếm).',
      baoQuan: 'Nơi mát, dưới 25°C.',
      keDon: 'Thuốc không kê đơn (OTC).'
  };
  }
  
  if (name.includes('cephalexin')) {
    return {
      thanhPhan: 'Cephalexin 500mg',
      lieuDung: 'Người lớn: 500mg/lần, 4 lần/ngày. Trẻ em: 25-50mg/kg/ngày chia 4 lần.',
      cachDung: 'Uống đều đặn cách nhau 6 giờ, uống với nước.',
      chiDinh: 'Nhiễm trùng da, đường tiết niệu, hô hấp.',
      chongChiDinh: 'Dị ứng cephalosporin.',
      tacDungPhu: 'Tiêu chảy, đau bụng.',
      baoQuan: 'Nơi khô ráo, dưới 30°C.',
      keDon: 'Thuốc kê đơn.'
    };
  }
  
  if (name.includes('oresol')) {
    return {
      thanhPhan: 'Oresol (Glucose, Natri clorid, Kali clorid)',
      lieuDung: '1 gói pha với 1 lít nước, uống từ từ.',
      cachDung: 'Pha với nước đun sôi để nguội, uống trong ngày.',
      chiDinh: 'Bù nước điện giải khi tiêu chảy, nôn mửa.',
      chongChiDinh: 'Suy thận nặng, phù não.',
      tacDungPhu: 'Không có tác dụng phụ khi dùng đúng liều.',
      baoQuan: 'Nơi khô ráo, dưới 30°C.',
      keDon: 'Thuốc không kê đơn (OTC).'
    };
  }
  
  // Default for other products - Mock data for all medicines
  return {
    thanhPhan: 'Thành phần chính: Theo công thức của nhà sản xuất',
    lieuDung: 'Người lớn: 1-2 viên/lần, 2-3 lần/ngày. Trẻ em: Theo chỉ định của bác sĩ.',
    cachDung: 'Uống với nước ấm, có thể uống trước hoặc sau ăn. Không nhai hoặc nghiền viên.',
    chiDinh: 'Giảm đau, hạ sốt, hỗ trợ điều trị các triệu chứng thông thường.',
    chongChiDinh: 'Không dùng cho trẻ em dưới 2 tuổi, phụ nữ mang thai, người dị ứng với thành phần.',
    tacDungPhu: 'Buồn nôn, chóng mặt, phát ban nhẹ (hiếm gặp). Ngừng dùng và hỏi bác sĩ nếu có dấu hiệu bất thường.',
    baoQuan: 'Nơi khô ráo, thoáng mát, dưới 30°C. Tránh ánh nắng trực tiếp.',
    keDon: 'Thuốc không kê đơn (OTC).'
  };
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Comment states
  const [comments, setComments] = useState([]);
  const [commentStats, setCommentStats] = useState({ averageRating: 0, totalComments: 0 });
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [replyingTo, setReplyingTo] = useState(null); // ID của comment đang reply
  const [replyForm, setReplyForm] = useState({ content: "" });
  const [activeTab, setActiveTab] = useState("description");
  // const [selectedImage, setSelectedImage] = useState(0); // TODO: For gallery

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductDetail(id);
        
        // API now returns camelCase fields and absolute imageUrl (if available)
        const imagePath = data.imageUrl || data.image || "/images/products/default.jpg";

        // Transform API data
        const transformedProduct = {
          id: data.id,
          name: data.name,
          price: parseFloat(data.price || 0),
          category: data.category,
          stock: data.stock || 0,
          image: imagePath,
          description: data.shortDesc || data.description || '',
          details: data.description,
          brand: data.brand || "N/A",
          origin: "Việt Nam"
        };
        setProduct(transformedProduct);
        setError(null);
      } catch (err) {
        console.error("Error loading product:", err);
        setError("Không thể tải sản phẩm. Vui lòng thử lại.");
        setTimeout(() => navigate("/shop"), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
        const response = await axios.get(`${baseURL}/api/comments/${id}`);
        setComments(response.data.comments || []);
        setCommentStats({
          averageRating: response.data.averageRating || 0,
          totalComments: response.data.totalComments || 0
        });
      } catch (err) {
        console.error("Error loading comments:", err);
      }
    };

    if (id) {
      loadComments();
    }
  }, [id]);

  // Check if user can review
  useEffect(() => {
    const checkReviewPermission = async () => {
      if (!user) {
        setCanReview(false);
        return;
      }

      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
        const auth = JSON.parse(localStorage.getItem('ph_auth') || '{}');
        const token = auth.token;
        const response = await axios.get(`${baseURL}/api/comments/check/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCanReview(response.data.canReview);
      } catch (err) {
        console.error("Error checking review permission:", err);
        setCanReview(false);
      }
    };

    if (id) {
      checkReviewPermission();
    }
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!user) {
      alert("⚠️ Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      navigate("/login");
      return;
    }

    try {
      await addToCart(product.id, quantity);
      alert(`✓ Đã thêm ${quantity} ${product.name} vào giỏ hàng!`);
      setQuantity(1); // Reset
      window.dispatchEvent(new Event('cart:updated')); // Cập nhật số lượng giỏ hàng
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("❌ Lỗi: " + (err.response?.data?.error || "Không thể thêm vào giỏ hàng"));
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      alert("⚠️ Vui lòng đăng nhập để mua hàng!");
      navigate("/login");
      return;
    }

    try {
      // Thêm vào giỏ trước
      await addToCart(product.id, quantity);
      window.dispatchEvent(new Event('cart:updated')); // Cập nhật số lượng giỏ hàng
      // Sau đó chuyển đến trang checkout luôn
      navigate("/checkout");
    } catch (err) {
      console.error("Error in buy now:", err);
      alert("❌ Lỗi: " + (err.response?.data?.error || "Không thể mua hàng"));
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("Vui lòng đăng nhập để đánh giá!");
      navigate("/login");
      return;
    }

    if (!reviewForm.content.trim()) {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const auth = JSON.parse(localStorage.getItem('ph_auth') || '{}');
      const token = auth.token;
      
      await axios.post(`${baseURL}/api/comments`, {
        productId: id,
        rating: reviewForm.rating,
        content: reviewForm.content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✓ Đánh giá của bạn đã được gửi thành công!");
      
      // Reload comments
      const response = await axios.get(`${baseURL}/api/comments/${id}`);
      const result = response.data;
      setComments(result.comments || []);
      setCommentStats({
        averageRating: result.averageRating || 0,
        totalComments: result.totalComments || 0
      });

      // Reset form
      setReviewForm({ rating: 5, content: "" });
      setShowReviewForm(false);
      setCanReview(false);
    } catch (err) {
      console.error("Error submitting review:", err);
      
      // Check if token expired
      if (err.response?.status === 403 && err.response?.data?.error?.includes('token')) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        localStorage.removeItem('token');
        navigate("/login");
        return;
      }
      
      alert("❌ " + (err.response?.data?.error || "Không thể gửi đánh giá!"));
    }
  };

  const handleSubmitReply = async (e, parentId) => {
    e.preventDefault();
    
    if (!user) {
      alert("Vui lòng đăng nhập để trả lời!");
      navigate("/login");
      return;
    }

    if (!replyForm.content.trim()) {
      alert("Vui lòng nhập nội dung trả lời!");
      return;
    }

    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      const auth = JSON.parse(localStorage.getItem('ph_auth') || '{}');
      const token = auth.token;
      
      await axios.post(`${baseURL}/api/comments`, {
        productId: id,
        content: replyForm.content,
        parentId: parentId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✓ Trả lời của bạn đã được gửi thành công!");
      
      // Reload comments
      const response = await axios.get(`${baseURL}/api/comments/${id}`);
      const result = response.data;
      setComments(result.comments || []);
      setCommentStats({
        averageRating: result.averageRating || 0,
        totalComments: result.totalComments || 0
      });

      // Reset form
      setReplyForm({ content: "" });
      setReplyingTo(null);
    } catch (err) {
      console.error("Error submitting reply:", err);
      
      // Check if token expired
      if (err.response?.status === 403 && err.response?.data?.error?.includes('token')) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        localStorage.removeItem('token');
        navigate("/login");
        return;
      }
      
      alert("❌ " + (err.response?.data?.error || "Không thể gửi trả lời!"));
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? "star filled" : "star"}>★</span>
        ))}
      </div>
    );
  };

  const increaseQty = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải sản phẩm...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!product) {
    return <div className="loading">Không tìm thấy sản phẩm.</div>;
  }

  return (
    <div className="product-detail-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span onClick={() => navigate("/shop")} className="breadcrumb-link">Trang chủ</span>
        <span className="breadcrumb-separator">›</span>
        <span onClick={() => navigate("/shop")} className="breadcrumb-link">{product.category}</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="product-detail-content">
        {/* Left: Image Gallery */}
        <div className="product-gallery">
          <div className="main-image">
            <img 
              src={product.image || "https://via.placeholder.com/500x500?text=Thuốc"} 
              alt={product.name}
            />
            {product.discount && (
              <div className="discount-badge">-{product.discount}%</div>
            )}
          </div>
          {/* Thumbnail images - TODO: Add multiple images support */}
          <div className="thumbnail-list">
            <div className="thumbnail active">
              <img src={product.image || "https://via.placeholder.com/80x80"} alt="thumb" />
            </div>
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="product-info-section">
          {/* Product Name & Category */}
          <div className="product-header">
            <span className="product-category">{product.category}</span>
            <h1 className="product-name">{product.name}</h1>
            <div className="product-meta">
              <span className="brand">Thương hiệu: <strong>{product.brand || "Đang cập nhật"}</strong></span>
              <span className="separator">|</span>
              <span className="stock">
                Tình trạng: 
                {product.stock > 10 ? (
                  <strong className="in-stock"> Còn hàng</strong>
                ) : product.stock > 0 ? (
                  <strong className="low-stock"> Sắp hết ({product.stock} sản phẩm)</strong>
                ) : (
                  <strong className="out-of-stock"> Hết hàng</strong>
                )}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="price-section">
            <div className="current-price">
              {product.price.toLocaleString()}đ
            </div>
            {product.originalPrice && (
              <div className="original-price">
                {product.originalPrice.toLocaleString()}đ
              </div>
            )}
          </div>

          {/* Short Description */}
          <div className="short-description">
            <p>{product.description}</p>
          </div>

          {/* Quantity Selector */}
          <div className="quantity-section">
            <label>Số lượng:</label>
            <div className="quantity-controls">
              <button className="qty-btn" onClick={decreaseQty} disabled={quantity <= 1}>
                −
              </button>
              <input 
                type="text" 
                className="qty-input" 
                value={quantity} 
                readOnly
              />
              <button className="qty-btn" onClick={increaseQty} disabled={quantity >= product.stock}>
                +
              </button>
            </div>
            <span className="stock-info">{product.stock} sản phẩm có sẵn</span>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button 
              className="btn-add-cart" 
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 2L7 8h10l-2-6M7 8l-3 12h16l-3-12M7 8h10" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Thêm vào giỏ
            </button>
            <button 
              className="btn-buy-now" 
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Mua ngay
            </button>
          </div>

          {/* Additional Info */}
          <div className="additional-info">
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeWidth="2"/>
                <path d="M12 6V12L16 14" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Giao hàng nhanh 2-4 giờ nội thành</span>
            </div>
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Cam kết hàng chính hãng 100%</span>
            </div>
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 11L12 14L22 4M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Đổi trả trong 7 ngày nếu có lỗi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="product-tabs">
        <div className="tab-header">
          <button 
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Mô tả sản phẩm
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Thành phần & Liều dùng
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Đánh giá ({commentStats.totalComments})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="description-content">
              <h3>Thông tin chi tiết</h3>
              <p>{product.details}</p>
              <div className="product-specs">
                <div className="spec-row">
                  <span className="spec-label">Thương hiệu:</span>
                  <span className="spec-value">{product.brand || "Đang cập nhật"}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Xuất xứ:</span>
                  <span className="spec-value">{product.origin || "Đang cập nhật"}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Danh mục:</span>
                  <span className="spec-value">{product.category}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="specs-content">
              <h3>Thành phần & Liều dùng</h3>
              {(() => {
                const specs = getProductSpecs(product.name);
                return (
                  <div className="product-specs-detailed">
                    <div className="spec-section">
                      <h4>Thành phần</h4>
                      <p>{specs.thanhPhan}</p>
                    </div>
                    
                    <div className="spec-section">
                      <h4>Liều dùng</h4>
                      <p>{specs.lieuDung}</p>
                    </div>
                    
                    <div className="spec-section">
                      <h4>Cách dùng</h4>
                      <p>{specs.cachDung}</p>
                    </div>
                    
                    <div className="spec-section">
                      <h4>Chỉ định</h4>
                      <p>{specs.chiDinh}</p>
                    </div>
                    
                    <div className="spec-section">
                      <h4>Chống chỉ định</h4>
                      <p>{specs.chongChiDinh}</p>
                    </div>
                    
                    <div className="spec-section">
                      <h4>Tác dụng phụ</h4>
                      <p>{specs.tacDungPhu}</p>
                    </div>
                    
                    <div className="spec-section">
                      <h4>Bảo quản</h4>
                      <p>{specs.baoQuan}</p>
                    </div>
                    
                    <div className="spec-section">
                      <h4>Kê đơn</h4>
                      <p>{specs.keDon}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-content">
              {/* Rating Summary */}
              <div className="rating-summary">
                <div className="average-rating">
                  <div className="rating-number">{commentStats.averageRating}</div>
                  <div className="rating-stars">
                    {renderStars(Math.round(commentStats.averageRating))}
                  </div>
                  <div className="rating-count">{commentStats.totalComments} đánh giá</div>
                </div>
              </div>

              {/* Write Review Button */}
              {user && canReview && !showReviewForm && (
                <button 
                  className="btn-write-review"
                  onClick={() => setShowReviewForm(true)}
                >
                  ✍️ Viết đánh giá
                </button>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <div className="review-form-container">
                  <h3>Viết đánh giá của bạn</h3>
                  <form onSubmit={handleSubmitReview} className="review-form">
                    <div className="form-group">
                      <label>Đánh giá của bạn:</label>
                      <div className="star-selector">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={star <= reviewForm.rating ? "star filled" : "star"}
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            style={{ cursor: 'pointer', fontSize: '24px' }}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Nội dung đánh giá:</label>
                      <textarea
                        value={reviewForm.content}
                        onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                        rows="5"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-submit-review">
                        Gửi đánh giá
                      </button>
                      <button 
                        type="button" 
                        className="btn-cancel-review"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewForm({ rating: 5, content: "" });
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Comments List */}
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.Id} className="comment-thread">
                      {/* Comment gốc */}
                      <div className="comment-item">
                        <div className="comment-header">
                          <div className="comment-user">
                            <strong>{comment.Fullname || comment.Username}</strong>
                            {comment.Rating && renderStars(comment.Rating)}
                          </div>
                          <div className="comment-date">
                            {new Date(comment.CreatedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div className="comment-content">
                          {comment.Content}
                        </div>
                        <div className="comment-actions">
                          <button 
                            className="reply-btn"
                            onClick={() => setReplyingTo(replyingTo === comment.Id ? null : comment.Id)}
                          >
                            Trả lời
                          </button>
                        </div>
                      </div>

                      {/* Reply form */}
                      {replyingTo === comment.Id && (
                        <div className="reply-form-container">
                          <form onSubmit={(e) => handleSubmitReply(e, comment.Id)} className="reply-form">
                            <textarea
                              value={replyForm.content}
                              onChange={(e) => setReplyForm({ content: e.target.value })}
                              placeholder={`Trả lời ${comment.Fullname || comment.Username}...`}
                              rows="3"
                              required
                            />
                            <div className="form-actions">
                              <button type="submit" className="btn-submit-reply">
                                Gửi trả lời
                              </button>
                              <button 
                                type="button" 
                                className="btn-cancel-reply"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyForm({ content: "" });
                                }}
                              >
                                Hủy
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Danh sách replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies-list">
                          {comment.replies.map((reply) => (
                            <div key={reply.Id} className="reply-item">
                              <div className="comment-header">
                                <div className="comment-user">
                                  <strong>{reply.Fullname || reply.Username}</strong>
                                  <span className="reply-indicator">trả lời</span>
                                </div>
                                <div className="comment-date">
                                  {new Date(reply.CreatedAt).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                              <div className="comment-content">
                                {reply.Content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

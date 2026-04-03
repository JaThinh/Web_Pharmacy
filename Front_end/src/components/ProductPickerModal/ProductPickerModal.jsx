// ProductPickerModal - Chọn sản phẩm để gửi trong chat
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import './ProductPickerModal.css';

const ProductPickerModal = ({ isOpen, onClose, onSelectProduct }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');


  // SỬA: Dùng useCallback để không bị warning về dependency
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      const response = await api.get('/products', { params });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  // Load products khi modal mở
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, loadProducts]);

  // Bổ sung debounce khi search/category thay đổi
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        loadProducts();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchTerm, selectedCategory, loadProducts]);

  // SỬA: Không cần filter ở frontend nữa vì backend đã làm
  // const filteredProducts = products.filter(product => {
  //   const matchSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
  //   const matchCategory = selectedCategory === 'all' || product.category === selectedCategory;
  //   return matchSearch && matchCategory;
  // });
  const filteredProducts = products; // Dùng trực tiếp

  const handleSelectProduct = (product) => {
    onSelectProduct(product);
    onClose();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="product-picker-overlay" onClick={onClose}>
      <div className="product-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔍 Chọn sản phẩm</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-filters">
          <input
            id="product-picker-search"
            name="productSearch"
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            id="product-picker-category"
            name="productCategory"
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-select"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="thuoc">Thuốc</option>
            <option value="vitamin">Vitamin</option>
            <option value="cham-soc">Chăm sóc</option>
            <option value="thiet-bi">Thiết bị y tế</option>
          </select>
        </div>

        <div className="products-grid">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="product-item"
                onClick={() => handleSelectProduct(product)}
              >
                <div className="product-image">
                  
                  {/* ============ ⭐️ SỬA LỖI ẢNH Ở ĐÂY ⭐️ ============ */}
                  {/* Lỗi: Dùng 'product.image' và tự build link sai
                  <img 
                    src={`http://localhost:5001/images/products/${product.image}`}
                    ...
                  />
                  */}
                  
                  {/* Sửa: Dùng 'product.imageUrl' (link tuyệt đối từ backend) */}
                  <img 
                    src={product.imageUrl}
                    alt={product.name}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=No+Image'}
                  />
                  {/* ============ ⭐️ KẾT THÚC SỬA ⭐️ ============ */}

                </div>
                <div className="product-details">
                  <h4>{product.name}</h4>
                  <p className="price">{formatPrice(product.price)}</p>
                  <span className="category-badge">{product.category}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">Không tìm thấy sản phẩm</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPickerModal;

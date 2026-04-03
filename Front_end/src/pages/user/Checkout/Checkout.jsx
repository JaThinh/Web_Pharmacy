/*
 * Tên file: Front_end/src/pages/Checkout/Checkout.jsx
 * (Cập nhật Logo MoMo và ZaloPay)
 */
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { getCart, checkout } from '../../../api'; 
import * as provinces from 'vietnam-provinces';
import './Checkout.css';

// === BỔ SUNG: Import Logo ===
import momoLogo from '../../../assets/momo.png';
import zalopayLogo from '../../../assets/zalopay.png';

const BACKEND_URL =
  import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5001';

function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: ''
  });

  const [districtList, setDistrictList] = useState([]);
  const [wardList, setWardList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allWards, setAllWards] = useState([]);

  // (TOÀN BỘ LOGIC TẢI GIỎ HÀNG VÀ XỬ LÝ ĐỊA CHỈ ĐƯỢC GIỮ NGUYÊN)
  useEffect(() => {
    try {
      const provinces_data = provinces.getProvinces();
      const districts_data = provinces.getDistricts();
      const wards_data = provinces.getWards();
      
      setProvinceList(provinces_data || []);
      setAllDistricts(districts_data || []);
      setAllWards(wards_data || []);
    } catch (error) {
      console.error('Error loading provinces data:', error);
      setProvinceList([]);
      setAllDistricts([]);
      setAllWards([]);
    }
  }, []);

  useEffect(() => {
    if (formData.city && provinceList.length > 0) {
      const selectedProvince = provinceList.find(
        (p) => p.name === formData.city
      );
      if (selectedProvince) {
        const filteredDistricts = allDistricts.filter(
          (d) => d.province_code === selectedProvince.code
        );
        setDistrictList(filteredDistricts);
      } else {
        setDistrictList([]);
      }
      setWardList([]);
    } else {
      setDistrictList([]);
      setWardList([]);
    }
  }, [formData.city, provinceList, allDistricts]);

  useEffect(() => {
    if (formData.district && districtList.length > 0) {
      const selectedDistrict = districtList.find(
        (d) => d.name === formData.district
      );
      if (selectedDistrict) {
        const filteredWards = allWards.filter(
          (w) => w.district_code === selectedDistrict.code
        );
        setWardList(filteredWards);
      } else {
        setWardList([]);
      }
    } else {
      setWardList([]);
    }
  }, [formData.district, districtList, allWards]);

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const data = await getCart();
        const transformedItems = (data.cartItems || []).map((item) => {
          let imageUrl = item.ProductImage || `${BACKEND_URL}/images/default.jpg`;
          
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${BACKEND_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
          }

          return {
            id: item.Id,
            name: item.ProductName,
            price: parseFloat(item.Price),
            quantity: item.Qty,
            image: imageUrl
          };
        });
        setCartItems(transformedItems);

        if (transformedItems.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Giỏ hàng trống!',
            confirmButtonText: 'OK'
          });
          navigate('/cart');
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        Swal.fire({
          icon: 'error',
          title: 'Không thể tải giỏ hàng.',
          confirmButtonText: 'OK'
        });
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, [navigate]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingFee = 30000;
  const total = subtotal + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'city') {
      setFormData({
        ...formData,
        city: value,
        district: '',
        ward: ''
      });
    } 
    else if (name === 'district') {
      setFormData({
        ...formData,
        district: value,
        ward: ''
      });
    }
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateStep1 = () => {
    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.address ||
      !formData.city ||
      !formData.district ||
      !formData.ward
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Vui lòng điền đầy đủ các trường thông tin có dấu *',
        confirmButtonText: 'OK'
      });
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    const termsCheckbox = document.getElementById('termsCheckbox');
    if (!termsCheckbox.checked) {
      Swal.fire({
        icon: 'warning',
        title: 'Bạn phải đồng ý với điều khoản và điều kiện để đặt hàng.',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setIsPlacingOrder(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        note: formData.note,
        city: formData.city,
        district: formData.district,
        ward: formData.ward,
        paymentMethod: paymentMethod 
      };

      const responseData = await checkout(payload); 
      
      if (paymentMethod === 'momo' || paymentMethod === 'zalopay') {
        if (responseData && responseData.payUrl) {
          console.log(`Đã nhận payUrl ${paymentMethod}, đang chuyển hướng...`);
          window.location.href = responseData.payUrl;
        } else {
          throw new Error(`Không nhận được link thanh toán ${paymentMethod}.`);
        }
      } else {
        window.dispatchEvent(new Event('cart:updated'));
        Swal.fire({
          icon: 'success',
          title: 'Đặt hàng thành công!',
          confirmButtonText: 'OK'
        });
        navigate('/orders'); 
      }

    } catch (err) {
      console.error('Checkout error:', err);
      const errorMessage = err.response?.data?.error || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!';
      Swal.fire({
        icon: 'error',
        title: errorMessage,
        confirmButtonText: 'OK'
      });
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Thanh toán</h1>
        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Nhập Thông Tin</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Thanh toán</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Xác nhận</span>
          </div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="form-section">
              <h2>Thông tin giao hàng</h2>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Nhập email"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Số nhà, tên đường"
                  />
                </div>

                <div className="form-group">
                  <label>Tỉnh/Thành phố *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn Tỉnh/Thành phố</option>
                    {provinceList.map((p) => (
                      <option key={p.code} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quận/Huyện *</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    disabled={!districtList.length}
                  >
                    <option value="">Chọn Quận/Huyện</option>
                    {districtList.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Phường/Xã *</label>
                  <select
                    name="ward"
                    value={formData.ward}
                    onChange={handleInputChange}
                    disabled={!wardList.length}
                  >
                    <option value="">Chọn Phường/Xã</option>
                    {wardList.map((w) => (
                      <option key={w.code} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Ghi chú về đơn hàng (tùy chọn)"
                    rows="3"
                  />
                </div>
              </div>

              <button
                className="btn-next"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2);
                  }
                }}
              >
                Tiếp tục
              </button>
            </div>
          )}

          {/* STEP 2 - ĐÃ SỬA ĐỔI ĐỂ HIỂN THỊ LOGO */}
          {step === 2 && (
            <div className="form-section">
              <h2>Phương thức thanh toán</h2>
              <div className="payment-methods">
                {[
                  { id: 'cod', icon: '💵', label: 'Thanh toán khi nhận hàng (COD)' },
                  // SỬA: Dùng biến ảnh đã import
                  { id: 'zalopay', icon: zalopayLogo, label: 'Ví điện tử ZaloPay' },
                  { id: 'momo', icon: momoLogo, label: 'Ví điện tử MoMo' }
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`payment-option ${
                      paymentMethod === method.id ? 'selected' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="payment-info">
                      <span className="payment-icon">
                        {/* Logic kiểm tra: Nếu là COD thì hiển thị emoji, ngược lại hiển thị ảnh */}
                        {method.id === 'cod' ? (
                          method.icon
                        ) : (
                          <img src={method.icon} alt={method.label} />
                        )}
                      </span>
                      <div>
                        <strong>{method.label}</strong>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="step-actions">
                <button className="btn-back" onClick={() => setStep(1)}>
                  Quay lại
                </button>
                <button className="btn-next" onClick={() => setStep(3)}>
                  Tiếp tục
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="form-section">
              <h2>Xác nhận đơn hàng</h2>

              <div className="confirmation-section">
                <h3>Thông tin giao hàng</h3>
                <div className="info-box">
                  <p>
                    <strong>Người nhận:</strong> {formData.fullName}
                  </p>
                  <p>
                    <strong>Số điện thoại:</strong> {formData.phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email || 'Không có'}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong>{' '}
                    {`${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`}
                  </p>
                </div>
              </div>

              <div className="confirmation-section">
                <h3>Phương thức thanh toán</h3>
                <div className="info-box">
                  <p>
                    {paymentMethod === 'cod' && '💵 Thanh toán khi nhận hàng (COD)'}
                    {paymentMethod === 'zalopay' && '⚡️ Ví điện tử ZaloPay'}
                    {paymentMethod === 'momo' && '📱 Ví điện tử MoMo'}
                  </p>
                </div>
              </div>

              <div className="terms">
                <label>
                  <input id="termsCheckbox" type="checkbox" defaultChecked />
                  Tôi đồng ý với{' '}
                  <a href="#">điều khoản và điều kiện</a> của cửa hàng
                </label>
              </div>

              <div className="step-actions">
                <button className="btn-back" onClick={() => setStep(2)}>
                  Quay lại
                </button>
                <button
                  className="btn-place-order"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? 'Đang đặt hàng...' : 'Đặt hàng'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ORDER SUMMARY */}
        <div className="order-summary">
          <h2>Đơn hàng của bạn</h2>
          <div className="summary-items">
            {cartItems.map((item) => (
              <div key={item.id} className="summary-item">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = '/images/products/placeholder.jpg';
                  }}
                />
                <div className="item-info">
                  <p className="item-name">{item.name}</p>
                  <p className="item-qty">Số lượng: {item.quantity}</p>
                </div>
                <p className="item-price">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                </p>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="summary-row">
            <span>Phí vận chuyển</span>
            <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row total">
            <span>Tổng cộng</span>
            <span className="total-amount">
              {total.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext/AuthContext.jsx";
import { getMe, updateMe, changePassword } from "../../../api";
import "./Profile.css";
import Orders from '../Orders/Orders'; // Đã import Orders

export default function Profile() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // ✨ FIX 1: Đã xóa dòng `useState` của `avatarFile` (Lỗi dòng 13)
  
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    fullname: user?.Fullname || user?.fullname || "",
    email: user?.Email || user?.email || "",
    phone: user?.Phone || user?.phone || "",
    address: user?.Address || user?.address || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");

  // Load user info từ API khi component mount
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        setLoading(true);
        const userData = await getMe();
        setFormData({
          fullname: userData.Fullname || userData.fullname || "",
          email: userData.Email || userData.email || "",
          phone: userData.Phone || userData.phone || "",
          address: userData.Address || userData.address || ""
        });
        // Load avatar from server or localStorage
        if (userData.Avatar) {
          setAvatarPreview(userData.Avatar);
        } else {
          // Fallback to localStorage
          const currentAuth = JSON.parse(localStorage.getItem("ph_auth") || "{}");
          if (currentAuth.user?.Avatar) {
            setAvatarPreview(currentAuth.user.Avatar);
          }
        }
      } catch (err) {
        console.error("Error loading user info:", err);
        setMessage("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    loadUserInfo();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle avatar upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage("❌ Vui lòng chọn file ảnh");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("❌ Kích thước ảnh không được vượt quá 5MB");
        return;
      }
      
      // ✨ FIX 1: Đã xóa dòng `setAvatarFile(file)`
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setMessage("✓ Đã chọn ảnh. Nhấn 'Lưu' để cập nhật!");
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!formData.fullname || !formData.phone) {
      setMessage("❌ Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);
      setMessage("⏳ Đang cập nhật...");
      
      // Prepare update data
      const updateData = {
        fullname: formData.fullname,
        phone: formData.phone,
        address: formData.address
      };
      
      // Add avatar if changed
      if (avatarPreview && avatarPreview.startsWith('data:')) {
        updateData.avatar = avatarPreview; // Send base64 to server
      }
      
      // ✨ FIX 2: Xóa `const updatedUser =` (Lỗi dòng 124)
      await updateMe(updateData);
      
      // Update auth context with new user data
      const currentAuth = JSON.parse(localStorage.getItem("ph_auth") || "{}");
      if (currentAuth.token && currentAuth.user) {
        const newUserData = {
          ...currentAuth.user,
          fullname: formData.fullname,
          Fullname: formData.fullname,
          phone: formData.phone,
          Phone: formData.phone,
          address: formData.address,
          Address: formData.address,
          Avatar: avatarPreview // Save avatar to localStorage
        };
        login(currentAuth.token, newUserData);
      }
      
      setMessage("✓ Cập nhật thông tin thành công!");
      setIsEditing(false);
      
      // ✨ FIX 1: Đã xóa dòng `setAvatarFile(null)`
      
      // Auto clear message after 3s
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Update error:", err);
      setMessage("❌ " + (err.response?.data?.error || err.response?.data?.message || "Cập nhật thất bại"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setMessage("Vui lòng điền đầy đủ mật khẩu");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage("Mật khẩu mới phải ít nhất 6 ký tự");
      return;
    }

    try {
      setLoading(true);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setMessage("✓ Đổi mật khẩu thành công!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Đổi mật khẩu thất bại"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div className="avatar-circle">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="avatar-image" />
            ) : (
              <span className="avatar-initial">
                {formData.fullname?.charAt(0).toUpperCase() || user?.Fullname?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>
          <button className="change-avatar-btn" onClick={handleAvatarClick} title="Đổi ảnh đại diện">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{formData.fullname || user?.Fullname || "Người dùng"}</h1>
          <p className="profile-email">{formData.email || user?.Email}</p>
          <span className="profile-role-badge">
            {user?.Role === "admin" || user?.role === "admin" ? "👑 Quản trị viên" : "👤 Khách hàng"}
          </span>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
            <circle cx="12" cy="7" r="4" strokeWidth="2"/>
          </svg>
          Thông tin cá nhân
        </button>
        <button 
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeWidth="2"/>
            <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/>
            <path d="M16 10a4 4 0 0 1-8 0" strokeWidth="2"/>
          </svg>
          Đơn hàng của tôi
        </button>
        <button 
          className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2"/>
          </svg>
          Bảo mật
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {message && (
          <div className={`message ${message.startsWith("✓") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        {activeTab === "info" && (
          <div className="info-section">
            <div className="section-header">
              <h2>Thông tin cá nhân</h2>
              {!isEditing ? (
                <button className="edit-btn" onClick={() => setIsEditing(true)} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
                  </svg>
                  Chỉnh sửa
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={() => setIsEditing(false)} disabled={loading}>Hủy</button>
                  <button className="save-btn" onClick={handleSave} disabled={loading}>
                    {loading ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              )}
            </div>

            <div className="info-grid">
              <div className="info-field">
                <label>Họ và tên</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="fullname"
                    value={formData.fullname} 
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p>{formData.fullname}</p>
                )}
              </div>

              <div className="info-field">
                <label>Email</label>
                <p>{formData.email}</p>
              </div>

              <div className="info-field">
                <label>Số điện thoại</label>
                {isEditing ? (
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone} 
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p>{formData.phone}</p>
                )}
              </div>

              <div className="info-field full-width">
                <label>Địa chỉ</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address} 
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p>{formData.address || "Chưa cập nhật"}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Đã thay thế bằng component Orders */}
        {activeTab === "orders" && (
          <Orders />
        )}

        {activeTab === "security" && (
          <div className="security-section">
            <h2>Bảo mật tài khoản</h2>
            <div className="security-item">
              <div className="security-info">
                <h3>Đổi mật khẩu</h3>
                <p>Cập nhật mật khẩu định kỳ để bảo mật tài khoản</p>
              </div>
            </div>

            <div className="password-form">
              <input 
                type="password" 
                placeholder="Mật khẩu hiện tại"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                className="input-field"
              />
              <input 
                type="password" 
                placeholder="Mật khẩu mới"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                className="input-field"
              />
              <input 
                type="password" 
                placeholder="Xác nhận mật khẩu mới"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                className="input-field"
              />
              <button 
                className="action-btn" 
                onClick={handleChangePassword}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
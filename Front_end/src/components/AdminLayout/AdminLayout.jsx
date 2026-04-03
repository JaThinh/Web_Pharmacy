import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext.jsx";
import { setAuthToken } from "../../api.jsx";
import "./AdminLayout.css";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    setAuthToken(null);
    logout();
    nav("/");
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">💊</div>
          <div>Pharmacy Admin</div>
        </div>
        <nav>
          <Link to="/admin/dashboard" className="nav-link">
            <span className="nav-icon">📊</span>
            <span>Tổng quan</span>
          </Link>
          <Link to="/admin/orders" className="nav-link">
            <span className="nav-icon">📦</span>
            <span>Quản lý đơn hàng</span>
          </Link>
          <Link to="/admin/users" className="nav-link">
            <span className="nav-icon">👥</span>
            <span>Quản lý người dùng</span>
          </Link>
          <Link to="/admin/medicines" className="nav-link">
            <span className="nav-icon">💊</span>
            <span>Quản lý sản phẩm</span>
          </Link>
          <Link to="/admin/chat" className="nav-link">
            <span className="nav-icon">💬</span>
            <span>Hỗ trợ khách hàng</span>
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <div className="user-email">{user?.email}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Đăng xuất
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet /> {/* Đây là nơi nội dung của từng trang sẽ được hiển thị */}
      </main>
    </div>
  );
}
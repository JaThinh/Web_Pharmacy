import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Header.css";
import { useAuth } from "../../context/AuthContext/AuthContext.jsx";
import { setAuthToken, getCart } from "../../api";

export default function Header() {
  const { logout, user } = useAuth() ?? {};
  const nav = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await getCart();
        const totalQty = Array.isArray(data.cartItems)
          ? data.cartItems.reduce((s, it) => s + (Number(it.Qty) || 0), 0)
          : 0;
        setCartCount(totalQty);
      } catch {
        setCartCount(0);
      }
    };
    fetchCount();

    const handler = () => fetchCount();
    window.addEventListener('cart:updated', handler);
    return () => window.removeEventListener('cart:updated', handler);
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    logout();
    nav("/login");
  };

  // --- BỘ ICON SVG ---
  const IconProduct = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
  );
  const IconStore = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  );
  const IconOrder = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  );
  const IconProfile = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  );
  const IconDisease = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
  );
  const IconCart = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
  );
  
  // Icon Logo
  const IconLogo = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"></path><path d="M8.5 8.5l7 7"></path></svg>
  );

  return (
    <header className="site-header">
      <div className="header-container bar">
        
        {/* LOGO & BRAND */}
        <Link to="/shop" className="brand">
          <IconLogo /> 
          <span>Pharmacy</span>
        </Link>

        {/* MENU CHÍNH: Đã xóa mục Hồ sơ */}
        <nav className="nav">
          <NavLink to="/shop" className={({ isActive }) => (isActive ? "active" : "")}>
            <IconProduct /> Sản phẩm
          </NavLink>
          
          <NavLink to="/he-thong-cua-hang" className={({ isActive }) => (isActive ? "active" : "")}>
            <IconStore /> Hệ thống cửa hàng
          </NavLink>
          
          <NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>
            <IconOrder /> Đơn hàng
          </NavLink>
          
          <NavLink to="/diseases" className={({ isActive }) => (isActive ? "active" : "")}>
            <IconDisease /> Tra cứu bệnh
          </NavLink>
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="right">
          <button id="cart-icon-button" className="btn ghost" onClick={() => nav("/cart")}>
            <IconCart /> Giỏ hàng
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
          
          {user ? (
            <>
              {/* Nút User vẫn dùng IconProfile ở đây */}
              <span 
                className="user-name" 
                onClick={() => nav("/profile")} 
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <IconProfile /> 
                {user?.name || user?.email}
              </span>
              <button className="btn ghost logout-btn" onClick={handleLogout}>Đăng xuất</button>
            </>
          ) : (
            <button className="btn ghost" onClick={() => nav("/login")}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
import { useEffect, useState } from "react";
import { setAuthToken, login as loginAPI, getAnnouncements } from "../../../api";
import { useAuth } from "../../../context/AuthContext/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import bgLogin from "../../../assets/anhnenlogin.jpg"; 

export default function Login() {
  // ---- STATE: LOGIN
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginMsg, setLoginMsg] = useState("");

  // ---- STATE: ANNOUNCEMENTS (bảng bên trái)
  const [ann, setAnn] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annErr, setAnnErr] = useState("");

  const { login } = useAuth();
  const nav = useNavigate();

  // TẢI THÔNG BÁO (bảng trái) — để chỗ cho BE nối API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setAnnLoading(true);
        setAnnErr("");

        const res = await getAnnouncements();

        if (!mounted) return;
        const list = Array.isArray(res) ? res : [];
        setAnn(list);
      } catch {
        if (mounted) setAnnErr("Không thể tải thông báo.");
      } finally {
        if (mounted) setAnnLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // SUBMIT: ĐĂNG NHẬP (dùng chung admin & khách)
  const submitLogin = async (e) => {
    e.preventDefault();
    setLoginMsg("");
    try {
      // GỮ NGUYÊN API ĐANG CHẠY
      const res = await loginAPI(loginForm.email, loginForm.password);
      const { token, user } = res;

      // ⭐️ SỬA LỖI: Thêm dòng này để ép lưu vào localStorage
      localStorage.setItem("ph_auth", JSON.stringify({ token, user }));
      
      setAuthToken(token);   // gắn header cho axios
      login(token, user);    // lưu context + localStorage

      // Điều hướng theo vai trò
      if (user?.Role === "admin") nav("/admin/dashboard");
      else nav("/shop");  // User thường → trang Shop

      setLoginMsg("Đăng nhập thành công");
    } catch (err) {
      setLoginMsg(err.response?.data?.error || "Sai email/mật khẩu");
    }
  };

  return (
    // Wrapper để áp nền (dùng CSS variable)
    <div className="login-page" style={{ "--login-bg": `url(${bgLogin})` }}>
      <div className="auth-shell">
        {/* ===== Cột trái: THÔNG BÁO ===== */}
        <div className="auth-left card">
          <div className="notice-header">
            <span className="notice-title">THÔNG BÁO CHUNG</span>
          </div>

          {annLoading && <div className="small">Đang tải thông báo…</div>}
          {!annLoading && annErr && (
            <div className="small" style={{ color: "tomato" }}>{annErr}</div>
          )}

          {!annLoading && !annErr && (
            <div className="notice-list">
              {ann.length > 0 ? (
                ann.map((n) => (
                  <div className="notice-item" key={n.id || n._id || n.title}>
                    <div className="notice-item-title">{n.title}</div>
                    <div className="notice-item-meta">
                      <span>{formatDate(n.date)}</span>
                      {n.url ? (
                        <a className="notice-link" href={n.url} target="_blank" rel="noreferrer">
                          Xem chi tiết
                        </a>
                      ) : <span />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="small">Chưa có thông báo.</div>
              )}
            </div>
          )}
        </div>

        {/* ===== Cột phải: CHỈ CÓ ĐĂNG NHẬP ===== */}
        <div className="auth-right">
          <div className="card">
            <div className="auth-brand">PHARMACY</div>
            <h3>ĐĂNG NHẬP HỆ THỐNG</h3>

            <form className="form" onSubmit={submitLogin}>
              <input
                className="input"
                placeholder="Email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <input
                className="input"
                placeholder="Mật khẩu"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <button className="btn" type="submit">Đăng nhập</button>
              {loginMsg && <div className="small" style={{ marginTop: 8 }}>{loginMsg}</div>}
            </form>

            {/* Link điều hướng tới trang đăng ký */}
            <div className="small" style={{ marginTop: 12 }}>
              Chưa có tài khoản?{" "}
              <button className="link-like" onClick={() => nav("/register")}>
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// helper
function formatDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString();
  } catch {
    return d;
  }
}
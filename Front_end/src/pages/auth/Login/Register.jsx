import { useEffect, useState } from "react";
import { setAuthToken, register, getAnnouncements } from "../../../api";
import { useAuth } from "../../../context/AuthContext/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import bgLogin from "../../../assets/anhnenlogin.jpg";

export default function Register() {
  // ---- STATE: REGISTER
  const [registerForm, setRegisterForm] = useState({
    username: "",
    fullname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [registerMsg, setRegisterMsg] = useState("");

  // ---- STATE: ANNOUNCEMENTS (bảng bên trái - giống Login)
  const [ann, setAnn] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annErr, setAnnErr] = useState("");

  const { login } = useAuth();
  const nav = useNavigate();

  // TẢI THÔNG BÁO (bảng trái)
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

  // SUBMIT: ĐĂNG KÝ
  const submitRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg("");

    // Validate
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterMsg("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!registerForm.username || !registerForm.fullname || !registerForm.phone) {
      setRegisterMsg("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      // GỬI REQUEST ĐĂNG KÝ với đầy đủ fields
      const res = await register({
        username: registerForm.username,
        fullname: registerForm.fullname,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      });

      const { token, user } = res;

      // ⭐️ SỬA LỖI: Thêm dòng này để ép lưu vào localStorage
      localStorage.setItem("ph_auth", JSON.stringify({ token, user }));

      // Tự động đăng nhập sau khi đăng ký thành công
      setAuthToken(token);
      login(token, user);

      // Điều hướng theo vai trò
      if (user?.Role === "admin") nav("/admin/dashboard");
      else nav("/shop");  // User thường → trang Shop

      setRegisterMsg("Đăng ký thành công");
    } catch (err) {
      setRegisterMsg(err.response?.data?.error || "Đăng ký thất bại");
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
            <div className="small" style={{ color: "tomato" }}>
              {annErr}
            </div>
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
                        <a
                          className="notice-link"
                          href={n.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Xem chi tiết
                        </a>
                      ) : (
                        <span />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="small">Chưa có thông báo.</div>
              )}
            </div>
          )}
        </div>

        {/* ===== Cột phải: FORM ĐĂNG KÝ ===== */}
        <div className="auth-right">
          <div className="card">
            <div className="auth-brand">PHARMACY</div>
            <h3>ĐĂNG KÝ TÀI KHOẢN</h3>

            <form className="form" onSubmit={submitRegister}>
              <input
                className="input"
                placeholder="Tên đăng nhập"
                type="text"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, username: e.target.value })
                }
                required
              />
              <input
                className="input"
                placeholder="Họ và tên"
                type="text"
                value={registerForm.fullname}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, fullname: e.target.value })
                }
                required
              />
              <input
                className="input"
                placeholder="Email"
                type="email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                required
              />
              <input
                className="input"
                placeholder="Số điện thoại"
                type="tel"
                value={registerForm.phone}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, phone: e.target.value })
                }
                required
              />
              <input
                className="input"
                placeholder="Mật khẩu"
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    password: e.target.value,
                  })
                }
                required
              />
              <input
                className="input"
                placeholder="Xác nhận mật khẩu"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />
              <button className="btn" type="submit">
                Đăng ký
              </button>
              {registerMsg && (
                <div className="small" style={{ marginTop: "8px" }}>
                  {registerMsg}
                </div>
              )}
            </form>

            {/* Link điều hướng về trang đăng nhập */}
            <div className="small" style={{ marginTop: "12px" }}>
              Đã có tài khoản?{" "}
              <button className="link-like" onClick={() => nav("/login")}>
                Đăng nhập
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
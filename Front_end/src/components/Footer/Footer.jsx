import { Link } from 'react-router-dom'; 
import './Footer.css';

// --- Import Icon Mạng Xã Hội ---
// (Bạn nhớ kiểm tra tên file trong thư mục assets nhé)
import fbIcon from '../../assets/facebook.png';
import liIcon from '../../assets/linkedin.png';
import instaIcon from '../../assets/instagram.png';
import threadsIcon from '../../assets/threads.png';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-grid">
          
          {/* Cột 1: Về chúng tôi */}
          <div className="footer-column">
            <div className="footer-title">Về chúng tôi</div>
            <Link to="/gioi-thieu" className="footer-link">Giới thiệu</Link>
            <Link to="/he-thong-cua-hang" className="footer-link">Hệ thống cửa hàng</Link>
            <Link to="/chinh-sach-bao-mat" className="footer-link">Chính sách bảo mật</Link>
          </div>

          {/* Cột 2: Danh mục */}
          <div className="footer-column">
            <div className="footer-title">Danh mục</div>
            <Link to="/shop?category=thuoc" className="footer-link">Thuốc</Link>
            <Link to="/shop?category=vitamin" className="footer-link">Thực phẩm bảo vệ sức khỏe</Link>
            <Link to="/shop?category=cham-soc" className="footer-link">Chăm sóc cá nhân</Link>
            <Link to="/shop?category=thiet-bi" className="footer-link">Thiết bị y tế</Link>
          </div>

          {/* Cột 3: Hỗ trợ & Mạng xã hội */}
          <div className="footer-column">
            <div className="footer-title">Hỗ trợ</div>
            
            {/* Thông tin liên hệ */}
            <a href="tel:18006821" className="footer-link contact-item">
              📞 1800 6821
            </a>
            <a href="mailto:nam695472@gmail.com" className="footer-link contact-item">
              ✉️ nam695472@gmail.com
            </a>

            {/* --- KHU VỰC MẠNG XÃ HỘI --- */}
            <div className="footer-title" style={{ marginTop: '16px', fontSize: '14px' }}>Kết nối với chúng tôi</div>
            <div className="social-links">
              {/* Facebook */}
              <a 
                href="https://www.facebook.com/nguyenhoainam2208" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon-link"
              >
                <img src={fbIcon} alt="Facebook" className="social-img" />
              </a>

              {/* LinkedIn */}
              <a 
                href="https://www.linkedin.com/in/nguy%E1%BB%85n-ho%C3%A0i-nam-ab1a00322/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon-link"
              >
                <img src={liIcon} alt="LinkedIn" className="social-img" />
              </a>

              {/* Instagram */}
              <a 
                href="https://www.instagram.com/hoainamm.__/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon-link"
              >
                <img src={instaIcon} alt="Instagram" className="social-img" />
              </a>

              {/* Threads */}
              <a 
                href="https://www.threads.com/@hoainamm.__" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-icon-link"
              >
                <img src={threadsIcon} alt="Threads" className="social-img" />
              </a>
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
}
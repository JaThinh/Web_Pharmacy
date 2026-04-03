import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDiseaseBySlug } from "../../../api";
import "./DiseaseDetail.css";

export default function DiseaseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDisease = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getDiseaseBySlug(slug);
        
        if (response.success && response.disease) {
          setDisease(response.disease);
          if (!response.disease.Content) {
            setError("Nội dung đang được cập nhật.");
          }
        } else {
          setError("Không tìm thấy thông tin bệnh");
        }
      } catch (err) {
        console.error("Error loading disease:", err);
        setError(err.response?.data?.error || "Không thể tải thông tin bệnh");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadDisease();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="article-loading-state">
        <div className="spinner"></div>
        <p>Đang tải bài viết...</p>
      </div>
    );
  }

  if (error || !disease) {
    return (
      <div className="article-container article-error-state">
        <h2>{error || "Không tìm thấy thông tin"}</h2>
        <button className="btn-back-article" onClick={() => navigate("/diseases")}>
          ← Quay lại trang tra cứu
        </button>
      </div>
    );
  }

  return (
    <div className="article-container">
      {/* Nút quay lại */}
      <button className="btn-back-article" onClick={() => navigate("/diseases")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Quay lại
      </button>

      {/* ✨ PHẦN HEADER ĐÃ ĐƯỢC DESIGN LẠI ✨ */}
      <div className="article-header">
        {disease.Category && (
          <span className="article-category">{disease.Category}</span>
        )}
        <h1 className="article-title">{disease.Name}</h1>
        <div className="article-meta">
          <span>Cập nhật lần cuối: {new Date(disease.UpdatedAt || Date.now()).toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* ✨ ĐÃ XÓA ẢNH BÌA Ở ĐÂY ✨ */}

      <div className="article-divider"></div>

      {/* Nội dung chính */}
      <div 
        className="article-content"
        dangerouslySetInnerHTML={{ __html: disease.Content }}
      />
      
      {/* Footer note */}
      <div className="article-footer-note">
        <p>
          <strong>Lưu ý:</strong> Thông tin chỉ mang tính chất tham khảo. 
          Vui lòng tham khảo ý kiến bác sĩ chuyên khoa.
        </p>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchDiseases } from "../../../api";
import "./Diseases.css";

export default function Diseases() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [diseases, setDiseases] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load 20 bệnh mới nhất khi component mount
  useEffect(() => {
    loadLatestDiseases();
  }, []);

  const loadLatestDiseases = async () => {
    try {
      setIsSearching(true);
      // API này phải được sửa ở backend để trả về "ImageUrl"
      const response = await searchDiseases("");
      
      if (response.success && response.diseases) {
        setDiseases(response.diseases);
      } else {
        setDiseases([]);
      }
    } catch (err) {
      console.error("Error loading diseases:", err);
      setDiseases([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      setIsSearching(true);
      setHasSearched(true);
      // API này phải được sửa ở backend để trả về "ImageUrl"
      const response = await searchDiseases(searchTerm.trim());
      
      if (response.success && response.diseases) {
        setDiseases(response.diseases);
      } else {
        setDiseases([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setDiseases([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDiseaseClick = (slug) => {
    navigate(`/diseases/${slug}`);
  };

  // Hàm rút gọn text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="diseases-container">
      <div className="diseases-header">
        <h1>🏥 Bách Khoa Toàn Thư Bệnh</h1>
        <p className="diseases-subtitle">
          Tra cứu thông tin chi tiết về các bệnh phổ biến
        </p>
      </div>

      {/* Search Form */}
      <form className="diseases-search-form" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bệnh, triệu chứng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isSearching}
          />
        </div>
        <button type="submit" disabled={isSearching}>
          {isSearching ? (
            <>
              <span className="btn-spinner"></span>
              Đang tìm...
            </>
          ) : (
            "Tìm kiếm"
          )}
        </button>
      </form>

      {/* Results */}
      <div className="diseases-results">
        {isSearching ? (
          <div className="diseases-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : diseases.length > 0 ? (
          <>
            <div className="results-header">
              <h2>
                {hasSearched && searchTerm 
                  ? `Tìm thấy ${diseases.length} kết quả`
                  : `${diseases.length} bệnh mới nhất`
                }
              </h2>
            </div>
            <div className="diseases-grid">
              {diseases.map((disease) => (
                <div
                  key={disease.Id}
                  className="disease-card"
                  onClick={() => handleDiseaseClick(disease.Slug)}
                >
                  {/* ✨ BƯỚC 1: THÊM KHUNG ẢNH MỚI ✨ */}
                  {disease.ImageUrl && (
                    <div className="disease-card-image">
                      <img src={disease.ImageUrl} alt={disease.Name} />
                    </div>
                  )}

                  {/* ✨ BƯỚC 2: BỌC NỘI DUNG VĂN BẢN VÀO DIV NÀY ✨ */}
                  <div className="disease-card-content">
                    <div className="disease-card-header">
                      <h3 className="disease-card-title">{disease.Name}</h3>
                      {disease.Category && (
                        <span className="disease-card-category">{disease.Category}</span>
                      )}
                    </div>
                    <p className="disease-card-overview">
                      {truncateText(disease.Overview || disease.Symptoms)}
                    </p>
                    <div className="disease-card-footer">
                      <span className="read-more">
                        Xem chi tiết
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="diseases-empty">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#d1d5db">
              <circle cx="11" cy="11" r="8" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
              <line x1="11" y1="8" x2="11" y2="14" strokeWidth="2"/>
              <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2"/>
            </svg>
            <h3>Không tìm thấy kết quả</h3>
            <p>Thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả</p>
            {hasSearched && (
              <button 
                className="btn-reset" 
                onClick={() => {
                  setSearchTerm("");
                  setHasSearched(false);
                  loadLatestDiseases();
                }}
              >
                Hiển thị tất cả
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
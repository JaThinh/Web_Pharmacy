import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './EventPage.css';

export default function EventPage() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [resetKey, setResetKey] = useState(0); 
  const [isBoom, setIsBoom] = useState(false); // State kích hoạt hiệu ứng Bùng nổ
  const [isFinished, setIsFinished] = useState(false); // State để khóa game khi xong

  // --- HÀM KHỞI TẠO CANVAS ---
  const initCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (canvas && container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      const ctx = canvas.getContext('2d');
      
      // Vẽ lớp phủ màu bạc
      ctx.fillStyle = '#9ca3af'; // Màu xám bạc
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Thêm nhiễu hạt (Noise) cho giống thật
      for (let i = 0; i < 1500; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#d1d5db' : '#6b7280';
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 2,
          0, Math.PI * 2
        );
        ctx.fill();
      }

      // Vẽ chữ "CÀO NGAY"
      ctx.font = '900 30px Inter, sans-serif';
      ctx.fillStyle = '#4b5563';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CÀO Ở ĐÂY 🪙', canvas.width / 2, canvas.height / 2);
    }
  };

  useEffect(() => {
    initCanvas();
    setIsBoom(false); // Reset trạng thái bùng nổ
    setIsFinished(false);
    
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resetKey]);

  // --- LOGIC TÍNH TOÁN % ĐÃ CÀO ---
  const checkScratchPercentage = () => {
    if (isFinished) return; // Nếu xong rồi thì thôi

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Lấy dữ liệu pixel của toàn bộ canvas
    // Lưu ý: Hàm này hơi nặng, nên chỉ gọi khi nhấc chuột (onMouseUp) hoặc throttle
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    
    // Duyệt qua từng pixel (bước nhảy 4 vì 1 pixel gồm r,g,b,alpha)
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) { // Nếu độ trong suốt = 0 (đã bị cào)
        transparentPixels++;
      }
    }

    const percentage = (transparentPixels / (pixels.length / 4)) * 100;

    // Nếu cào được hơn 40% diện tích -> Kích hoạt Bùng Nổ
    if (percentage > 40) {
      setIsFinished(true);
      setTimeout(() => {
        setIsBoom(true); // Hiện Popup
      }, 300); // Delay nhẹ cho mượt
    }
  };


  // --- LOGIC VẼ (CÀO) ---
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (isFinished) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      checkScratchPercentage(); // Kiểm tra kết quả khi nhấc tay ra
    }
  };

  const draw = (e) => {
    if (!isDrawing || isFinished) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2); // Cọ to hơn chút
    ctx.fill();
  };

  return (
    <div className="event-page-container">
      
      {/* POPUP BÙNG NỔ (Chỉ hiện khi cào xong) */}
      {isBoom && (
        <div className="boom-overlay">
          <div className="boom-modal">
            <div className="boom-icon">😂</div>
            <h2 className="boom-title">Opps! Tiếc quá!</h2>
            <p className="boom-desc">
              Chúc bạn may mắn lần sau nhé! <br/>
              (Nhưng chắc là không có lần sau đâu hihi)
            </p>
            <button className="close-boom-btn" onClick={() => setIsBoom(false)}>
              Đóng (Buồn quá)
            </button>
          </div>
        </div>
      )}

      <div className="event-layout">
        
        {/* CỘT TRÁI: TEXT QUẢNG CÁO */}
        <div className="event-info-col">
          <h1 className="event-title">Săn Quà Khủng 🎁</h1>
          <div className="highlight-text">
            Thử vận may - Rinh ngay iPhone 15 Pro Max!
          </div>
          <p style={{ marginTop: '20px', color: '#666', lineHeight: '1.6' }}>
            Tham gia ngay minigame cào thẻ trúng thưởng cực hấp dẫn. 
            Cơ hội sở hữu iPhone 15 Pro Max và hàng ngàn voucher giảm giá đang chờ đón bạn.
          </p>
        </div>

        {/* CỘT PHẢI: GAME CÀO */}
        <div className="event-game-col">
          <div className="scratch-card-wrapper">
            
            {/* Thông tin lượt dùng */}
            <div className="usage-info">
              <span>Lượt mua: <span className="usage-tag">Dành cho khách hàng mới</span></span>
              <span>Lượt sử dụng: <span className="usage-tag">1</span></span>
            </div>

            {/* KHUNG CÀO */}
            <div className="scratch-area" ref={containerRef}>
              
              {/* LỚP KẾT QUẢ (ẨN DƯỚI) */}
              <div className="result-layer">
                <div className="result-emoji">😅</div>
                <div className="result-msg">Chúc bạn may mắn lần sau!</div>
                <div className="result-sub">(Nhưng chắc là không có lần sau đâu hihi)</div>
              </div>

              {/* LỚP CANVAS (PHỦ TRÊN) */}
              <canvas
                ref={canvasRef}
                className="scratch-canvas"
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
              />
            </div>

            {/* CÁC NÚT ĐIỀU KHIỂN */}
            <div className="game-actions">
              <button className="action-btn reset" onClick={() => setResetKey(k => k + 1)}>
                🔄 Cào lại
              </button>
              <Link to="/shop" style={{ flex: 1 }}>
                <button className="action-btn shop" style={{ width: '100%' }}>
                  🛍️ Về cửa hàng
                </button>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
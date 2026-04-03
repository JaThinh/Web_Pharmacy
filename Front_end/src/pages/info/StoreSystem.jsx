import React, { useState } from 'react';
import './StoreSystem.css'; // Import file CSS vừa tạo

// DỮ LIỆU CỬA HÀNG (Mô phỏng 4 Quận tại HCM)
const STORES_DATA = [
  {
    id: 1,
    name: "Nhà Thuốc Trung Tâm Quận 1",
    district: "Quận 1",
    address: "68 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM",
    image: "/src/assets/store-q1.jpg", 
    phone: "028 3822 6868",
    hours: "07:00 - 23:00",
    blog: `
      Nằm ngay tại phố đi bộ Nguyễn Huệ sầm uất, đây là cửa hàng Flagship (kiểu mẫu) đầu tiên của hệ thống. 
      Với không gian rộng hơn 200m2, chi nhánh Quận 1 không chỉ cung cấp đầy đủ các loại thuốc đặc trị hiếm có 
      mà còn tích hợp khu vực tư vấn sức khỏe VIP riêng biệt.
      
      Điểm nhấn của cửa hàng là hệ thống Robot lấy thuốc tự động giúp giảm thời gian chờ đợi xuống dưới 2 phút.
      Khách hàng du lịch quốc tế rất ưa chuộng địa điểm này nhờ đội ngũ dược sĩ thông thạo tiếng Anh và tiếng Pháp.
    `
  },
  {
    id: 2,
    name: "Nhà Thuốc Phú Mỹ Hưng",
    district: "Quận 7",
    address: "102 Nguyễn Văn Linh, P. Tân Phong, Quận 7, TP.HCM",
    image: "/src/assets/store-q7.jpg",
    phone: "028 5411 9999",
    hours: "24/7",
    blog: `
      Tọa lạc tại khu đô thị văn minh Phú Mỹ Hưng, chi nhánh này được thiết kế theo không gian mở, thân thiện với thiên nhiên.
      Đây là địa điểm lý tưởng cho các gia đình trẻ với khu vực "Kid Corner" - nơi trẻ em có thể vui chơi trong khi ba mẹ được tư vấn.
      
      Nhà thuốc Quận 7 chuyên sâu về các dòng thực phẩm chức năng nhập khẩu từ Mỹ, Úc và các sản phẩm chăm sóc mẹ và bé cao cấp.
      Đặc biệt, cửa hàng hoạt động 24/7 để phục vụ cư dân bất kể ngày đêm.
    `
  },
  {
    id: 3,
    name: "Nhà Thuốc Landmark Bình Thạnh",
    district: "Bình Thạnh",
    address: "208 Nguyễn Hữu Cảnh, P. 22, Q. Bình Thạnh, TP.HCM",
    image: "/src/assets/store-bt.jpg",
    phone: "028 3512 8888",
    hours: "06:30 - 22:30",
    blog: `
      Nằm ngay dưới chân tòa tháp Landmark 81, chi nhánh Bình Thạnh mang hơi thở hiện đại và năng động. 
      Đây là điểm đến quen thuộc của giới văn phòng và cư dân Vinhomes.
      
      Cửa hàng này ứng dụng công nghệ "Tele-Medicine" (Bác sĩ từ xa), cho phép khách hàng kết nối video call trực tiếp 
      với bác sĩ chuyên khoa ngay tại quầy thuốc để được kê đơn chính xác nhất. Chúng tôi cũng cung cấp dịch vụ giao thuốc siêu tốc 
      trong vòng 30 phút cho khu vực nội khu.
    `
  },
  {
    id: 4,
    name: "Nhà Thuốc Gò Vấp (Khu Dân Cư)",
    district: "Gò Vấp",
    address: "365 Phan Văn Trị, P. 10, Q. Gò Vấp, TP.HCM",
    image: "/src/assets/store-gv.jpg",
    phone: "028 3996 7777",
    hours: "07:00 - 22:00",
    blog: `
      Gò Vấp là khu vực đông dân cư nhất thành phố, vì vậy chi nhánh này được tối ưu hóa để phục vụ số lượng lớn khách hàng mỗi ngày 
      với giá cả bình ổn nhất hệ thống.
      
      Nhà thuốc Gò Vấp thường xuyên tổ chức các buổi đo huyết áp, tiểu đường miễn phí vào cuối tuần cho người cao tuổi. 
      Kho thuốc tại đây cực kỳ đa dạng, tập trung vào các nhóm bệnh mãn tính như tim mạch, huyết áp, xương khớp, 
      đảm bảo không bao giờ đứt hàng thuốc thiết yếu.
    `
  }
];

const StoreSystem = () => {
  const [selectedStore, setSelectedStore] = useState(null);

  // Hàm mở Modal
  const openModal = (store) => {
    setSelectedStore(store);
    // Khóa cuộn trang chính khi mở modal
    document.body.style.overflow = 'hidden';
  };

  // Hàm đóng Modal
  const closeModal = () => {
    setSelectedStore(null);
    // Mở lại cuộn trang
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="store-page-container">
      <div className="store-header">
        <h1>Hệ Thống Nhà Thuốc Tại TP.HCM</h1>
        <p>Tìm nhà thuốc gần bạn nhất để được tư vấn và hỗ trợ kịp thời</p>
      </div>

      {/* Grid danh sách cửa hàng */}
      <div className="store-grid">
        {STORES_DATA.map((store) => (
          <div key={store.id} className="store-card" onClick={() => openModal(store)}>
            <img 
              src={store.image} 
              alt={store.name} 
              className="store-card-img"
              onError={(e) => (e.target.src = 'https://placehold.co/600x400/0072ce/white?text=Store+Image')}
            />
            <div className="store-card-body">
              <span className="store-district-tag">{store.district}</span>
              <h3 className="store-card-title">{store.name}</h3>
              <p className="store-card-address">📍 {store.address}</p>
              <button className="btn-view-detail">Xem chi tiết</button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CHI TIẾT (Chỉ hiện khi selectedStore có dữ liệu) */}
      {selectedStore && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>&times;</button>
            
            <div className="modal-body">
              {/* Cột Trái: Ảnh */}
              <div className="modal-image-col">
                <img 
                  src={selectedStore.image} 
                  alt={selectedStore.name} 
                  onError={(e) => (e.target.src = 'https://placehold.co/600x400/0072ce/white?text=Store+Image')}
                />
              </div>

              {/* Cột Phải: Thông tin & Blog */}
              <div className="modal-info-col">
                <span className="store-district-tag">{selectedStore.district}</span>
                <h2 className="modal-title">{selectedStore.name}</h2>
                <p className="modal-address">📍 {selectedStore.address}</p>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.95rem', color: '#555' }}>
                  <span>📞 <strong>Hotline:</strong> {selectedStore.phone}</span>
                  <span>⏰ <strong>Giờ mở cửa:</strong> {selectedStore.hours}</span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

                <h3 className="modal-blog-title">Giới thiệu chi nhánh</h3>
                <p className="modal-blog-content">
                  {selectedStore.blog}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreSystem;
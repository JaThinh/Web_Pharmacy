import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
  // Dùng style object cho ảnh để không cần sửa file CSS
  const imageStyle = {
    width: '100%',
    height: 'auto',
    borderRadius: '12px',
    margin: '24px 0',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    objectFit: 'cover',
  };

  return (
    <div className="about-container">
      <h1 className="about-title">Giới Thiệu Về Nhà Thuốc Trực Tuyến</h1>

      <p className="about-intro">
        Nhà Thuốc Trực Tuyến Hiệu Thuốc Trực Tuyến được thành lập với sứ
        mệnh mang đến giải pháp chăm sóc sức khỏe toàn diện, tiện lợi và đáng
        tin cậy cho mọi gia đình Việt. Trong thời đại số, chúng tôi tin rằng
        việc tiếp cận các sản phẩm y tế chất lượng và nhận được sự tư vấn chuyên
        môn không nên bị giới hạn bởi khoảng cách hay thời gian.
      </p>

      <section>
        <h2>Lịch sử hình thành và phát triển</h2>
        <p>
          Ra đời từ ý tưởng "Sức khỏe là vàng", chúng tôi nhận thấy nhu cầu cấp
          thiết của người dân trong việc tìm kiếm một địa chỉ nhà thuốc online
          uy tín, minh bạch về nguồn gốc sản phẩm và giá cả. Bắt đầu từ một
          nhóm nhỏ các dược sĩ tâm huyết và chuyên gia công nghệ, chúng tôi đã
          xây dựng nền tảng này từ con số không.
        </p>
        <p>
          Trải qua nhiều giai đoạn phát triển, từ một website bán hàng cơ bản,
          chúng tôi đã không ngừng nâng cấp hệ thống, mở rộng danh mục sản
          phẩm từ thuốc không kê đơn, thực phẩm chức năng, đến các thiết bị y
          tế gia đình. Mỗi cột mốc đều đánh dấu sự nỗ lực không ngừng nghỉ của
          chúng tôi để phục vụ cộng đồng tốt hơn.
        </p>

        {/* --- VỊ TRÍ ẢNH 1 --- */}
        <img
          src="/src/assets/placeholder_history.jpg"
          alt="Hình ảnh cột mốc hoặc cửa hàng đầu tiên"
          style={imageStyle}
        />
      </section>

      <section>
        <h2>Sứ mệnh & Tầm nhìn</h2>

        <h3>Sứ mệnh</h3>
        <p>
          Sứ mệnh của chúng tôi là "Phụng sự sức khỏe cộng đồng". Chúng tôi cam
          kết cung cấp 100% sản phẩm chính hãng, dịch vụ tư vấn chuyên nghiệp
          từ đội ngũ dược sĩ, và trải nghiệm mua sắm nhanh chóng, an toàn.
          Chúng tôi muốn trở thành người bạn đồng hành đáng tin cậy trên hành
          trình chăm sóc sức khỏe của mỗi cá nhân và gia đình.
        </p>

        <h3>Tầm nhìn</h3>
        <p>
          Đến năm 2030, Hiệu Thuốc Trực Tuyến đặt mục tiêu trở thành nền tảng
          nhà thuốc trực tuyến (HealthTech) hàng đầu tại Việt Nam, ứng dụng
          công nghệ AI và Big Data để cá nhân hóa trải nghiệm tư vấn và chăm
          sóc, giúp mọi người dân, dù ở bất kỳ đâu, cũng có thể tiếp cận dịch
          vụ y tế chất lượng cao.
        </p>
      </section>

      <section>
        <h2>Giá trị cốt lõi</h2>
        <p>
          Mọi hoạt động của chúng tôi, từ nhân viên kho, dược sĩ tư vấn đến đội
          ngũ kỹ thuật, đều xoay quanh 5 giá trị cốt lõi:
        </p>

        <ul>
          <li>
            <strong>Chất lượng:</strong> 100% sản phẩm chính hãng, có nguồn
            gốc rõ ràng, được kiểm duyệt nghiêm ngặt và bảo quản theo tiêu chuẩn GPP.
          </li>
          <li>
            <strong>Tin cậy:</strong> Thông tin minh bạch, tư vấn tận tâm và
            trung thực. Chúng tôi luôn đặt lợi ích và sự an toàn của khách hàng
            lên hàng đầu.
          </li>
          <li>
            <strong>Tiện lợi:</strong> Giao diện dễ dùng, quy trình đặt hàng
            đơn giản, hỗ trợ đa kênh và giao hàng nhanh chóng trên toàn quốc.
          </li>
          <li>
            <strong>Chuyên môn:</strong> Đội ngũ dược sĩ giàu kinh nghiệm, luôn
            sẵn sàng tư vấn 24/7, đảm bảo khách hàng sử dụng thuốc an toàn,
            hợp lý và hiệu quả.
          </li>
          <li>
            <strong>Đổi mới:</strong> Luôn tìm tòi, ứng dụng công nghệ mới để
            tối ưu hóa dịch vụ, mang đến trải nghiệm vượt trội cho khách hàng.
          </li>
        </ul>
      </section>

      <section>
        <h2>Đội ngũ của chúng tôi</h2>
        <p>
          Con người là yếu tố then chốt tạo nên thành công. Chúng tôi tự hào có
          một đội ngũ không chỉ giỏi về chuyên môn mà còn thực sự "sống" với giá
          trị cốt lõi của công ty. Từ các dược sĩ đại học với nhiều năm kinh
          nghiệm tại các bệnh viện lớn, đến các chuyên gia công nghệ luôn nỗ
          lực từng ngày để hệ thống vận hành mượt mà.
        </p>

        {/* --- VỊ TRÍ ẢNH 2 --- */}
        <img
          src="/src/assets/placeholder_team.jpg"
          alt="Đội ngũ dược sĩ và nhân viên"
          style={imageStyle}
        />

        <p>
          Tất cả chúng tôi chia sẻ chung một niềm tin: mang lại giá trị thực sự
          cho sức khỏe cộng đồng là con đường bền vững nhất.
        </p>
      </section>
      
      <section>
        <h2>Công nghệ & Bảo quản</h2>
        <p>
          Để đảm bảo chất lượng thuốc đến tay người tiêu dùng, chúng tôi đầu tư
          mạnh mẽ vào hệ thống kho bãi và công nghệ. Hệ thống kho lạnh đạt
          chuẩn GSP (Thực hành tốt bảo quản thuốc), đảm bảo thuốc (đặc biệt là
          vắc-xin, chế phẩm sinh học) được lưu trữ trong điều kiện nhiệt độ, độ
          ẩm tối ưu.
        </p>

        {/* --- VỊ TRÍ ẢNH 3 --- */}
        <img
          src="/src/assets/placeholder_lab.jpg"
          alt="Hệ thống kho bãi hoặc công nghệ bảo quản"
          style={imageStyle}
        />
      </section>

      <section>
        <h2>Cam kết dịch vụ</h2>
        <p>
          Chúng tôi hiểu rằng sức khỏe là tài sản vô giá. Vì vậy, chúng tôi cam
          kết:
        </p>

        <ol>
          <li>
            <strong>Chỉ bán hàng chính hãng:</strong> Nói không với hàng giả,
            hàng nhái, hàng kém chất lượng. Hợp tác trực tiếp với các nhà sản
            xuất và phân phối uy tín.
          </li>
          <li>
            <strong>Tư vấn đúng & đủ:</strong> Đội ngũ dược sĩ tư vấn dựa trên
            thông tin khách hàng cung cấp, không lạm dụng thuốc, không bán
            thuốc vì lợi nhuận.
          </li>
          <li>
            <strong>Giao hàng nhanh và an toàn:</strong> Đóng gói cẩn thận,
            bảo mật thông tin sản phẩm (che tên sản phẩm nhạy cảm), và hợp tác
            với các đối tác vận chuyển uy tín.
          </li>
          <li>
            <strong>Giá cả cạnh tranh:</strong> Tối ưu chi phí vận hành bằng
            công nghệ để mang đến mức giá hợp lý nhất cho khách hàng.
          </li>
        </ol>
      </section>
    </div>
  );
};

export default AboutPage;
import React from 'react';
import './PrivacyPage.css'; // <--- THÊM DÒNG NÀY VÀO

const PrivacyPage = () => {
  return (
    // Đã xóa style inline "padding: 24px"
    <div className="static-page-container">
      <h1>Chính Sách Bảo Mật</h1>
      <p>
        Chào mừng bạn đến với Nhà Thuốc Trực Tuyến của chúng tôi. Chúng tôi cam
        kết bảo vệ thông tin cá nhân của người dùng. Mọi dữ liệu thu thập được
        sử dụng nhằm mục đích cung cấp dịch vụ, xử lý đơn hàng, hỗ trợ khách
        hàng và cải thiện trải nghiệm người dùng.
      </p>
      <p>
        Chính sách Bảo mật này mô tả cách chúng tôi thu thập, sử dụng, và bảo vệ
        thông tin cá nhân của bạn khi bạn truy cập và sử dụng website của chúng
        tôi.
      </p>

      <h2>1. Mục đích và Phạm vi Thu thập Thông tin</h2>
      <p>
        Chúng tôi thu thập thông tin cá nhân của bạn để:
      </p>
      <ul>
        <li>
          <strong>Xử lý đơn hàng:</strong> Tên, địa chỉ giao hàng, số điện
          thoại và email để xác nhận và giao đơn hàng.
        </li>
        <li>
          <strong>Hỗ trợ khách hàng:</strong> Sử dụng thông tin để phản hồi các
          yêu cầu, thắc mắc hoặc khiếu nại của bạn.
        </li>
        <li>
          <strong>Cải thiện dịch vụ:</strong> Phân tích dữ liệu sử dụng (không
          bao gồm danh tính) để hiểu rõ hơn về nhu cầu của khách hàng và cải
          thiện giao diện, tính năng website.
        </li>
        <li>
          <strong>Tiếp thị và Khuyến mãi (nếu có sự đồng ý):</strong> Gửi
          thông tin về các chương trình khuyến mãi, sản phẩm mới nếu bạn đăng
          ký nhận tin.
        </li>
      </ul>

      <h2>2. Phạm vi Sử dụng Thông tin</h2>
      <p>
        Thông tin cá nhân thu thập được sẽ chỉ được sử dụng trong nội bộ công ty.
        Chúng tôi không chia sẻ thông tin cá nhân với bên thứ ba nào khác, ngoại
        trừ các trường hợp sau:
      </p>
      <ul>
        <li>
          <strong>Đối tác vận chuyển:</strong> Chúng tôi sẽ cung cấp thông tin
          cần thiết (tên, địa chỉ, SĐT) cho đơn vị vận chuyển để giao hàng.
        </li>
        <li>
          <strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu từ các cơ quan pháp
          luật có thẩm quyền.
        </li>
        <li>
          <strong>Thanh toán trực tuyến:</strong> Thông tin thanh toán của bạn
          (nếu dùng) sẽ được xử lý bởi các cổng thanh toán uy tín và được mã
          hóa. Chúng tôi không lưu trữ thông tin thẻ ngân hàng của bạn.
        </li>
      </ul>

      <h2>3. Thời gian Lưu trữ Thông tin</h2>
      <p>
        Dữ liệu cá nhân của khách hàng sẽ được lưu trữ cho đến khi có yêu cầu
        hủy bỏ từ phía khách hàng. Trong mọi trường hợp khác, thông tin cá nhân
        sẽ được bảo mật trên máy chủ của chúng tôi.
      </p>

      <h2>4. Quyền của Khách hàng</h2>
      <p>
        Bạn có toàn quyền truy cập, điều chỉnh hoặc xóa thông tin cá nhân của
        mình. Bạn có thể thực hiện việc này bằng cách đăng nhập vào tài khoản
        của mình trên website hoặc liên hệ trực tiếp với chúng tôi.
      </p>

      <h2>5. Bảo mật Thông tin Cá nhân</h2>
      <p>
        Chúng tôi cam kết bảo vệ thông tin của bạn. Chúng tôi áp dụng các biện
        pháp kỹ thuật, quy trình quản lý và an ninh phù hợp để bảo vệ dữ liệu
        khỏi mất mát, truy cập trái phép, tiết lộ, thay đổi hoặc phá hủy.
      </p>
      <h2>6. Sử dụng Cookies</h2>
      <p>
        Website của chúng tôi có thể sử dụng "cookies" để giúp cá nhân hóa và
        nâng cao trải nghiệm của bạn. Cookies giúp chúng tôi nhận ra bạn khi bạn
        quay lại, lưu trữ các sản phẩm trong giỏ hàng. Bạn có thể chấp nhận
        hoặc từ chối cookies trong trình duyệt của mình.
      </p>
      <h2>7. Thay đổi về Chính sách</h2>
      <p>
        Chúng tôi có quyền thay đổi nội dung của Chính sách Bảo mật này bất cứ
        lúc nào để phù hợp với các thay đổi của dịch vụ hoặc quy định pháp luật.
        Mọi thay đổi sẽ được đăng tải công khai trên website này.
      </p>

      <h2>8. Thông tin Liên hệ</h2>
      <p>
        Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào về Chính sách Bảo mật, vui
        lòng liên hệ với chúng tôi qua mục "Liên hệ" trên trang web để được giải
        đáp kịp thời.
      </p>
    </div>
  );
};

export default PrivacyPage;
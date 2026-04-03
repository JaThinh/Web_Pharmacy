// Mock data from pharmacy database
// This is used as fallback when database connection fails

const mockData = {
  announcements: [
    {
      Id: 1,
      Title: 'Chào mừng đến hiệu thuốc trực tuyến',
      Content: 'Chúng tôi cung cấp các sản phẩm dược phẩm chất lượng cao với giá cạnh tranh',
      Url: 'http://localhost:5173/shop',
      PublishedAt: '2026-04-03T02:19:57.237',
      IsActive: true
    },
    {
      Id: 2,
      Title: 'Khuyến mại đặc biệt tuần này',
      Content: 'Giảm 20% cho Vitamin C và các sản phẩm bổ sung',
      Url: 'http://localhost:5173/product/1',
      PublishedAt: '2026-04-03T02:19:57.237',
      IsActive: true
    },
    {
      Id: 3,
      Title: 'Cập nhật tính năng mới',
      Content: 'Thêm tính năng chat trực tiếp với nhà thuốc để được tư vấn',
      Url: 'http://localhost:5173/chat',
      PublishedAt: '2026-04-03T02:19:57.237',
      IsActive: true
    },
    {
      Id: 4,
      Title: 'Giao hàng miễn phí',
      Content: 'Đơn hàng từ 500.000đ trở lên được giao hàng miễn phí',
      Url: 'http://localhost:5173/checkout',
      PublishedAt: '2026-04-03T02:19:57.237',
      IsActive: true
    }
  ],

  users: [
    {
      Id: 1,
      Username: 'admin',
      Email: 'admin@pharmacy.com',
      PasswordHash: '$2a$10$g1rSgPsMs/sX9cUSRv6EhO3DL4h/K2bAZuem5qj18/wSBo42Rq.oK',
      FullName: 'Admin User',
      Phone: '0987654321',
      Address: '123 Main St',
      Role: 'admin'
    },
    {
      Id: 2,
      Username: 'testuser',
      Email: 'test@example.com',
      PasswordHash: '$2a$10$g1rSgPsMs/sX9cUSRv6EhO3DL4h/K2bAZuem5qj18/wSBo42Rq.oK',
      FullName: 'Test User',
      Phone: '0123456789',
      Address: '456 Oak Ave',
      Role: 'customer'
    },
    {
      Id: 3,
      Username: 'johndoe',
      Email: 'john@example.com',
      PasswordHash: '$2a$10$g1rSgPsMs/sX9cUSRv6EhO3DL4h/K2bAZuem5qj18/wSBo42Rq.oK',
      FullName: 'John Doe',
      Phone: '0912345678',
      Address: '789 Pine Rd',
      Role: 'customer'
    }
  ],

  cartItems: [],

  products: [
    {
      Id: 1,
      Name: 'Vitamin C 500mg',
      Description: 'Viên vitamin C hỗ trợ miễn dịch, chống oxy hóa',
      Price: 50000,
      Image: 'https://via.placeholder.com/300x300?text=Vitamin+C+500mg',
      Stock: 100
    },
    {
      Id: 2,
      Name: 'Vitamin D3 1000IU',
      Description: 'Vitamin D3 bổ sung canxi cho xương',
      Price: 75000,
      Image: 'https://via.placeholder.com/300x300?text=Vitamin+D3+1000IU',
      Stock: 80
    },
    {
      Id: 3,
      Name: 'Cough Syrup',
      Description: 'Thuốc ho hiệu quả an toàn cho cả gia đình',
      Price: 35000,
      Image: 'https://via.placeholder.com/300x300?text=Cough+Syrup',
      Stock: 150
    },
    {
      Id: 4,
      Name: 'Cold Tablet',
      Description: 'Viên hạ sốt, giảm ho, sổ mũi',
      Price: 25000,
      Image: 'https://via.placeholder.com/300x300?text=Cold+Tablet',
      Stock: 120
    },
    {
      Id: 5,
      Name: 'Paracetamol 500mg',
      Description: 'Thuốc hạ sốt, giảm đau hiệu quả',
      Price: 15000,
      Image: 'https://via.placeholder.com/300x300?text=Paracetamol+500mg',
      Stock: 200
    },
    {
      Id: 6,
      Name: 'Ibuprofen 200mg',
      Description: 'Giảm đau, chống viêm',
      Price: 20000,
      Image: 'https://via.placeholder.com/300x300?text=Ibuprofen+200mg',
      Stock: 150
    },
    {
      Id: 7,
      Name: 'Probiotics',
      Description: 'Lợi khuẩn hỗ trợ tiêu hóa khỏe mạnh',
      Price: 120000,
      Image: 'https://via.placeholder.com/300x300?text=Probiotics',
      Stock: 60
    },
    {
      Id: 8,
      Name: 'Antacid Tablets',
      Description: 'Giảm axit dạ dày, khó tiêu',
      Price: 30000,
      Image: 'https://via.placeholder.com/300x300?text=Antacid+Tablets',
      Stock: 80
    },
    {
      Id: 9,
      Name: 'Face Cream',
      Description: 'Kem dưỡng ẩm cho da mặt',
      Price: 250000,
      Image: 'https://via.placeholder.com/300x300?text=Face+Cream',
      Stock: 40
    },
    {
      Id: 10,
      Name: 'Sunscreen SPF 50',
      Description: 'Kem chống nắng bảo vệ toàn diện',
      Price: 180000,
      Image: 'https://via.placeholder.com/300x300?text=Sunscreen+SPF+50',
      Stock: 70
    }
  ],

  diseases: [
    {
      Id: 1,
      Name: 'Cảm cúm',
      Description: 'Bệnh do virus gây viêm đường hô hấp cấp tính',
      Symptoms: 'Sốt cao, ho, chảy nước mũi, mệt mỏi, đau cơ',
      Prevention: 'Rửa tay thường xuyên, tiêm vắc-xin, tránh tiếp xúc người bệnh'
    },
    {
      Id: 2,
      Name: 'Ho',
      Description: 'Phản xạ bảo vệ từ cơ thể để loại bỏ kích thích từ đường hô hấp',
      Symptoms: 'Ho khô hoặc có đờm, kéo dài từ vài ngày đến vài tuần',
      Prevention: 'Tránh không khí bụi, giữ ấm, uống nước ấm, tránh thuốc lá'
    },
    {
      Id: 3,
      Name: 'Đau dạ dày',
      Description: 'Cảm giác khó chịu ở vùng dạ dày',
      Symptoms: 'Đau âm ỉ hoặc chucut, chán ăn, buồn nôn',
      Prevention: 'Ăn uống đều đặn, tránh thức ăn cay nóng, quản lý stress'
    },
    {
      Id: 4,
      Name: 'Mệt mỏi',
      Description: 'Tình trạng thiếu năng lượng và sinh lực',
      Symptoms: 'Mất năng lượng, khó tập trung, chán ăn',
      Prevention: 'Ngủ đủ giấc, tập thể dục, ăn tốt, quản lý stress'
    }
  ]
};

module.exports = {
  mockData
};

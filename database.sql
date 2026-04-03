-- Create Pharmacy Database Schema and Sample Data

-- ============================================
-- 1. CREATE USERS TABLE
-- ============================================
CREATE TABLE [Users] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Username] NVARCHAR(100) UNIQUE NOT NULL,
    [Email] NVARCHAR(100) UNIQUE NOT NULL,
    [PasswordHash] NVARCHAR(255) NOT NULL,
    [FullName] NVARCHAR(150) NOT NULL,
    [Phone] NVARCHAR(20),
    [Address] NVARCHAR(255),
    [Avatar] NVARCHAR(MAX),
    [Role] NVARCHAR(50) DEFAULT 'customer',
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    [UpdatedAt] DATETIME DEFAULT GETDATE()
);

-- ============================================
-- 2. CREATE CATEGORIES TABLE
-- ============================================
CREATE TABLE [Categories] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Name] NVARCHAR(150) NOT NULL,
    [Description] NVARCHAR(MAX),
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- ============================================
-- 3. CREATE PRODUCTS TABLE
-- ============================================
CREATE TABLE [Products] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Name] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(MAX),
    [Price] DECIMAL(10, 2) NOT NULL,
    [Image] NVARCHAR(MAX),
    [CategoryId] INT,
    [Stock] INT DEFAULT 0,
    [IsActive] BIT DEFAULT 1,
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    [UpdatedAt] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([CategoryId]) REFERENCES [Categories]([Id])
);

-- ============================================
-- 4. CREATE ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE [Announcements] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Title] NVARCHAR(250) NOT NULL,
    [Content] NVARCHAR(MAX),
    [Url] NVARCHAR(MAX),
    [Image] NVARCHAR(MAX),
    [IsActive] BIT DEFAULT 1,
    [PublishedAt] DATETIME DEFAULT GETDATE(),
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    [UpdatedAt] DATETIME DEFAULT GETDATE()
);

-- ============================================
-- 5. CREATE DISEASES TABLE
-- ============================================
CREATE TABLE [Diseases] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [Name] NVARCHAR(150) NOT NULL,
    [Description] NVARCHAR(MAX),
    [Symptoms] NVARCHAR(MAX),
    [Prevention] NVARCHAR(MAX),
    [Image] NVARCHAR(MAX),
    [CreatedAt] DATETIME DEFAULT GETDATE()
);

-- ============================================
-- 6. CREATE CART TABLE
-- ============================================
CREATE TABLE [Cart] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [UserId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Quantity] INT DEFAULT 1,
    [AddedAt] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]),
    FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
);

-- ============================================
-- 7. CREATE ORDERS TABLE
-- ============================================
CREATE TABLE [Orders] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [UserId] INT NOT NULL,
    [TotalPrice] DECIMAL(10, 2) NOT NULL,
    [Status] NVARCHAR(50) DEFAULT 'pending',
    [ShippingAddress] NVARCHAR(MAX),
    [Phone] NVARCHAR(20),
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    [UpdatedAt] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([UserId]) REFERENCES [Users]([Id])
);

-- ============================================
-- 8. CREATE ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE [OrderItems] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [OrderId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Quantity] INT NOT NULL,
    [Price] DECIMAL(10, 2) NOT NULL,
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([OrderId]) REFERENCES [Orders]([Id]),
    FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
);

-- ============================================
-- 9. CREATE COMMENTS TABLE
-- ============================================
CREATE TABLE [Comments] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [UserId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [Rating] INT CHECK ([Rating] >= 1 AND [Rating] <= 5),
    [Text] NVARCHAR(MAX),
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    [UpdatedAt] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]),
    FOREIGN KEY ([ProductId]) REFERENCES [Products]([Id])
);

-- ============================================
-- 10. CREATE CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE [ChatMessages] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [SenderId] INT NOT NULL,
    [ReceiverId] INT,
    [Message] NVARCHAR(MAX) NOT NULL,
    [Image] NVARCHAR(MAX),
    [IsRead] BIT DEFAULT 0,
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([SenderId]) REFERENCES [Users]([Id])
);

-- ============================================
-- 11. CREATE PAYMENTS TABLE
-- ============================================
CREATE TABLE [Payments] (
    [Id] INT PRIMARY KEY IDENTITY(1,1),
    [OrderId] INT NOT NULL,
    [Amount] DECIMAL(10, 2) NOT NULL,
    [PaymentMethod] NVARCHAR(50),
    [TransactionId] NVARCHAR(255),
    [Status] NVARCHAR(50) DEFAULT 'pending',
    [CreatedAt] DATETIME DEFAULT GETDATE(),
    [UpdatedAt] DATETIME DEFAULT GETDATE(),
    FOREIGN KEY ([OrderId]) REFERENCES [Orders]([Id])
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert Categories
INSERT INTO [Categories] ([Name], [Description]) VALUES
('Vitamin & Supplement', 'Các loại vitamin và thực phẩm bổ sung'),
('Cold & Flu', 'Thuốc điều trị cảm cúm'),
('Pain Relief', 'Thuốc giảm đau'),
('Digestive', 'Thuốc cho hệ tiêu hóa'),
('Skin Care', 'Các sản phẩm chăm sóc da');

-- Insert Sample Users
INSERT INTO [Users] ([Username], [Email], [PasswordHash], [FullName], [Phone], [Address], [Role]) VALUES
('admin', 'admin@pharmacy.com', 'hashed_password_admin', 'Admin User', '0987654321', '123 Main St', 'admin'),
('testuser', 'test@example.com', 'hashed_password_test', 'Test User', '0123456789', '456 Oak Ave', 'customer'),
('johndoe', 'john@example.com', 'hashed_password_john', 'John Doe', '0912345678', '789 Pine Rd', 'customer');

-- Insert Sample Products
INSERT INTO [Products] ([Name], [Description], [Price], [CategoryId], [Stock]) VALUES
('Vitamin C 500mg', 'Viên vitamin C hỗ trợ miễn dịch, chống oxy hóa', 50000, 1, 100),
('Vitamin D3 1000IU', 'Vitamin D3 bổ sung canxi cho xương', 75000, 1, 80),
('Cough Syrup', 'Thuốc ho hiệu quả an toàn cho cả gia đình', 35000, 2, 150),
('Cold Tablet', 'Viên hạ sốt, giảm ho, sổ mũi', 25000, 2, 120),
('Paracetamol 500mg', 'Thuốc hạ sốt, giảm đau hiệu quả', 15000, 3, 200),
('Ibuprofen 200mg', 'Giảm đau, chống viêm', 20000, 3, 150),
('Probiotics', 'Lợi khuẩn hỗ trợ tiêu hóa khỏe mạnh', 120000, 4, 60),
('Antacid Tablets', 'Giảm axit dạ dày, khó tiêu', 30000, 4, 80),
('Face Cream', 'Kem dưỡng ẩm cho da mặt', 250000, 5, 40),
('Sunscreen SPF 50', 'Kem chống nắng bảo vệ toàn diện', 180000, 5, 70);

-- Insert Sample Announcements
INSERT INTO [Announcements] ([Title], [Content], [Url]) VALUES
('Chào mừng đến hiệu thuốc trực tuyến', 'Chúng tôi cung cấp các sản phẩm dược phẩm chất lượng cao với giá cạnh tranh', 'http://localhost:5173/shop'),
('Khuyến mại đặc biệt tuần này', 'Giảm 20% cho Vitamin C và các sản phẩm bổ sung', 'http://localhost:5173/product/1'),
('Cập nhật tính năng mới', 'Thêm tính năng chat trực tiếp với nhà thuốc để được tư vấn', 'http://localhost:5173/chat'),
('Giao hàng miễn phí', 'Đơn hàng từ 500.000đ trở lên được giao hàng miễn phí', 'http://localhost:5173/checkout');

-- Insert Sample Diseases
INSERT INTO [Diseases] ([Name], [Description], [Symptoms], [Prevention]) VALUES
('Cảm cúm', 'Bệnh do virus gây viêm đường hô hấp cấp tính', 'Sốt cao, ho, chảy nước mũi, mệt mỏi, đau cơ', 'Rửa tay thường xuyên, tiêm vắc-xin, tránh tiếp xúc người bệnh'),
('Ho', 'Phản xạ bảo vệ từ cơ thể để loại bỏ kích thích từ đường hô hấp', 'Ho khô hoặc có đờm, kéo dài từ vài ngày đến vài tuần', 'Tránh không khí bụi, giữ ấm, uống nước ấm, tránh thuốc lá'),
('Đau dạ dày', 'Cảm giác khó chịu ở vùng dạ dày', 'Đau âm ỉ hoặc chucut, chán ăn, buồn nôn', 'Ăn uống đều đặn, tránh thức ăn cay nóng, quản lý stress'),
('Mệt mỏi', 'Tình trạng thiếu năng lượng và sinh lực', 'Mất năng lượng, khó tập trung, chán ăn', 'Ngủ đủ giấc, tập thể dục, ăn tốt, quản lý stress');

print 'Database setup completed successfully!';

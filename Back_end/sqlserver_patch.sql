-- SQL Server compatibility patch for Pharmacy backend (PostgreSQL-style schema)
-- Run this inside your pharmacy_db on SQL Server.

USE pharmacy_db;
GO

-- ===== USERS =====
-- Ensure PasswordHash exists (usually already)
IF COL_LENGTH('dbo.Users', 'PasswordHash') IS NULL
  ALTER TABLE dbo.Users ADD PasswordHash NVARCHAR(255) NULL;

-- ===== PRODUCTS =====
IF COL_LENGTH('dbo.Products', 'Slug') IS NULL
  ALTER TABLE dbo.Products ADD Slug NVARCHAR(255) NULL;

IF COL_LENGTH('dbo.Products', 'ShortDesc') IS NULL
  ALTER TABLE dbo.Products ADD ShortDesc NVARCHAR(MAX) NULL;

IF COL_LENGTH('dbo.Products', 'Category') IS NULL
  ALTER TABLE dbo.Products ADD Category NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Products', 'Brand') IS NULL
  ALTER TABLE dbo.Products ADD Brand NVARCHAR(100) NULL;

IF COL_LENGTH('dbo.Products', 'ImageURL') IS NULL
  ALTER TABLE dbo.Products ADD ImageURL NVARCHAR(MAX) NULL;

-- ===== CART ITEMS =====
IF OBJECT_ID('dbo.CartItems', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.CartItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    Qty INT NOT NULL DEFAULT 1
  );
  CREATE UNIQUE INDEX UX_CartItems_User_Product ON dbo.CartItems (UserId, ProductId);
END

-- ===== ORDERS =====
IF COL_LENGTH('dbo.Orders', 'Code') IS NULL
  ALTER TABLE dbo.Orders ADD Code NVARCHAR(50) NULL;

IF COL_LENGTH('dbo.Orders', 'Total') IS NULL
  ALTER TABLE dbo.Orders ADD Total DECIMAL(10,2) NULL;

IF COL_LENGTH('dbo.Orders', 'Address') IS NULL
  ALTER TABLE dbo.Orders ADD Address NVARCHAR(MAX) NULL;

IF COL_LENGTH('dbo.Orders', 'Phone') IS NULL
  ALTER TABLE dbo.Orders ADD Phone NVARCHAR(20) NULL;

IF COL_LENGTH('dbo.Orders', 'Note') IS NULL
  ALTER TABLE dbo.Orders ADD Note NVARCHAR(MAX) NULL;

IF COL_LENGTH('dbo.Orders', 'PaymentMethod') IS NULL
  ALTER TABLE dbo.Orders ADD PaymentMethod NVARCHAR(50) NULL;

IF COL_LENGTH('dbo.Orders', 'ETA') IS NULL
  ALTER TABLE dbo.Orders ADD ETA DATETIME NULL;

-- ===== ORDER ITEMS =====
IF COL_LENGTH('dbo.OrderItems', 'ProductName') IS NULL
  ALTER TABLE dbo.OrderItems ADD ProductName NVARCHAR(255) NULL;

IF COL_LENGTH('dbo.OrderItems', 'ProductImage') IS NULL
  ALTER TABLE dbo.OrderItems ADD ProductImage NVARCHAR(MAX) NULL;

IF COL_LENGTH('dbo.OrderItems', 'Qty') IS NULL
  ALTER TABLE dbo.OrderItems ADD Qty INT NULL;

-- ===== COMMENTS =====
IF COL_LENGTH('dbo.Comments', 'Content') IS NULL
  ALTER TABLE dbo.Comments ADD Content NVARCHAR(MAX) NULL;

IF COL_LENGTH('dbo.Comments', 'ParentId') IS NULL
  ALTER TABLE dbo.Comments ADD ParentId INT NULL;

IF COL_LENGTH('dbo.Comments', 'OrderId') IS NULL
  ALTER TABLE dbo.Comments ADD OrderId INT NULL;

IF COL_LENGTH('dbo.Comments', 'CreatedAt') IS NULL
  ALTER TABLE dbo.Comments ADD CreatedAt DATETIME NULL DEFAULT GETDATE();

IF COL_LENGTH('dbo.Comments', 'UpdatedAt') IS NULL
  ALTER TABLE dbo.Comments ADD UpdatedAt DATETIME NULL DEFAULT GETDATE();

-- ===== CHAT THREADS =====
IF OBJECT_ID('dbo.ChatThreads', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.ChatThreads (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    AttachmentType NVARCHAR(50) NULL,
    AttachmentId INT NULL,
    Status NVARCHAR(20) DEFAULT 'active',
    LastMessage NVARCHAR(MAX) NULL,
    LastMessageAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
  );
END

-- ===== CHAT MESSAGES =====
IF COL_LENGTH('dbo.ChatMessages', 'ThreadId') IS NULL
  ALTER TABLE dbo.ChatMessages ADD ThreadId INT NULL;

IF COL_LENGTH('dbo.ChatMessages', 'SenderRole') IS NULL
  ALTER TABLE dbo.ChatMessages ADD SenderRole NVARCHAR(50) NULL;

IF COL_LENGTH('dbo.ChatMessages', 'Content') IS NULL
  ALTER TABLE dbo.ChatMessages ADD Content NVARCHAR(MAX) NULL;

IF COL_LENGTH('dbo.ChatMessages', 'AttachedProductId') IS NULL
  ALTER TABLE dbo.ChatMessages ADD AttachedProductId INT NULL;

-- If you already have Message column, copy to Content once
IF COL_LENGTH('dbo.ChatMessages', 'Message') IS NOT NULL
  UPDATE dbo.ChatMessages SET Content = Message WHERE Content IS NULL;

PRINT '✅ SQL Server patch completed.';

// Back_end/sync_images.js
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { Pool } = require('pg'); // Dùng pg trực tiếp để tránh phụ thuộc file config phức tạp
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// 1. CẤU HÌNH CLOUDINARY (Dùng thông tin bạn vừa cung cấp)
cloudinary.config({
  cloud_name: 'dd1onmi19',
  api_key: '697521727136735',
  api_secret: 'U25GYEZbqBvbnFA8McAXtlamZVI'
});

// 2. CẤU HÌNH DATABASE (Quan trọng!)
// Bạn cần điền chuỗi kết nối Supabase vào đây để script sửa đúng DB trên mạng
// Ví dụ: postgresql://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
const connectionString = process.env.DATABASE_URL; 

if (!connectionString) {
    console.error("❌ LỖI: Chưa tìm thấy DATABASE_URL.");
    console.error("👉 Vui lòng tạo file .env trong thư mục Back_end và thêm dòng: DATABASE_URL=your_supabase_connection_string");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Bắt buộc cho Supabase
});

// Đường dẫn đến thư mục ảnh gốc
const LOCAL_IMAGE_DIR = path.join(__dirname, 'public', 'images');

// Hàm kiểm tra link có sống không
async function checkUrlExists(url) {
    if (!url || !url.startsWith('http')) return false;
    try {
        await axios.head(url);
        return true;
    } catch (error) {
        return false;
    }
}

async function syncImages() {
    console.log('🚀 Bắt đầu quy trình đồng bộ ảnh...');
    
    try {
        // Test kết nối Cloudinary
        const ping = await cloudinary.api.ping();
        console.log('✅ Cloudinary Connected:', ping);

        // Lấy danh sách sản phẩm
        const res = await pool.query('SELECT "Id", "Name", "Image", "ImageURL" FROM public."Products" ORDER BY "Id" ASC');
        const products = res.rows;
        console.log(`📦 Tìm thấy ${products.length} sản phẩm trong Database.`);

        for (const product of products) {
            const { Id, Name, Image, ImageURL } = product;
            
            console.log(`\n--- Đang kiểm tra: ${Name} (ID: ${Id}) ---`);

            // Kiểm tra xem link hiện tại có dùng được không
            const isAlive = await checkUrlExists(ImageURL);
            
            if (isAlive && ImageURL.includes('cloudinary')) {
                console.log('✅ Ảnh đã tồn tại trên Cloudinary. Bỏ qua.');
                continue;
            }

            console.log('⚠️ Link ảnh hỏng hoặc chưa có. Đang tìm file gốc...');

            // Xử lý tên file để tìm trong thư mục local
            // Nếu trong DB đang lưu link dài ngoằng, ta cắt lấy tên file cuối cùng
            let fileName = Image;
            if (Image && Image.includes('/')) {
                fileName = Image.split('/').pop();
            }
            // Nếu Image null, thử lấy từ ImageURL cũ
            if (!fileName && ImageURL && ImageURL.includes('/')) {
                fileName = ImageURL.split('/').pop();
            }

            const localFilePath = path.join(LOCAL_IMAGE_DIR, fileName);

            if (fs.existsSync(localFilePath)) {
                console.log(`📂 Tìm thấy file gốc: ${fileName}. Đang upload...`);
                
                try {
                    // Upload lên Cloudinary
                    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
                        folder: 'pharmacy_products',
                        public_id: fileName.split('.')[0], // Dùng tên file làm ID
                        overwrite: true,
                        resource_type: "image"
                    });

                    const newUrl = uploadResult.secure_url;
                    console.log(`☁️ Upload thành công: ${newUrl}`);

                    // Cập nhật ngược lại vào Database
                    await pool.query(
                        'UPDATE public."Products" SET "ImageURL" = $1, "Image" = $2 WHERE "Id" = $3',
                        [newUrl, newUrl, Id]
                    );
                    console.log('💾 Đã lưu link mới vào Database.');

                } catch (uploadErr) {
                    console.error('❌ Lỗi upload:', uploadErr.message);
                }
            } else {
                console.error(`❌ Không tìm thấy file ảnh gốc tại máy: ${localFilePath}`);
                console.log('👉 Gợi ý: Hãy chắc chắn bạn đã tải ảnh vào thư mục Back_end/public/images/');
            }
        }

        console.log('\n✅ === HOÀN TẤT ===');
        process.exit(0);

    } catch (err) {
        console.error('❌ Lỗi Script:', err);
        process.exit(1);
    }
}

syncImages();
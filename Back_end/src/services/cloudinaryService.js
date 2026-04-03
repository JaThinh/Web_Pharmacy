// Cloudinary Upload Service
const { cloudinary } = require('../config/cloudinaryConfig');
const streamifier = require('streamifier');

/**
 * Upload image to Cloudinary from buffer (memory)
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} folder - Cloudinary folder (default: 'products')
 * @param {String} publicId - Custom public ID (optional)
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder = 'products', publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' }, // Resize to max 800x800
          { quality: 'auto:good' }, // Auto quality optimization
          { fetch_format: 'auto' } // Auto format (WebP if supported)
        ]
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          return reject(error);
        }
        console.log('✅ Cloudinary upload success:', result.secure_url);
        resolve(result);
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<Buffer>} fileBuffers - Array of file buffers
 * @param {String} folder - Cloudinary folder
 * @returns {Promise<Array<Object>>} - Array of upload results
 */
const uploadMultipleToCloudinary = async (fileBuffers, folder = 'products') => {
  try {
    const uploadPromises = fileBuffers.map(buffer => 
      uploadToCloudinary(buffer, folder)
    );
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID (e.g., 'products/abc123')
 * @returns {Promise<Object>} - Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Cloudinary delete result:', result);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String|null} - Public ID or null
 */
const extractPublicIdFromUrl = (url) => {
  try {
    // Example URL: https://res.cloudinary.com/dd1onmi19/image/upload/v1234567890/products/abc123.jpg
    const matches = url.match(/\/([^\/]+\/[^\.]+)/);
    if (matches && matches[1]) {
      // Remove version number if exists
      return matches[1].replace(/v\d+\//, '');
    }
    return null;
  } catch (error) {
    console.error('❌ Error extracting public ID:', error);
    return null;
  }
};

/**
 * Get optimized image URL
 * @param {String} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {String} - Optimized URL
 */
const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 500,
    height = 500,
    crop = 'limit',
    quality = 'auto:good',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format
  });
};

module.exports = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  getOptimizedImageUrl
};

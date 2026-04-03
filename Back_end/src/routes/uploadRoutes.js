// Upload Routes - API endpoints cho upload ảnh
const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const cloudinaryService = require('../services/cloudinaryService');

/**
 * @route   POST /api/upload/product
 * @desc    Upload ảnh sản phẩm (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/product',
  authenticateToken,
  isAdmin,
  uploadMiddleware.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Vui lòng chọn file ảnh!' });
      }

      const productId = req.body.productId || Date.now();
      
      // Upload lên Cloudinary
      const result = await cloudinaryService.uploadToCloudinary(
        req.file.buffer,
        'pharmacy/products',
        `product_${productId}`
      );

      res.json({
        success: true,
        message: 'Upload ảnh sản phẩm thành công!',
        imageUrl: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
      });
    } catch (error) {
      console.error('❌ Upload product image error:', error);
      res.status(500).json({
        error: 'Không thể upload ảnh. Vui lòng thử lại!',
        details: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload avatar user
 * @access  Private (User)
 */
router.post(
  '/avatar',
  authenticateToken,
  uploadMiddleware.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Vui lòng chọn file ảnh!' });
      }

      const userId = req.user.Id;
      
      // Upload lên Cloudinary
      const result = await cloudinaryService.uploadToCloudinary(
        req.file.buffer,
        'pharmacy/avatars',
        `avatar_${userId}`
      );

      res.json({
        success: true,
        message: 'Upload avatar thành công!',
        avatarUrl: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
      });
    } catch (error) {
      console.error('❌ Upload avatar error:', error);
      res.status(500).json({
        error: 'Không thể upload avatar. Vui lòng thử lại!',
        details: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload nhiều ảnh (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/multiple',
  authenticateToken,
  isAdmin,
  uploadMiddleware.array('images', 10), // Tối đa 10 ảnh
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 file ảnh!' });
      }

      const folder = req.body.folder || 'pharmacy/misc';
      
      // Upload tất cả ảnh
      const fileBuffers = req.files.map((file) => file.buffer);
      const results = await cloudinaryService.uploadMultipleToCloudinary(fileBuffers, folder);

      const imageUrls = results.map((result) => result.secure_url);
      const publicIds = results.map((result) => result.public_id);

      res.json({
        success: true,
        message: `Upload ${imageUrls.length} ảnh thành công!`,
        imageUrls: imageUrls,
        publicIds: publicIds,
        count: imageUrls.length,
      });
    } catch (error) {
      console.error('❌ Upload multiple images error:', error);
      res.status(500).json({
        error: 'Không thể upload ảnh. Vui lòng thử lại!',
        details: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/upload/delete
 * @desc    Xóa ảnh từ Cloudinary (Admin only)
 * @access  Private (Admin)
 */
router.delete(
  '/delete',
  authenticateToken,
  isAdmin,
  async (req, res) => {
    try {
      const { imageUrl, publicId } = req.body;

      if (!imageUrl && !publicId) {
        return res.status(400).json({ error: 'Vui lòng cung cấp imageUrl hoặc publicId!' });
      }

      let targetPublicId = publicId;
      if (imageUrl && !publicId) {
        targetPublicId = cloudinaryService.extractPublicIdFromUrl(imageUrl);
      }

      if (!targetPublicId) {
        return res.status(400).json({ error: 'Không thể xác định public_id của ảnh!' });
      }

      const result = await cloudinaryService.deleteFromCloudinary(targetPublicId);

      res.json({
        success: true,
        message: 'Xóa ảnh thành công!',
        result: result,
      });
    } catch (error) {
      console.error('❌ Delete image error:', error);
      res.status(500).json({
        error: 'Không thể xóa ảnh. Vui lòng thử lại!',
        details: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/upload/test
 * @desc    Test Cloudinary connection
 * @access  Private (Admin)
 */
router.get('/test', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { testCloudinaryConnection } = require('../config/cloudinaryConfig');
    const isConnected = await testCloudinaryConnection();

    if (!isConnected) {
      return res.status(500).json({
        error: 'Cloudinary connection failed!',
        details: 'Check credentials or network.',
      });
    }

    res.json({
      success: true,
      message: 'Cloudinary connection OK!',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cloudinary connection failed!',
      details: error.message,
    });
  }
});

module.exports = router;

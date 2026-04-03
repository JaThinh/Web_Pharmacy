const express = require('express');
const router = express.Router();
const { getAnnouncements } = require('../controllers/announcementController');

// GET /api/announcements - Danh sách thông báo
router.get('/', getAnnouncements);

module.exports = router;

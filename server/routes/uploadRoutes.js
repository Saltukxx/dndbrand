const express = require('express');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const path = require('path');

const router = express.Router();

// @desc    Upload product images
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    res.status(200).json({
      success: true,
      data: imageUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 
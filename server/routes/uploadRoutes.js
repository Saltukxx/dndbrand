const express = require('express');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');
const path = require('path');
const logger = require('../utils/logger');

const router = express.Router();

// Initialize GridFS stream
let gfs;
mongoose.connection.once('open', () => {
  // Initialize stream
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  logger.info('GridFS connected for file uploads');
});

// @desc    Upload product images
// @route   POST /api/uploads
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    // Generate URLs for images
    const imageUrls = req.files.map(file => `/api/uploads/image/${file.filename}`);
    
    logger.info(`Successfully uploaded ${req.files.length} images`);

    res.status(200).json({
      success: true,
      data: imageUrls
    });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message
    });
  }
});

// @desc    Get an image by filename
// @route   GET /api/uploads/image/:filename
// @access  Public
router.get('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    logger.debug(`Retrieving image: ${filename}`);
    
    if (!gfs) {
      logger.error('GridFS not initialized');
      return res.status(500).json({
        success: false,
        message: 'GridFS not initialized'
      });
    }
    
    // Find the file
    gfs.find({ filename: filename }).toArray((err, files) => {
      if (err) {
        logger.error('Error finding file:', err);
        return res.status(500).json({
          success: false,
          message: 'Error finding file',
          error: err.message
        });
      }
      
      if (!files || files.length === 0) {
        logger.warn(`File not found: ${filename}`);
        return res.status(404).json({
          success: false,
          message: 'No file exists'
        });
      }
      
      // Set content type
      res.set('Content-Type', files[0].contentType);
      
      // Create read stream
      const readstream = gfs.openDownloadStreamByName(filename);
      
      // Handle errors on the readstream
      readstream.on('error', (error) => {
        logger.error('Error streaming file:', error);
        return res.status(500).json({
          success: false,
          message: 'Error streaming file',
          error: error.message
        });
      });
      
      // Pipe the file data to response
      readstream.pipe(res);
    });
  } catch (error) {
    logger.error('Error retrieving image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving image',
      error: error.message
    });
  }
});

// @desc    Delete image
// @route   DELETE /api/uploads/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!gfs) {
      logger.error('GridFS not initialized');
      return res.status(500).json({
        success: false,
        message: 'GridFS not initialized'
      });
    }
    
    // Convert string id to ObjectId
    const id = new mongoose.Types.ObjectId(req.params.id);
    logger.info(`Deleting file with id: ${id}`);
    
    // First check if file exists
    const files = await gfs.find({ _id: id }).toArray();
    
    if (!files || files.length === 0) {
      logger.warn(`File not found with id: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Delete the file
    await gfs.delete(id);
    logger.info(`File deleted successfully: ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting image',
      error: error.message
    });
  }
});

module.exports = router; 
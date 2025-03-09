const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');

// Get MongoDB connection string from environment variables
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/dndbrand';

// Create storage engine using GridFS
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // Generate a unique filename
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads' // This is the collection name for GridFS
        };
        resolve(fileInfo);
      });
    });
  }
});

// Check file type
function checkFileType(file, cb) {
  // Allowed MIME types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  // Allowed extensions
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidExt = allowedExts.includes(ext);
  const isValidMime = allowedMimes.includes(file.mimetype);
  
  if (isValidMime && isValidExt) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WebP images are allowed'));
  }
}

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload; 
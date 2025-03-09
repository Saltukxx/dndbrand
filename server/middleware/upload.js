/**
 * File upload middleware with fallback support
 */
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Wrap GridFS initialization in try-catch to handle missing dependencies
let GridFsStorage;
let gridFsStorage;
let gridfsMiddleware;

try {
  GridFsStorage = require('multer-gridfs-storage');
  
  // Create GridFS storage engine
  gridFsStorage = new GridFsStorage({
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/dndbrand',
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
      return {
        bucketName: 'uploads',
        filename: `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
      };
    }
  });
  
  gridfsMiddleware = multer({
    storage: gridFsStorage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
  });
  
  console.log("GridFS storage initialized successfully");
} catch (error) {
  console.warn(`GridFS storage initialization failed: ${error.message}`);
  console.log("Using disk storage fallback for file uploads");
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Configure disk storage as fallback
  const diskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
  });
  
  gridfsMiddleware = multer({
    storage: diskStorage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
  });
}

// Check file type
function checkFileType(file, cb) {
  // Allowed file extensions
  const filetypes = /jpeg|jpg|png|gif|webp/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
}

// Export middleware
module.exports = {
  upload: gridfsMiddleware,
  uploadSingle: gridfsMiddleware.single('image'),
  uploadMultiple: gridfsMiddleware.array('images', 5)
}; 
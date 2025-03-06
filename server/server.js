const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const seedAdmin = require('./config/seedAdmin');
const { connectDB } = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { 
  setSecureHeaders, 
  requestLogger, 
  detectSuspiciousActivity,
  validateRequestParams 
} = require('./middleware/security');
const multer = require('multer');

// Import routes
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Load environment variables
dotenv.config({ path: './config/.env' });

// Initialize express app
const app = express();

// Security middleware
app.use(helmet()); // Set security headers
app.use(setSecureHeaders); // Additional security headers
app.use(mongoSanitize()); // Prevent MongoDB injection
app.use(xss()); // Prevent XSS attacks
app.use(requestLogger); // Log all requests
app.use(detectSuspiciousActivity); // Detect suspicious activity

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api/', limiter);

// Regular middleware
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Static files
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes with parameter validation
app.use('/api/products', validateRequestParams, productRoutes);
app.use('/api/users', validateRequestParams, userRoutes);
app.use('/api/orders', validateRequestParams, orderRoutes);
app.use('/api/customers', validateRequestParams, customerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', validateRequestParams, paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Serve frontend
app.get('*', (req, res) => {
  // Define clean URL mappings
  const urlMap = {
    '/': '/public/html/index.html',
    '/shop': '/public/html/shop.html',
    '/about': '/public/html/about.html',
    '/contact': '/public/html/contact.html',
    '/cart': '/public/html/cart.html',
    '/checkout': '/public/html/checkout.html',
    '/account': '/public/html/account.html',
    '/admin': '/public/html/admin.html',
    '/admin-login': '/public/html/admin-login.html',
    '/product': '/public/html/product.html'
  };

  // Check if the URL is in our map
  const cleanPath = req.path.split('?')[0]; // Remove query parameters
  if (urlMap[cleanPath]) {
    // Serve the mapped file
    return res.sendFile(path.resolve(__dirname, '..', urlMap[cleanPath]));
  }

  // For all other routes, serve the index.html
  res.sendFile(path.resolve(__dirname, '../', 'index.html'));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    // Seed admin user
    seedAdmin();
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
};

startServer(); 
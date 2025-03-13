/**
 * DnD Brand Production Server - API Backend
 * Configured to work with GitHub Pages frontend
 */

// Load environment variables
require('dotenv').config({ path: './config/production.env' });

// Core dependencies
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Security packages
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const compression = require('compression');

// Database
const connectDB = require('./config/db');

// Route files
// Only import routes that actually exist
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import the CORS configuration
const corsMiddleware = require('./cors-config');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize logger
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log')
    })
  ]
});

// Initialize express app
const app = express();

// Trust proxy - needed for Render and other cloud platforms
app.set('trust proxy', 1);

// Connect to database
connectDB();

// Body parser
app.use(express.json({ limit: '10kb' }));

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for now if it causes issues with external scripts
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Data sanitization against XSS
app.use(xss());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Enhanced CORS for GitHub Pages integration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://dndbrand.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

// Add OPTIONS pre-flight handler
app.options('*', cors());

// Compression for faster response times
app.use(compression());

// Log all requests in production
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Add health check endpoint near the top of your routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Mount API routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Fallback route for API not found
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

// For non-API routes, return a JSON response redirecting to the frontend
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'This endpoint is not available on the API server. Please use the main website at https://dndbrand.com'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Get port from environment or use defaults
const HTTP_PORT = process.env.PORT || 8080;

// Create HTTP server
const httpServer = http.createServer(app);

// Start the server
httpServer.listen(HTTP_PORT, () => {
  console.log(`API server running on port ${HTTP_PORT}`);
  logger.info(`Server running at http://localhost:${HTTP_PORT}`);
  logger.info(`API available at http://localhost:${HTTP_PORT}/api/`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  
  // Close server & exit process
  httpServer.close(() => {
    process.exit(1);
  });
}); 
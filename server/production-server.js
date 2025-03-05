/**
 * DnD Brand Production Server
 * Configured for HTTPS and optimized for production use
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
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const addressRoutes = require('./routes/addressRoutes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Body parser
app.use(express.json({ limit: '10kb' }));

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://api.iyzipay.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "https://api.iyzipay.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["https://api.iyzipay.com"]
      }
    },
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

// Enable CORS - Configure for your specific domains
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://dndbrand.com', 'https://www.dndbrand.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Compression for faster response times
app.use(compression());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);

// Serve frontend for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/index.html'));
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

// Determine if we should use HTTPS directly or rely on Cloudflare
const useDirectHttps = process.env.USE_DIRECT_HTTPS === 'true' && 
                       process.env.SSL_KEY_PATH && 
                       process.env.SSL_CERT_PATH &&
                       fs.existsSync(process.env.SSL_KEY_PATH) && 
                       fs.existsSync(process.env.SSL_CERT_PATH);

// Get ports from environment or use defaults
const HTTP_PORT = process.env.HTTP_PORT || 80;
const HTTPS_PORT = process.env.PORT || 443;

// Create HTTP server - always needed for redirects or as main server
const httpServer = http.createServer((req, res) => {
  // If we're using direct HTTPS, redirect HTTP to HTTPS
  if (useDirectHttps) {
    const host = req.headers.host?.split(':')[0] || 'localhost';
    res.writeHead(301, { Location: `https://${host}${req.url}` });
    res.end();
  } else {
    // Otherwise, let the Express app handle it (for Cloudflare setup)
    app(req, res);
  }
});

// Start the servers
httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_PORT}`);
});

// If we have SSL certificates, also start HTTPS server
if (useDirectHttps) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH)
    };
    
    const httpsServer = https.createServer(httpsOptions, app);
    
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`HTTPS server running on port ${HTTPS_PORT}`);
    });
    
    console.log('Server running with direct HTTPS support');
  } catch (error) {
    console.error('Failed to start HTTPS server:', error.message);
    console.log('Falling back to HTTP only');
  }
} else {
  console.log('Running without direct HTTPS - ensure you are using Cloudflare or another SSL provider');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  
  // Close server & exit process
  httpServer.close(() => {
    process.exit(1);
  });
}); 
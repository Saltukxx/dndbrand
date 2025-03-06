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
// Only import routes that actually exist
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

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

// Enable CORS - TEMPORARILY ALLOWING ALL ORIGINS
const corsOptions = {
  origin: '*', // Allow all origins temporarily
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Add OPTIONS pre-flight handler
app.options('*', cors(corsOptions));

// Add additional CORS headers middleware for extra compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Compression for faster response times
app.use(compression());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Mount routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Redirect root to GitHub Pages
app.get('/', (req, res) => {
  res.redirect('https://saltukxx.github.io/dndbrand/');
});

// Handle HTML page requests
app.get('/*.html', (req, res) => {
  // Extract the HTML file name from the URL
  const htmlFile = req.path.substring(1); // Remove the leading slash
  const htmlPath = path.join(__dirname, '../public', htmlFile);
  
  // Check if the file exists
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    // If HTML file doesn't exist, send 404 page or redirect to home
    res.status(404).sendFile(path.join(__dirname, '../public/html/404.html'));
  }
});

// Serve frontend for any other route (fallback)
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/html/404.html'));
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
const HTTP_PORT = process.env.PORT || process.env.HTTP_PORT || 80;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

// Create HTTP server - always needed for redirects or as main server
let httpServer;

if (useDirectHttps) {
  // If using direct HTTPS, create a redirect server
  httpServer = http.createServer((req, res) => {
    const host = req.headers.host?.split(':')[0] || 'localhost';
    res.writeHead(301, { Location: `https://${host}${req.url}` });
    res.end();
  });
} else {
  // Otherwise, use Express app directly
  httpServer = http.createServer(app);
}

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
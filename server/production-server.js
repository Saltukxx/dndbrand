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

// URL rewriting middleware - added for clean URLs
app.use((req, res, next) => {
  // Log incoming requests
  logger.info(`[URL Rewriter] Original URL: ${req.url}`);
  
  // Clean URLs mapping to HTML files
  const urlMap = {
    '/': '/html/index.html',
    '/shop': '/html/shop.html',
    '/about': '/html/about.html',
    '/contact': '/html/contact.html',
    '/cart': '/html/cart.html',
    '/checkout': '/html/checkout.html',
    '/account': '/html/account.html',
    '/search': '/html/search.html',
    '/collections': '/html/collections.html',
    '/shipping': '/html/shipping.html',
    '/returns': '/html/returns.html',
    '/faq': '/html/faq.html',
    '/sustainability': '/html/sustainability.html',
    '/careers': '/html/careers.html',
    '/privacy': '/html/privacy.html',
    '/product': '/html/product.html'
  };
  
  // Check if the URL matches any of our clean URLs
  if (urlMap[req.url]) {
    logger.info(`[URL Rewriter] Rewriting ${req.url} to ${urlMap[req.url]}`);
    req.url = urlMap[req.url];
  }
  
  next();
});

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

// Apply CORS middleware
app.use(corsMiddleware);

// Add OPTIONS pre-flight handler
app.options('*', corsMiddleware);

// Compression for faster response times
app.use(compression());

// Log all requests in production
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Add special debug handler for the shop page since it's not working
app.get('/shop', (req, res) => {
  logger.info(`Shop route handler called for ${req.url}`);
  const filePath = path.join(__dirname, '../public', 'html', 'shop.html');
  
  // Check if the file exists and log the result
  const fileExists = fs.existsSync(filePath);
  logger.info(`Shop file path: ${filePath}`);
  logger.info(`Shop file exists: ${fileExists}`);
  
  if (fileExists) {
    logger.info(`Serving shop.html from ${filePath}`);
    res.sendFile(filePath);
  } else {
    // Try to list the directory contents to debug
    try {
      const htmlDir = path.join(__dirname, '../public', 'html');
      const files = fs.readdirSync(htmlDir);
      logger.info(`Files in ${htmlDir}: ${files.join(', ')}`);
    } catch (err) {
      logger.error(`Error reading html directory: ${err.message}`);
    }
    
    logger.error(`Shop file not found: ${filePath}`);
    res.status(404).sendFile(path.join(__dirname, '../public', 'html', '404.html'));
  }
});

// Add route for trailing slash versions of all paths
app.get('/shop/', (req, res) => {
  logger.info('Shop route with trailing slash called, redirecting to /shop');
  res.redirect(301, '/shop');
});

// Handle trailing slashes for all routes
app.use((req, res, next) => {
  if (req.path.slice(-1) === '/' && req.path.length > 1) {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    const query = req.url.slice(req.path.length);
    const safePath = req.path.slice(0, -1).replace(/\/+/g, '/');
    res.redirect(301, safePath + query);
  } else {
    next();
  }
});

// Define routes for clean URLs BEFORE the static file middleware and other routes
const routes = [
  { path: '/', file: 'index.html' },
  { path: '/about', file: 'about.html' },
  { path: '/contact', file: 'contact.html' },
  { path: '/cart', file: 'cart.html' },
  { path: '/checkout', file: 'checkout.html' },
  { path: '/account', file: 'account.html' },
  { path: '/search', file: 'search.html' },
  { path: '/collections', file: 'collections.html' },
  { path: '/shipping', file: 'shipping.html' },
  { path: '/returns', file: 'returns.html' },
  { path: '/faq', file: 'faq.html' },
  { path: '/sustainability', file: 'sustainability.html' },
  { path: '/careers', file: 'careers.html' },
  { path: '/privacy', file: 'privacy.html' },
  { path: '/product', file: 'product.html' }
];

// Add routes for each path
routes.forEach(({ path: routePath, file }) => {
  app.get(routePath, (req, res) => {
    const filePath = path.join(__dirname, '../public', 'html', file);
    logger.info(`Serving ${filePath} for route ${routePath}`);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      logger.error(`File not found: ${filePath}`);
      res.status(404).sendFile(path.join(__dirname, '../public', 'html', '404.html'));
    }
  });
});

// Serve static files AFTER defining routes
app.use(express.static(path.join(__dirname, '../public')));

// Mount routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);

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

// Catch-all route for other HTML files in public/html
app.get('/:page', (req, res, next) => {
  // Skip if it starts with /api/ or includes a file extension
  if (req.params.page.startsWith('api') || req.params.page.includes('.')) {
    return next();
  }
  
  const page = req.params.page;
  const filePath = path.join(__dirname, '../public', 'html', `${page}.html`);
  logger.info(`Checking for page: ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next(); // Pass to the next handler if file doesn't exist
  }
});

// 404 handler - must be last
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404).sendFile(path.join(__dirname, '../public', 'html', '404.html'));
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

// Run file system check on startup
try {
  require('./check-file-access');
  console.log('File access check completed');
} catch (err) {
  console.error('File access check failed:', err.message);
  // Don't exit, still try to start the server
}

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
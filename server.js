const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize logger (simplified version for frontend server)
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

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Add debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[DEBUG] Request path: ${req.path}`);
  console.log(`[DEBUG] Request method: ${req.method}`);
  console.log(`[DEBUG] Request headers: ${JSON.stringify(req.headers)}`);
  console.log(`[DEBUG] Original URL: ${req.originalUrl}`);
  next();
});

// Create a dedicated route for placeholder images
app.get('/api/images/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  const placeholderPath = path.join(__dirname, 'public', 'images', imageName);
  
  // Check if the requested placeholder exists
  if (fs.existsSync(placeholderPath)) {
    res.sendFile(placeholderPath);
    logger.info(`Served local image: ${imageName}`);
  } else {
    // Default to placeholder-product.jpg if the specific one doesn't exist
    const defaultPath = path.join(__dirname, 'public', 'images', 'placeholder-product.jpg');
    if (fs.existsSync(defaultPath)) {
      res.sendFile(defaultPath);
      logger.info(`Served default placeholder for: ${imageName}`);
    } else {
      res.status(404).send('Image not found');
      logger.error(`Image not found: ${imageName}`);
    }
  }
});

// Define routes for clean URLs BEFORE the catch-all route
app.get('/', (req, res) => {
  console.log('[DEBUG] Root route handler called');
  const absolutePath = path.resolve(__dirname, 'public', 'html', 'index.html');
  console.log(`[DEBUG] Absolute path for index.html: ${absolutePath}`);
  console.log(`[DEBUG] File exists: ${fs.existsSync(absolutePath)}`);
  res.sendFile(absolutePath);
});

app.get('/shop', (req, res) => {
  console.log('[DEBUG] Shop route handler called');
  const absolutePath = path.resolve(__dirname, 'public', 'html', 'shop.html');
  console.log(`[DEBUG] Absolute path for shop.html: ${absolutePath}`);
  console.log(`[DEBUG] File exists: ${fs.existsSync(absolutePath)}`);
  res.sendFile(absolutePath);
});

app.get('/about', (req, res) => {
  const absolutePath = path.resolve(__dirname, 'public', 'html', 'about.html');
  console.log(`[DEBUG] Absolute path for about.html: ${absolutePath}`);
  console.log(`[DEBUG] File exists: ${fs.existsSync(absolutePath)}`);
  res.sendFile(absolutePath);
});

app.get('/contact', (req, res) => {
  const absolutePath = path.resolve(__dirname, 'public', 'html', 'contact.html');
  console.log(`[DEBUG] Absolute path for contact.html: ${absolutePath}`);
  console.log(`[DEBUG] File exists: ${fs.existsSync(absolutePath)}`);
  res.sendFile(absolutePath);
});

app.get('/cart', (req, res) => {
  const absolutePath = path.resolve(__dirname, 'public', 'html', 'cart.html');
  console.log(`[DEBUG] Absolute path for cart.html: ${absolutePath}`);
  console.log(`[DEBUG] File exists: ${fs.existsSync(absolutePath)}`);
  res.sendFile(absolutePath);
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'checkout.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'account.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'search.html'));
});

app.get('/collections', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'collections.html'));
});

app.get('/shipping', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'shipping.html'));
});

app.get('/returns', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'returns.html'));
});

app.get('/faq', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'faq.html'));
});

app.get('/sustainability', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'sustainability.html'));
});

app.get('/careers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'careers.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'privacy.html'));
});

app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'html', 'product.html'));
});

// CORS Proxy middleware for API requests
app.use('/api-proxy', async (req, res) => {
  try {
    const targetUrl = req.url.slice(1); // Remove the leading slash
    
    if (!targetUrl.startsWith('https://dndbrand-server.onrender.com/api/')) {
      logger.error(`Unauthorized proxy attempt to ${targetUrl}`);
      return res.status(403).json({
        error: 'Unauthorized proxy target', 
        message: 'Only proxying to dndbrand-server.onrender.com is allowed'
      });
    }
    
    logger.info(`Proxying request to: ${targetUrl}`);
    
    // Get the origin from the request headers
    const origin = req.headers.origin || '*';
    
    // Choose http or https module based on URL
    const httpModule = targetUrl.startsWith('https') ? https : http;
    
    // Set a timeout for the proxy request
    const proxyRequestTimeout = 30000; // 30 seconds
    
    // Create an AbortController for the timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      logger.error(`Proxy request to ${targetUrl} timed out after ${proxyRequestTimeout}ms`);
    }, proxyRequestTimeout);
    
    // Forward the request - copy over all original headers
    const proxyReq = httpModule.request(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...req.headers,
          'User-Agent': 'DnDBrand-LocalServer',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': origin,
          'Referer': origin + '/'
        },
      },
      (proxyRes) => {
        // Clear the timeout since we received a response
        clearTimeout(timeoutId);
        
        // Set headers
        res.statusCode = proxyRes.statusCode;
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
        
        // Log the response status
        logger.info(`Proxy response: ${proxyRes.statusCode} for ${targetUrl}`);
        
        // Pipe the response data
        proxyRes.pipe(res);
      }
    );
    
    // Handle request body if present
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      // Handle the request body stream
      req.pipe(proxyReq);
    } else {
      // End the request for methods without body
      proxyReq.end();
    }
    
    // Handle errors
    proxyReq.on('error', (error) => {
      // Clear the timeout if there's an error
      clearTimeout(timeoutId);
      
      logger.error(`Proxy request error for ${targetUrl}: ${error.message}`);
      
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Proxy Error',
          message: `Proxy request failed: ${error.message}`
        });
      }
    });
    
  } catch (error) {
    logger.error(`CORS Proxy error: ${error.message}`);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: `CORS Proxy error: ${error.message}`
      });
    }
  }
});

// Add OPTIONS pre-flight handler for the proxy
app.options('/api-proxy/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// Handle HTML page requests directly - note this comes before the catch-all
app.get('/*.html', (req, res) => {
  console.log('[DEBUG] HTML handler called for:', req.path);
  // Extract the HTML file name from the URL
  const htmlFile = req.path.substring(1); // Remove the leading slash
  const htmlPath = path.join(__dirname, htmlFile);
  
  console.log(`[DEBUG] Looking for HTML file at: ${htmlPath}`);
  console.log(`[DEBUG] File exists: ${fs.existsSync(htmlPath)}`);
  
  // Check if the file exists
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    // If HTML file doesn't exist, try in the public/html directory
    const publicHtmlPath = path.join(__dirname, 'public', 'html', path.basename(htmlFile));
    console.log(`[DEBUG] Looking for HTML file in public/html: ${publicHtmlPath}`);
    console.log(`[DEBUG] File exists: ${fs.existsSync(publicHtmlPath)}`);
    
    if (fs.existsSync(publicHtmlPath)) {
      res.sendFile(publicHtmlPath);
    } else {
      console.log('[DEBUG] Sending 404 page');
      res.status(404).sendFile(path.join(__dirname, 'public', 'html', '404.html'));
    }
  }
});

// Catch-all route for clean URLs like /shop, /about, etc.
app.get('/*', (req, res, next) => {
  console.log('[DEBUG] Catch-all handler called for:', req.path);
  
  // Skip API and static file requests
  if (req.path.startsWith('/api') || 
      req.path.includes('.') || 
      req.path === '/') {
    return next();
  }
  
  // Extract the page name from the URL (remove leading slash)
  const pageName = req.path.substring(1);
  const htmlPath = path.join(__dirname, 'public', 'html', `${pageName}.html`);
  
  console.log(`[DEBUG] Looking for HTML file for clean URL: ${htmlPath}`);
  console.log(`[DEBUG] File exists: ${fs.existsSync(htmlPath)}`);
  
  // Check if corresponding HTML file exists
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    console.log('[DEBUG] Sending 404 page for clean URL');
    res.status(404).sendFile(path.join(__dirname, 'public', 'html', '404.html'));
  }
});

// Fallback 404 handler for any other routes
app.use((req, res) => {
  console.log('[DEBUG] Fallback 404 handler called for:', req.path);
  res.status(404).sendFile(path.join(__dirname, 'public', 'html', '404.html'));
});

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
  logger.info(`Open http://localhost:${port}/ in your browser`);
  logger.info(`API proxy available at http://localhost:${port}/api-proxy/`);
}); 
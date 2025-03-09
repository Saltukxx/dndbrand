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

// Handle all routes by sending the index.html file
app.get('*', (req, res) => {
  // If the request is for a specific file extension, don't redirect
  if (path.extname(req.path)) {
    return res.status(404).send('File not found');
  }
  
  // For clean URLs, redirect to the corresponding HTML file
  const htmlFile = req.path === '/' ? '/html/index.html' : `/html${req.path}.html`;
  res.sendFile(path.join(__dirname, 'public', htmlFile));
});

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
  logger.info(`Open http://localhost:${port}/html/index.html in your browser`);
  logger.info(`API proxy available at http://localhost:${port}/api-proxy/`);
}); 
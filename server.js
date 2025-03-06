const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// CORS Proxy middleware for API requests
app.use('/api-proxy', async (req, res) => {
  try {
    const targetUrl = req.url.slice(1); // Remove the leading slash
    
    if (!targetUrl.startsWith('https://dndbrand-server.onrender.com/api/')) {
      return res.status(403).send('Only proxying to dndbrand-server.onrender.com is allowed');
    }
    
    console.log(`Proxying request to: ${targetUrl}`);
    
    // Get the origin from the request headers
    const origin = req.headers.origin || '*';
    
    // Choose http or https module based on URL
    const httpModule = targetUrl.startsWith('https') ? https : http;
    
    // Forward the request
    const proxyReq = httpModule.request(
      targetUrl,
      {
        method: req.method,
        headers: {
          'User-Agent': 'DnDBrand-LocalServer',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': origin,
          'Referer': origin + '/'
        },
      },
      (proxyRes) => {
        // Set headers
        res.statusCode = proxyRes.statusCode;
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        // Pipe the response data
        proxyRes.pipe(res);
      }
    );
    
    // Handle errors
    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.status(500).send('Proxy request failed');
    });
    
    // End the request
    proxyReq.end();
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error');
  }
});

// Add OPTIONS pre-flight handler for the proxy
app.options('/api-proxy/*', (req, res) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
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
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Open http://localhost:${port}/html/index.html in your browser`);
  console.log(`API proxy available at http://localhost:${port}/api-proxy/`);
}); 
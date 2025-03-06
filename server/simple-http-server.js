const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
  
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
  
  // Parse the URL to get the path without query parameters
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const cleanPath = parsedUrl.pathname;
  
  if (urlMap[cleanPath]) {
    // Serve the mapped file from the project root
    const filePath = path.join(__dirname, '..', urlMap[cleanPath]);
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading file: ${err.message}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  } else if (req.url === '/test') {
    // Serve the direct-test.html file
    const filePath = path.join(__dirname, 'direct-test.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading file: ${err.message}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  } else if (req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'API is working!' }));
  } else {
    // Try to serve the file directly from the project root
    const filePath = path.join(__dirname, '..', req.url);
    fs.readFile(filePath, (err, content) => {
      if (err) {
        // If file not found, serve the 404 page
        const notFoundPath = path.join(__dirname, '..', '404.html');
        fs.readFile(notFoundPath, (err, content) => {
          if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content);
        });
        return;
      }
      
      // Determine content type based on file extension
      const ext = path.extname(filePath);
      let contentType = 'text/html';
      
      switch (ext) {
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  }
});

// Try multiple ports
const ports = [3000, 8080, 8000];
let currentPortIndex = 0;

function tryPort(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`Test page available at http://localhost:${port}/test`);
    console.log(`API test endpoint at http://localhost:${port}/api/test`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use.`);
      tryNextPort();
    } else {
      console.error('Server error:', err.message);
    }
  });
}

function tryNextPort() {
  currentPortIndex++;
  if (currentPortIndex < ports.length) {
    tryPort(ports[currentPortIndex]);
  } else {
    console.error('All ports are in use. Please free up one of these ports:', ports.join(', '));
    process.exit(1);
  }
}

console.log('Starting simple HTTP server...');
tryPort(ports[currentPortIndex]); 
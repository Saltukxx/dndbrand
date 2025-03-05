const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
  
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body><h1>Simple HTTP Server</h1><p>Server is running!</p></body></html>');
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
    res.writeHead(404);
    res.end('Not Found');
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
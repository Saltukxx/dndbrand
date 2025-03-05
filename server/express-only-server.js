const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize Express app
console.log('Initializing Express app...');
const app = express();
console.log('Express app initialized');

// Apply middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the server directory

// API routes
app.get('/', (req, res) => {
  console.log('Request received at root endpoint from:', req.ip);
  res.send('Express-only server is running!');
});

app.get('/api/test', (req, res) => {
  console.log('Request received at test endpoint from:', req.ip);
  res.json({ message: 'API is working!' });
});

// HTML test page route
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'direct-test.html'));
});

// Try multiple ports
const ports = [3000, 8080, 8000];
let currentPortIndex = 0;

function tryPort(port) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log(`Server bound to all interfaces (0.0.0.0)`);
    console.log(`Access the API at http://localhost:${port}/`);
    console.log(`Access the test page at http://localhost:${port}/test`);
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

console.log('Starting Express-only server...');
tryPort(ports[currentPortIndex]); 
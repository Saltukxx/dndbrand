const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const os = require('os');
const { exec } = require('child_process');

// Load environment variables
console.log('=== SERVER DIAGNOSTICS ===');
console.log('Loading environment variables...');
dotenv.config({ path: path.join(__dirname, './config/.env') });
console.log('Environment variables loaded. PORT:', process.env.PORT);

// System information
console.log('\n=== SYSTEM INFORMATION ===');
console.log('OS:', os.platform(), os.release());
console.log('Node.js version:', process.version);
console.log('Hostname:', os.hostname());
console.log('Network interfaces:');
const networkInterfaces = os.networkInterfaces();
Object.keys(networkInterfaces).forEach(interfaceName => {
  const interfaces = networkInterfaces[interfaceName];
  interfaces.forEach(iface => {
    if (iface.family === 'IPv4') {
      console.log(`  ${interfaceName}: ${iface.address}`);
    }
  });
});

// Check if port is in use
const checkPort = (port) => {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
      if (stdout) {
        console.log(`\nWARNING: Port ${port} might already be in use!`);
        console.log(stdout);
        resolve(true);
      } else {
        console.log(`\nPort ${port} is available`);
        resolve(false);
      }
    });
  });
};

// Initialize Express app
console.log('\n=== EXPRESS SERVER SETUP ===');
console.log('Initializing Express app...');
const app = express();
console.log('Express app initialized');

// Basic middleware
app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  console.log('Request received at root endpoint from:', req.ip);
  res.send('Diagnostic server is running!');
});

app.get('/api/test', async (req, res) => {
  console.log('Request received at test endpoint from:', req.ip);
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      res.json({
        status: 'success',
        message: 'Database connection is working',
        collections: collections.map(c => c.name)
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Database connection is not established',
        readyState: mongoose.connection.readyState
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
console.log('\n=== DATABASE CONNECTION ===');
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'URI exists (not shown for security)' : 'URI is missing');

const startServer = async () => {
  try {
    // Check if port is in use
    const portInUse = await checkPort(PORT);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected Successfully');
    
    // Get database information
    const dbName = mongoose.connection.db.databaseName;
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Connected to database: ${dbName}`);
    console.log(`Collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n=== SERVER STARTED ===`);
      console.log(`Server running on port ${PORT}`);
      console.log(`Server bound to all interfaces (0.0.0.0)`);
      
      // Get all available IP addresses
      console.log('\n=== ACCESS INFORMATION ===');
      console.log('You can access the server at:');
      console.log(`  http://localhost:${PORT}/`);
      console.log(`  http://127.0.0.1:${PORT}/`);
      
      Object.keys(networkInterfaces).forEach(interfaceName => {
        const interfaces = networkInterfaces[interfaceName];
        interfaces.forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`  http://${iface.address}:${PORT}/`);
          }
        });
      });
      
      // Test self-connection
      console.log('\n=== TESTING SERVER CONNECTION ===');
      console.log('Making a request to the server...');
      
      setTimeout(() => {
        // Test localhost
        testConnection('localhost', PORT, () => {
          // Test 127.0.0.1
          testConnection('127.0.0.1', PORT);
        });
      }, 1000);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('\n=== SERVER ERROR ===');
      console.error('Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
        console.error('You can change the port in the .env file or by setting the PORT environment variable.');
      }
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n=== SHUTTING DOWN ===');
      console.log('Shutting down server gracefully...');
      server.close(() => {
        console.log('Server closed');
        mongoose.disconnect().then(() => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  } catch (err) {
    console.error('\n=== STARTUP ERROR ===');
    console.error('Error starting server:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
};

function testConnection(host, port, callback) {
  console.log(`Testing connection to http://${host}:${port}/...`);
  
  http.get(`http://${host}:${port}/`, (res) => {
    console.log(`Connection to ${host}:${port} successful!`);
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Response: ${data}`);
      if (callback) callback();
    });
  }).on('error', (err) => {
    console.error(`Connection to ${host}:${port} failed:`, err.message);
    console.log('This could be due to:');
    console.log('1. A firewall blocking the connection');
    console.log('2. The server not binding correctly to the interface');
    console.log('3. Another process using the same port');
    
    if (callback) callback();
  });
}

// Start the server
startServer(); 
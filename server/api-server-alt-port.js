const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables
console.log('Loading environment variables...');
dotenv.config({ path: path.join(__dirname, './config/.env') });
console.log('Environment variables loaded.');

// Use a different port
const PORT = 3000;
console.log('Using alternative port:', PORT);

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
  res.send('API server is running!');
});

app.get('/api/products', async (req, res) => {
  console.log('Request received at products endpoint from:', req.ip);
  try {
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers', async (req, res) => {
  console.log('Request received at customers endpoint from:', req.ip);
  try {
    const customers = await mongoose.connection.db.collection('customers').find({}).toArray();
    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  console.log('Request received at users endpoint from:', req.ip);
  try {
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// HTML test page route
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-page-alt.html'));
});

// Connect to MongoDB and start server
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'URI exists (not shown for security)' : 'URI is missing');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    
    // Start server after successful database connection
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server bound to all interfaces (0.0.0.0)`);
      console.log(`Access the API at http://localhost:${PORT}/`);
      console.log(`Access the test page at http://localhost:${PORT}/test`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
  }); 
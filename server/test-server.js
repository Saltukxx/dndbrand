const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/database');

// Load environment variables
dotenv.config({ path: './config/.env' });

// Initialize express app
const app = express();

// Basic middleware
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Simple products route
app.get('/api/products', async (req, res) => {
  try {
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple customers route
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await mongoose.connection.db.collection('customers').find({}).toArray();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      console.log(`Try accessing: http://localhost:${PORT}/api/test`);
      console.log(`Try accessing: http://localhost:${PORT}/api/products`);
      console.log(`Try accessing: http://localhost:${PORT}/api/customers`);
    });
  } catch (error) {
    console.error('Failed to start test server:', error.message);
  }
};

startServer(); 
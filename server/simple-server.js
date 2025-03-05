const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, './config/.env') });

// Initialize express app
const app = express();
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Products route
app.get('/api/products', async (req, res) => {
  try {
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    
    // Start server after successful database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Try accessing: http://localhost:${PORT}/`);
      console.log(`Try accessing: http://localhost:${PORT}/api/products`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  }); 
// Debug version of server.js with additional logging
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Load environment variables
console.log('Loading environment variables...');
dotenv.config({ path: path.join(__dirname, './config/.env') });
console.log('Environment variables loaded. PORT:', process.env.PORT);

// Initialize Express app
console.log('Initializing Express app...');
const app = express();
console.log('Express app initialized');

// Apply security middleware
console.log('Applying security middleware...');
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
console.log('Setting up rate limiting...');
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api', limiter);
console.log('Rate limiting configured');

// Simple test route
app.get('/', (req, res) => {
  console.log('Request received at root endpoint');
  res.send('Server is running!');
});

// Products route
app.get('/api/products', async (req, res) => {
  console.log('Request received at products endpoint');
  try {
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'URI exists (not shown for security)' : 'URI is missing');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    
    // Start server after successful database connection
    // Explicitly bind to all interfaces (0.0.0.0)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server bound to all interfaces (0.0.0.0)`);
      console.log(`Access the server at http://localhost:${PORT}/`);
      console.log(`Access the products API at http://localhost:${PORT}/api/products`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
      }
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Shutting down server gracefully...');
      server.close(() => {
        console.log('Server closed');
        mongoose.disconnect().then(() => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
  }); 
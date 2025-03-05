const http = require('http');
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
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Make a request to our own server
      setTimeout(() => {
        console.log('Making a request to the server...');
        
        // Request to root endpoint
        http.get(`http://localhost:${PORT}/`, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log('Response from root endpoint:', data);
            
            // Request to products endpoint
            http.get(`http://localhost:${PORT}/api/products`, (res) => {
              let data = '';
              
              res.on('data', (chunk) => {
                data += chunk;
              });
              
              res.on('end', () => {
                console.log('Response from products endpoint (first product):');
                try {
                  const products = JSON.parse(data);
                  if (products.length > 0) {
                    console.log(products[0]);
                  } else {
                    console.log('No products found');
                  }
                } catch (e) {
                  console.log('Error parsing JSON:', e.message);
                  console.log('Raw data:', data);
                }
                
                // Close the server and database connection
                console.log('Tests completed, shutting down server...');
                server.close(() => {
                  mongoose.disconnect();
                  console.log('Server and database connection closed');
                });
              });
            });
          });
        });
      }, 1000); // Wait 1 second before making the request
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  }); 
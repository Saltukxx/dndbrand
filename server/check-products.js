const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
console.log('Loading environment variables...');
dotenv.config({ path: path.join(__dirname, './config/.env') });
console.log('Environment variables loaded.');

// Connect to MongoDB and check products
console.log('Connecting to MongoDB...');
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all products
      const products = await mongoose.connection.db.collection('products').find({}).toArray();
      console.log(`Found ${products.length} products in the database`);
      
      if (products.length > 0) {
        console.log('\nMost recent products:');
        // Show the last 5 products (or all if less than 5)
        const recentProducts = products.slice(-5);
        recentProducts.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} (SKU: ${product.sku})`);
          console.log(`   Price: ${product.price}, Category: ${product.category}`);
          console.log(`   Created: ${product.createdAt || 'N/A'}`);
          console.log('-----------------------------------');
        });
      } else {
        console.log('No products found in the database');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      // Close the connection
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  }); 
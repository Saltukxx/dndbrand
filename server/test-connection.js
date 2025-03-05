const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, './config/.env') });

console.log('Attempting to connect to MongoDB...');
console.log(`Connection string: ${process.env.MONGO_URI.replace(/:[^:]*@/, ':****@')}`);
console.log('If connection fails, make sure your IP address is whitelisted in MongoDB Atlas.');
console.log('Go to MongoDB Atlas > Network Access > Add IP Address > Add Current IP Address');

mongoose
  .connect(process.env.MONGO_URI, {
    // Explicitly set these options for clarity
    ssl: true,
    tlsAllowInvalidCertificates: false,
    authSource: 'admin',
    retryWrites: true,
    w: 'majority'
  })
  .then(async () => {
    console.log('Successfully connected to MongoDB Atlas!');
    
    // Test database operations
    try {
      // Get database connection
      const db = mongoose.connection.db;
      
      // List all collections
      const collections = await db.listCollections().toArray();
      console.log('\nCollections in database:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
      
      // Count documents in each collection
      console.log('\nDocument counts:');
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`- ${collection.name}: ${count} documents`);
      }
      
      console.log('\nDatabase connection and operations test completed successfully!');
    } catch (error) {
      console.error('Error performing database operations:', error.message);
    } finally {
      // Close the connection
      await mongoose.disconnect();
      console.log('Database connection closed');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('Connection error:', err.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.log('2. Verify your connection string is correct');
    console.log('3. Make sure your MongoDB Atlas cluster is running');
    console.log('4. Check if your database user has the correct permissions');
    process.exit(1);
  }); 
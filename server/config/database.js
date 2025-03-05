const mongoose = require('mongoose');

/**
 * Configure MongoDB connection with security best practices
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer needed in Mongoose 6+, but kept for reference
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
      
      // Security settings
      authSource: 'admin', // Use admin database for authentication
      ssl: process.env.NODE_ENV === 'production', // Use SSL in production
      sslValidate: process.env.NODE_ENV === 'production', // Validate SSL certificates in production
      
      // Connection pool settings
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections in the pool
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully close the MongoDB connection
 */
const closeDBConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
    process.exit(1);
  }
};

// Handle application termination
process.on('SIGINT', async () => {
  await closeDBConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDBConnection();
  process.exit(0);
});

module.exports = { connectDB, closeDBConnection }; 
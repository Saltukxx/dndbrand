/**
 * MongoDB Setup Script for DnD Brand E-commerce
 * This script initializes the database with necessary collections and indexes
 */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

// Load environment variables
const envFile = path.join(__dirname, '../config/.env');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  logger.info('Loaded environment variables from .env');
} else {
  dotenv.config();
  logger.info('Using system environment variables');
}

// Create an array of model paths
const modelPaths = [
  path.join(__dirname, '../models/Product.js'),
  path.join(__dirname, '../models/Order.js'),
  path.join(__dirname, '../models/Customer.js'),
  path.join(__dirname, '../models/User.js')
];

// Initialize indexes for all models
async function createIndexes() {
  logger.info('Creating indexes for all models...');
  
  try {
    // Import all models to trigger index creation
    for (const modelPath of modelPaths) {
      if (fs.existsSync(modelPath)) {
        // This will run the model code which includes index creation
        require(modelPath);
        logger.info(`Loaded model: ${path.basename(modelPath)}`);
      } else {
        logger.warn(`Model file not found: ${modelPath}`);
      }
    }
    
    // Get all created indexes
    const collections = mongoose.connection.collections;
    for (const collectionName in collections) {
      const indexes = await collections[collectionName].indexes();
      logger.info(`Indexes for ${collectionName}:`, indexes);
    }
    
    logger.info('All indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
}

// Create GridFS buckets
async function setupGridFS() {
  logger.info('Setting up GridFS buckets...');
  
  try {
    // Create uploads bucket if it doesn't exist
    const bucketExists = await mongoose.connection.db.listCollections({ name: 'uploads.files' }).hasNext();
    
    if (!bucketExists) {
      logger.info('Creating GridFS bucket: uploads');
      
      // This will create the bucket if it doesn't exist
      new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });
      
      logger.info('GridFS bucket created: uploads');
    } else {
      logger.info('GridFS bucket already exists: uploads');
    }
  } catch (error) {
    logger.error('Error setting up GridFS:', error);
    throw error;
  }
}

// Main setup function
async function setupDatabase() {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('Connected to MongoDB successfully');
    
    // Create indexes
    await createIndexes();
    
    // Setup GridFS
    await setupGridFS();
    
    logger.info('Database setup completed successfully');
    
    // Close the connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
    return { success: true };
  } catch (error) {
    logger.error('Database setup failed:', error);
    
    // Attempt to close connection if it's open
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('Database connection closed after error');
    }
    
    return { success: false, error };
  }
}

// Run the script if called directly
if (require.main === module) {
  setupDatabase()
    .then(result => {
      if (result.success) {
        logger.info('Setup completed successfully');
        process.exit(0);
      } else {
        logger.error('Setup failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unhandled error during setup:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase; 
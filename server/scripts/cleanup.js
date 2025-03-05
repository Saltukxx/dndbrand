/**
 * Database Cleanup Script for DnD Brand
 * 
 * This script performs maintenance tasks on the database:
 * - Removes abandoned carts older than specified days
 * - Cleans up expired sessions
 * - Archives old orders (optional)
 * - Removes temporary data
 * 
 * Usage: node cleanup.js [--archive-orders] [--days=30]
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// Load models
const Cart = require('../models/Cart');
const Session = require('../models/Session');
const Order = require('../models/Order');
const TempData = require('../models/TempData');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const shouldArchiveOrders = args.includes('--archive-orders');
const daysArg = args.find(arg => arg.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 30;

if (isNaN(days) || days <= 0) {
  console.error('Invalid days parameter. Please provide a positive number.');
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for cleanup'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Calculate the cutoff date
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - days);

// Cleanup function
const cleanupDatabase = async () => {
  try {
    console.log(`Starting database cleanup (cutoff: ${days} days)`);
    
    // 1. Remove abandoned carts
    const cartsResult = await Cart.deleteMany({
      updatedAt: { $lt: cutoffDate },
      status: 'abandoned'
    });
    console.log(`Removed ${cartsResult.deletedCount} abandoned carts`);
    
    // 2. Clean up expired sessions
    const sessionsResult = await Session.deleteMany({
      expires: { $lt: new Date() }
    });
    console.log(`Removed ${sessionsResult.deletedCount} expired sessions`);
    
    // 3. Archive old orders if requested
    if (shouldArchiveOrders) {
      const oldOrders = await Order.find({
        createdAt: { $lt: cutoffDate },
        orderStatus: { $in: ['delivered', 'cancelled', 'refunded'] }
      });
      
      if (oldOrders.length > 0) {
        // Create archives directory if it doesn't exist
        const archivesDir = path.join(__dirname, '../archives');
        if (!fs.existsSync(archivesDir)) {
          fs.mkdirSync(archivesDir, { recursive: true });
        }
        
        // Archive orders to JSON file
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const archivePath = path.join(archivesDir, `orders-archive-${timestamp}.json`);
        await writeFileAsync(archivePath, JSON.stringify(oldOrders, null, 2));
        
        // Remove archived orders from database
        const archiveResult = await Order.deleteMany({
          createdAt: { $lt: cutoffDate },
          orderStatus: { $in: ['delivered', 'cancelled', 'refunded'] }
        });
        
        console.log(`Archived ${oldOrders.length} orders to ${archivePath}`);
        console.log(`Removed ${archiveResult.deletedCount} archived orders from database`);
      } else {
        console.log('No orders to archive');
      }
    }
    
    // 4. Remove temporary data
    const tempDataResult = await TempData.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Removed ${tempDataResult.deletedCount} temporary data records`);
    
    console.log('Database cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error during database cleanup: ${error.message}`);
    process.exit(1);
  }
};

// Run the cleanup
cleanupDatabase(); 
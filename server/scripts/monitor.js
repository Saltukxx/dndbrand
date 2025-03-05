/**
 * Database Monitoring Script for DnD Brand
 * 
 * This script monitors the database health and performance:
 * - Checks database connection
 * - Reports collection statistics
 * - Monitors index usage
 * - Checks for slow queries
 * - Reports database size and growth
 * 
 * Usage: node monitor.js [--output=json|console] [--verbose]
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const outputFormat = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'console';
const verbose = args.includes('--verbose');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for monitoring'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Get database name from connection string
const getDatabaseName = () => {
  const uri = process.env.MONGO_URI;
  const dbNameMatch = uri.match(/\/([^/?]+)(\?|$)/);
  return dbNameMatch ? dbNameMatch[1] : 'unknown';
};

// Monitor function
const monitorDatabase = async () => {
  try {
    const db = mongoose.connection.db;
    const dbName = getDatabaseName();
    const startTime = Date.now();
    
    console.log(`Starting database monitoring for ${dbName}`);
    
    // 1. Get server status
    const serverStatus = await db.command({ serverStatus: 1 });
    
    // 2. Get collection stats
    const collections = await db.listCollections().toArray();
    const collectionStats = [];
    
    for (const collection of collections) {
      const stats = await db.command({ collStats: collection.name });
      collectionStats.push({
        name: collection.name,
        count: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize,
        storageSize: stats.storageSize,
        indexSize: stats.totalIndexSize,
        indexCount: stats.nindexes
      });
    }
    
    // 3. Get database stats
    const dbStats = await db.command({ dbStats: 1 });
    
    // 4. Check for slow queries if verbose
    let slowQueries = [];
    if (verbose) {
      try {
        // This requires profiling to be enabled on the database
        slowQueries = await db.collection('system.profile')
          .find({ millis: { $gt: 100 } })
          .sort({ ts: -1 })
          .limit(10)
          .toArray();
      } catch (error) {
        console.log('Profiling not enabled or not accessible. Skipping slow query analysis.');
      }
    }
    
    // 5. Prepare report
    const report = {
      timestamp: new Date().toISOString(),
      database: dbName,
      uptime: serverStatus.uptime,
      connections: {
        current: serverStatus.connections.current,
        available: serverStatus.connections.available,
        totalCreated: serverStatus.connections.totalCreated
      },
      memory: {
        resident: serverStatus.mem.resident,
        virtual: serverStatus.mem.virtual,
        mapped: serverStatus.mem.mapped
      },
      storage: {
        dbSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexSize: dbStats.indexSize,
        fsUsedSize: dbStats.fsUsedSize,
        fsTotalSize: dbStats.fsTotalSize
      },
      collections: collectionStats,
      slowQueries: slowQueries.map(q => ({
        operation: q.op,
        namespace: q.ns,
        duration: q.millis,
        query: q.query || q.command,
        timestamp: q.ts
      })),
      executionTime: (Date.now() - startTime) / 1000
    };
    
    // 6. Output report
    if (outputFormat === 'json') {
      const reportsDir = path.join(__dirname, '../reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const reportPath = path.join(reportsDir, `db-monitor-${timestamp}.json`);
      await writeFileAsync(reportPath, JSON.stringify(report, null, 2));
      console.log(`Report saved to ${reportPath}`);
    } else {
      // Console output
      console.log('\n=== DATABASE MONITORING REPORT ===');
      console.log(`Timestamp: ${report.timestamp}`);
      console.log(`Database: ${report.database}`);
      console.log(`Uptime: ${report.uptime} seconds`);
      
      console.log('\n--- Connection Stats ---');
      console.log(`Current Connections: ${report.connections.current}`);
      console.log(`Available Connections: ${report.connections.available}`);
      console.log(`Total Created: ${report.connections.totalCreated}`);
      
      console.log('\n--- Memory Usage ---');
      console.log(`Resident: ${(report.memory.resident / 1024).toFixed(2)} MB`);
      console.log(`Virtual: ${(report.memory.virtual / 1024).toFixed(2)} MB`);
      
      console.log('\n--- Storage Stats ---');
      console.log(`Database Size: ${(report.storage.dbSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Storage Size: ${(report.storage.storageSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`Index Size: ${(report.storage.indexSize / (1024 * 1024)).toFixed(2)} MB`);
      
      if (report.storage.fsTotalSize) {
        const usedPercent = (report.storage.fsUsedSize / report.storage.fsTotalSize * 100).toFixed(2);
        console.log(`Filesystem Usage: ${usedPercent}%`);
      }
      
      console.log('\n--- Collection Stats ---');
      report.collections.forEach(coll => {
        console.log(`${coll.name}:`);
        console.log(`  Documents: ${coll.count}`);
        console.log(`  Size: ${(coll.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`  Indexes: ${coll.indexCount} (${(coll.indexSize / (1024 * 1024)).toFixed(2)} MB)`);
      });
      
      if (verbose && report.slowQueries.length > 0) {
        console.log('\n--- Slow Queries ---');
        report.slowQueries.forEach((query, i) => {
          console.log(`Query ${i + 1}:`);
          console.log(`  Operation: ${query.operation}`);
          console.log(`  Namespace: ${query.namespace}`);
          console.log(`  Duration: ${query.duration} ms`);
          console.log(`  Timestamp: ${query.timestamp}`);
          if (verbose) {
            console.log(`  Query: ${JSON.stringify(query.query)}`);
          }
        });
      }
      
      console.log('\n--- Performance ---');
      console.log(`Report Generation Time: ${report.executionTime} seconds`);
      console.log('===============================\n');
    }
    
    console.log('Database monitoring completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error during database monitoring: ${error.message}`);
    process.exit(1);
  }
};

// Run the monitoring
monitorDatabase(); 
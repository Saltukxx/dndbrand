/**
 * Database Migration Script for DnD Brand
 * 
 * This script handles database schema migrations:
 * - Tracks migration versions
 * - Applies pending migrations
 * - Rolls back migrations if needed
 * 
 * Usage: 
 *   - Apply all pending migrations: node migrate.js up
 *   - Rollback last migration: node migrate.js down
 *   - Rollback to specific version: node migrate.js down --to=20230101
 *   - List migration status: node migrate.js status
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Define Migration model schema
const migrationSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for migration'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Get Migration model (create collection if it doesn't exist)
const Migration = mongoose.model('Migration', migrationSchema);

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'status';
const toVersion = args.find(arg => arg.startsWith('--to='))?.split('=')[1];

// Path to migrations directory
const migrationsDir = path.join(__dirname, '../migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
  console.log(`Created migrations directory at ${migrationsDir}`);
}

// Get all migration files
const getMigrationFiles = async () => {
  try {
    const files = await readdir(migrationsDir);
    return files
      .filter(file => file.endsWith('.js'))
      .sort((a, b) => {
        const versionA = a.split('-')[0];
        const versionB = b.split('-')[0];
        return versionA.localeCompare(versionB);
      });
  } catch (error) {
    console.error(`Error reading migrations directory: ${error.message}`);
    process.exit(1);
  }
};

// Get applied migrations from database
const getAppliedMigrations = async () => {
  try {
    return await Migration.find().sort({ version: 1 });
  } catch (error) {
    console.error(`Error fetching applied migrations: ${error.message}`);
    process.exit(1);
  }
};

// Apply a migration
const applyMigration = async (migrationFile) => {
  try {
    const version = migrationFile.split('-')[0];
    const description = migrationFile
      .split('-')
      .slice(1)
      .join('-')
      .replace('.js', '');
    
    console.log(`Applying migration: ${migrationFile}`);
    
    // Import migration file
    const migration = require(path.join(migrationsDir, migrationFile));
    
    // Run up function
    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${migrationFile} does not export an 'up' function`);
    }
    
    await migration.up(mongoose);
    
    // Record migration in database
    await Migration.create({
      version,
      description,
      appliedAt: new Date()
    });
    
    console.log(`Migration ${version} applied successfully`);
  } catch (error) {
    console.error(`Error applying migration ${migrationFile}: ${error.message}`);
    process.exit(1);
  }
};

// Rollback a migration
const rollbackMigration = async (migrationFile, appliedMigration) => {
  try {
    console.log(`Rolling back migration: ${migrationFile}`);
    
    // Import migration file
    const migration = require(path.join(migrationsDir, migrationFile));
    
    // Run down function
    if (typeof migration.down !== 'function') {
      throw new Error(`Migration ${migrationFile} does not export a 'down' function`);
    }
    
    await migration.down(mongoose);
    
    // Remove migration record from database
    await Migration.deleteOne({ _id: appliedMigration._id });
    
    console.log(`Migration ${appliedMigration.version} rolled back successfully`);
  } catch (error) {
    console.error(`Error rolling back migration ${migrationFile}: ${error.message}`);
    process.exit(1);
  }
};

// Create a new migration file
const createMigration = async (description) => {
  if (!description) {
    console.error('Migration description is required');
    process.exit(1);
  }
  
  const version = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const filename = `${version}-${description.toLowerCase().replace(/\s+/g, '-')}.js`;
  const filePath = path.join(migrationsDir, filename);
  
  const template = `/**
 * Migration: ${description}
 * Version: ${version}
 */

module.exports = {
  /**
   * Apply the migration
   * @param {Object} mongoose Mongoose instance
   */
  up: async (mongoose) => {
    // TODO: Implement migration logic
    // Example:
    // const db = mongoose.connection.db;
    // await db.collection('users').updateMany({}, { $set: { newField: 'defaultValue' } });
  },

  /**
   * Rollback the migration
   * @param {Object} mongoose Mongoose instance
   */
  down: async (mongoose) => {
    // TODO: Implement rollback logic
    // Example:
    // const db = mongoose.connection.db;
    // await db.collection('users').updateMany({}, { $unset: { newField: '' } });
  }
};
`;
  
  fs.writeFileSync(filePath, template);
  console.log(`Created new migration file: ${filename}`);
  process.exit(0);
};

// Show migration status
const showStatus = async () => {
  const migrationFiles = await getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  
  console.log('\n=== MIGRATION STATUS ===');
  
  if (migrationFiles.length === 0) {
    console.log('No migration files found');
  } else {
    console.log('Migration files:');
    
    for (const file of migrationFiles) {
      const version = file.split('-')[0];
      const isApplied = appliedMigrations.some(m => m.version === version);
      const status = isApplied ? 'APPLIED' : 'PENDING';
      const appliedAt = isApplied 
        ? appliedMigrations.find(m => m.version === version).appliedAt.toISOString()
        : '';
      
      console.log(`  ${status.padEnd(10)} ${file.padEnd(40)} ${appliedAt}`);
    }
  }
  
  console.log('\nTo apply pending migrations: node migrate.js up');
  console.log('To rollback last migration: node migrate.js down');
  console.log('To create a new migration: node migrate.js create "Description of changes"');
  console.log('=======================\n');
};

// Apply pending migrations
const applyPendingMigrations = async () => {
  const migrationFiles = await getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  
  const pendingMigrations = migrationFiles.filter(file => {
    const version = file.split('-')[0];
    return !appliedMigrations.some(m => m.version === version);
  });
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations to apply');
    return;
  }
  
  console.log(`Found ${pendingMigrations.length} pending migrations`);
  
  for (const migrationFile of pendingMigrations) {
    await applyMigration(migrationFile);
  }
  
  console.log('All pending migrations applied successfully');
};

// Rollback migrations
const rollbackMigrations = async () => {
  const migrationFiles = await getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  
  if (appliedMigrations.length === 0) {
    console.log('No migrations to roll back');
    return;
  }
  
  if (toVersion) {
    // Rollback to specific version
    const targetIndex = appliedMigrations.findIndex(m => m.version === toVersion);
    
    if (targetIndex === -1) {
      console.error(`Target version ${toVersion} not found in applied migrations`);
      process.exit(1);
    }
    
    const migrationsToRollback = appliedMigrations.slice(targetIndex + 1).reverse();
    
    if (migrationsToRollback.length === 0) {
      console.log(`Already at target version ${toVersion}`);
      return;
    }
    
    console.log(`Rolling back ${migrationsToRollback.length} migrations to version ${toVersion}`);
    
    for (const migration of migrationsToRollback) {
      const migrationFile = migrationFiles.find(file => file.startsWith(migration.version));
      
      if (!migrationFile) {
        console.error(`Migration file for version ${migration.version} not found`);
        process.exit(1);
      }
      
      await rollbackMigration(migrationFile, migration);
    }
  } else {
    // Rollback last migration
    const lastMigration = appliedMigrations[appliedMigrations.length - 1];
    const migrationFile = migrationFiles.find(file => file.startsWith(lastMigration.version));
    
    if (!migrationFile) {
      console.error(`Migration file for version ${lastMigration.version} not found`);
      process.exit(1);
    }
    
    await rollbackMigration(migrationFile, lastMigration);
  }
  
  console.log('Rollback completed successfully');
};

// Main function
const main = async () => {
  try {
    switch (command) {
      case 'up':
        await applyPendingMigrations();
        break;
      case 'down':
        await rollbackMigrations();
        break;
      case 'create':
        await createMigration(args[1]);
        break;
      case 'status':
      default:
        await showStatus();
        break;
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the migration script
main(); 
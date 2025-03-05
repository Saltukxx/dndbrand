/**
 * MongoDB Backup Script for DnD Brand
 * 
 * Usage:
 * - For backup: node backup.js backup
 * - For restore: node backup.js restore <backup-file-path>
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, '../backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

// Parse MongoDB URI to get database name and credentials
const parseMongoUri = (uri) => {
  try {
    // Extract database name
    const dbName = uri.split('/').pop().split('?')[0];
    
    // Extract username and password if present
    let username = '';
    let password = '';
    
    if (uri.includes('@')) {
      const authPart = uri.split('@')[0].split('//')[1];
      if (authPart.includes(':')) {
        [username, password] = authPart.split(':');
      }
    }
    
    // Extract host and port
    let host = 'localhost';
    let port = '27017';
    
    if (uri.includes('@')) {
      const hostPart = uri.split('@')[1].split('/')[0];
      if (hostPart.includes(':')) {
        [host, port] = hostPart.split(':');
      } else {
        host = hostPart;
      }
    } else if (uri.includes('://')) {
      const hostPart = uri.split('://')[1].split('/')[0];
      if (hostPart.includes(':')) {
        [host, port] = hostPart.split(':');
      } else {
        host = hostPart;
      }
    }
    
    return { dbName, username, password, host, port };
  } catch (error) {
    console.error('Error parsing MongoDB URI:', error);
    process.exit(1);
  }
};

// Backup database
const backupDatabase = () => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = path.join(backupsDir, `backup-${timestamp}`);
  
  const { dbName, username, password, host, port } = parseMongoUri(process.env.MONGO_URI);
  
  let command = `mongodump --host ${host} --port ${port} --db ${dbName} --out ${backupPath}`;
  
  if (username && password) {
    command += ` --username ${username} --password ${password} --authenticationDatabase admin`;
  }
  
  console.log(`Starting backup of database ${dbName}...`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup failed: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Backup stderr: ${stderr}`);
    }
    
    console.log(`Backup completed successfully to ${backupPath}`);
    console.log(`Backup stdout: ${stdout}`);
  });
};

// Restore database
const restoreDatabase = (backupPath) => {
  if (!backupPath) {
    console.error('Please provide a backup path');
    process.exit(1);
  }
  
  if (!fs.existsSync(backupPath)) {
    console.error(`Backup path ${backupPath} does not exist`);
    process.exit(1);
  }
  
  const { dbName, username, password, host, port } = parseMongoUri(process.env.MONGO_URI);
  
  let command = `mongorestore --host ${host} --port ${port} --db ${dbName} ${backupPath}`;
  
  if (username && password) {
    command += ` --username ${username} --password ${password} --authenticationDatabase admin`;
  }
  
  console.log(`Starting restore of database ${dbName}...`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Restore failed: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Restore stderr: ${stderr}`);
    }
    
    console.log(`Restore completed successfully from ${backupPath}`);
    console.log(`Restore stdout: ${stdout}`);
  });
};

// Main function
const main = () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'backup') {
    backupDatabase();
  } else if (command === 'restore') {
    const backupPath = args[1];
    restoreDatabase(backupPath);
  } else {
    console.log('Usage:');
    console.log('- For backup: node backup.js backup');
    console.log('- For restore: node backup.js restore <backup-file-path>');
  }
};

main(); 
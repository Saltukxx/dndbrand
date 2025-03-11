/**
 * File Access Checker
 * Utility to check if important files exist and are accessible
 */

const fs = require('fs');
const path = require('path');

const checkFile = (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`ERROR: File does not exist: ${filePath}`);
      return false;
    }

    // Check read access
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      console.log(`✓ File exists and is readable: ${filePath}`);
    } catch (err) {
      console.error(`ERROR: File not readable: ${filePath}`);
      return false;
    }

    // Try to read file stats
    const stats = fs.statSync(filePath);
    console.log(`✓ File size: ${stats.size} bytes`);
    console.log(`✓ File permissions: ${stats.mode.toString(8)}`);
    
    return true;
  } catch (err) {
    console.error(`ERROR checking file ${filePath}: ${err.message}`);
    return false;
  }
};

// Set up paths to check
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const htmlDir = path.join(publicDir, 'html');

// Files to check
const criticalFiles = [
  { name: 'Root directory', path: rootDir },
  { name: 'Public directory', path: publicDir },
  { name: 'HTML directory', path: htmlDir },
  { name: 'Index file', path: path.join(htmlDir, 'index.html') },
  { name: 'Shop file', path: path.join(htmlDir, 'shop.html') },
  { name: '404 file', path: path.join(htmlDir, '404.html') }
];

// Run check
console.log('=== Starting File Access Check ===');
let allValid = true;

criticalFiles.forEach(file => {
  console.log(`\nChecking ${file.name}: ${file.path}`);
  
  try {
    if (fs.existsSync(file.path)) {
      const stats = fs.statSync(file.path);
      if (stats.isDirectory()) {
        console.log(`✓ Directory exists: ${file.path}`);
        // List contents of directories
        const contents = fs.readdirSync(file.path);
        console.log(`✓ Directory contents (${contents.length} items):`);
        contents.forEach(item => {
          try {
            const itemPath = path.join(file.path, item);
            const itemStats = fs.statSync(itemPath);
            const type = itemStats.isDirectory() ? 'DIR' : 'FILE';
            console.log(`  - [${type}] ${item} (${itemStats.size} bytes)`);
          } catch (err) {
            console.log(`  - Error reading ${item}: ${err.message}`);
          }
        });
      } else {
        const isValid = checkFile(file.path);
        if (!isValid) allValid = false;
      }
    } else {
      console.error(`✗ ${file.name} does not exist: ${file.path}`);
      allValid = false;
    }
  } catch (err) {
    console.error(`✗ Error checking ${file.name}: ${err.message}`);
    allValid = false;
  }
});

console.log('\n=== File Access Check Complete ===');
console.log(allValid ? '✓ All files are valid and accessible' : '✗ Some files have issues');

module.exports = {
  checkFile
}; 
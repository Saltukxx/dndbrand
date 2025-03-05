const fs = require('fs');
const path = require('path');

console.log('Checking DnD Brand E-commerce setup...');

// Required directories
const requiredDirs = [
  'server',
  'server/config',
  'server/controllers',
  'server/middleware',
  'server/models',
  'server/routes',
  'server/uploads',
  'uploads'
];

// Required files
const requiredFiles = [
  'server/server.js',
  'server/package.json',
  'server/config/.env',
  'package.json',
  'README.md'
];

// Check directories
console.log('\nChecking required directories:');
let dirErrors = 0;
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} exists`);
  } else {
    console.log(`❌ ${dir} does not exist`);
    dirErrors++;
  }
});

// Check files
console.log('\nChecking required files:');
let fileErrors = 0;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} does not exist`);
    fileErrors++;
  }
});

// Check MongoDB connection
console.log('\nChecking MongoDB connection:');
if (fs.existsSync('server/config/.env')) {
  try {
    const envContent = fs.readFileSync('server/config/.env', 'utf8');
    const mongoLine = envContent.split('\n').find(line => line.startsWith('MONGO_URI='));
    
    if (mongoLine && mongoLine.length > 10) {
      console.log('✅ MongoDB URI is configured');
    } else {
      console.log('❌ MongoDB URI is not properly configured');
      fileErrors++;
    }
  } catch (error) {
    console.log('❌ Error reading .env file');
    fileErrors++;
  }
} else {
  console.log('❌ .env file not found');
  fileErrors++;
}

// Summary
console.log('\nSetup check summary:');
if (dirErrors === 0 && fileErrors === 0) {
  console.log('✅ All required directories and files exist');
  console.log('✅ Setup is complete');
} else {
  console.log(`❌ ${dirErrors} directory issues and ${fileErrors} file issues found`);
  console.log('❌ Setup is incomplete');
}

console.log('\nTo start the application:');
console.log('1. Make sure MongoDB is running');
console.log('2. Run "npm run install:all" to install dependencies');
console.log('3. Run "npm run dev:server" to start the server');
console.log('4. Open http://localhost:5000 in your browser');
console.log('\nOr use the start.bat (Windows) or start.sh (Linux/Mac) script to do all of the above automatically.'); 
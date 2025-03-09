/**
 * DnD Brand - Auto-Fix Script for Routes and Controllers
 * This script automatically fixes common issues in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.magenta}DnD Brand - Auto-Fix Script${colors.reset}\n`);

// Fix 1: Replace userRoutes.js with the correct function names
console.log(`${colors.blue}Fixing user routes...${colors.reset}`);

const userRoutesPath = path.join(__dirname, 'server', 'routes', 'userRoutes.js');
if (fs.existsSync(userRoutesPath)) {
  try {
    let content = fs.readFileSync(userRoutesPath, 'utf8');
    
    // Check if the file contains the issue
    if (content.includes('{ register, login, getMe }')) {
      // Make backup
      fs.writeFileSync(`${userRoutesPath}.bak`, content);
      console.log(`${colors.yellow}Created backup: ${userRoutesPath}.bak${colors.reset}`);
      
      // Fix the imports
      content = content.replace('{ register, login, getMe }', '{ registerUser, loginUser, getMe }');
      
      // Fix the route handlers
      content = content.replace('router.post(\'/register\', register)', 'router.post(\'/register\', registerUser)');
      content = content.replace('router.post(\'/login\', loginRateLimiter, login)', 'router.post(\'/login\', loginRateLimiter, loginUser)');
      
      // Write the fixed file
      fs.writeFileSync(userRoutesPath, content);
      console.log(`${colors.green}✓ Fixed user routes file${colors.reset}`);
    } else {
      console.log(`${colors.green}User routes file appears to be already fixed${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error fixing user routes: ${error.message}${colors.reset}`);
  }
} else {
  console.error(`${colors.red}User routes file not found at: ${userRoutesPath}${colors.reset}`);
}

// Fix 2: Create a fixed version for Render deployment
console.log(`\n${colors.blue}Creating fixed version for deployment...${colors.reset}`);

const fixedUserRoutesPath = path.join(__dirname, 'server', 'routes', 'userRoutes.js.fixed');
try {
  const fixedContent = `const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/security');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginRateLimiter, loginUser);
router.get('/me', protect, getMe);

module.exports = router;`;

  fs.writeFileSync(fixedUserRoutesPath, fixedContent);
  console.log(`${colors.green}✓ Created fixed version at: ${fixedUserRoutesPath}${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error creating fixed version: ${error.message}${colors.reset}`);
}

// Fix 3: Check for missing dependencies in server's package.json
console.log(`\n${colors.blue}Checking for missing dependencies...${colors.reset}`);

const serverPackageJsonPath = path.join(__dirname, 'server', 'package.json');
const requiredDependencies = {
  'node-cache': '^5.1.2',
  'winston': '^3.8.2',
  'multer': '^1.4.4',
  'multer-gridfs-storage': '^5.0.2',
  'gridfs-stream': '^1.1.1',
  'method-override': '^3.0.0'
};

try {
  const packageJson = JSON.parse(fs.readFileSync(serverPackageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  let dependenciesAdded = false;
  for (const [dependency, version] of Object.entries(requiredDependencies)) {
    if (!dependencies[dependency]) {
      console.log(`${colors.yellow}Adding missing dependency: ${dependency}@${version}${colors.reset}`);
      dependencies[dependency] = version;
      dependenciesAdded = true;
    }
  }
  
  if (dependenciesAdded) {
    packageJson.dependencies = dependencies;
    
    // Update the postinstall script to include all required dependencies
    if (packageJson.scripts && packageJson.scripts.postinstall) {
      const requiredDepsString = Object.keys(requiredDependencies).join(' ');
      packageJson.scripts.postinstall = `echo 'Checking for missing dependencies...' && npm install ${requiredDepsString} --legacy-peer-deps --no-save || true`;
      console.log(`${colors.yellow}Updated postinstall script with all required dependencies${colors.reset}`);
    }
    
    // Save the updated package.json
    fs.writeFileSync(serverPackageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`${colors.green}✓ Updated server package.json with missing dependencies${colors.reset}`);
    
    // Try to install the dependencies
    try {
      console.log(`${colors.blue}Installing missing dependencies...${colors.reset}`);
      process.chdir(path.join(__dirname, 'server'));
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
      process.chdir(__dirname);
      console.log(`${colors.green}✓ Dependencies installed successfully${colors.reset}`);
    } catch (installError) {
      console.error(`${colors.red}Error installing dependencies: ${installError.message}${colors.reset}`);
      console.log(`${colors.yellow}Please run 'cd server && npm install --legacy-peer-deps' manually${colors.reset}`);
    }
  } else {
    console.log(`${colors.green}All required dependencies are already installed${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}Error checking dependencies: ${error.message}${colors.reset}`);
}

// Fix 4: Create a .env file from example if it doesn't exist
console.log(`\n${colors.blue}Checking environment configuration...${colors.reset}`);

const envPath = path.join(__dirname, 'server', 'config', '.env');
const envExamplePath = path.join(__dirname, 'server', 'config', 'production.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log(`${colors.green}✓ Created .env file from example${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error creating .env file: ${error.message}${colors.reset}`);
  }
} else if (fs.existsSync(envPath)) {
  console.log(`${colors.green}Environment file already exists${colors.reset}`);
} else {
  console.error(`${colors.red}Environment example file not found at: ${envExamplePath}${colors.reset}`);
}

// Fix 5: Create fallback versions of critical middleware files
console.log(`\n${colors.blue}Creating fallback middleware files...${colors.reset}`);

// Create a simplified upload.js middleware that doesn't rely on multer-gridfs-storage
const uploadJsPath = path.join(__dirname, 'server', 'middleware', 'upload.js.fallback');
try {
  const uploadJsContent = `/**
 * Simplified upload middleware that doesn't rely on multer-gridfs-storage
 * Used as a fallback when GridFS is not available
 */
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, \`\${Date.now()}-\${file.originalname.replace(/\\s+/g, '-')}\`);
  }
});

// Check file type
function checkFileType(file, cb) {
  // Allowed file extensions
  const filetypes = /jpeg|jpg|png|gif|webp/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images are allowed'));
  }
}

// Initialize upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = {
  upload,
  uploadSingle: upload.single('image'),
  uploadMultiple: upload.array('images', 5)
};`;

  fs.writeFileSync(uploadJsPath, uploadJsContent);
  console.log(`${colors.green}✓ Created fallback upload middleware${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error creating fallback upload middleware: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.magenta}Auto-Fix Complete!${colors.reset}`);
console.log(`${colors.cyan}You can now deploy your application or run the verification script to check for other issues.${colors.reset}`); 
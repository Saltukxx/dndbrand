/**
 * DnD Brand - Auto-Fix Script for Routes and Controllers
 * This script automatically fixes common issues in the codebase
 */

const fs = require('fs');
const path = require('path');

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

// Fix 3: Create a .env file from example if it doesn't exist
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

console.log(`\n${colors.magenta}Auto-Fix Complete!${colors.reset}`);
console.log(`${colors.cyan}You can now deploy your application or run the verification script to check for other issues.${colors.reset}`); 
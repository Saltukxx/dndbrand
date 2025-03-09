/**
 * Route verification utility script
 * This script checks all routes and controllers to ensure there are no mismatches
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Use promisified fs functions
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);

// Paths to check
const ROUTES_DIR = path.join(__dirname, 'server', 'routes');
const CONTROLLERS_DIR = path.join(__dirname, 'server', 'controllers');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Patterns to identify router methods and controller imports
const ROUTER_METHOD_PATTERN = /router\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]\s*,\s*([a-zA-Z0-9_.]+)/g;
const CONTROLLER_IMPORT_PATTERN = /const\s+{([^}]+)}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

async function checkRoutesDirectory() {
  console.log(`${colors.blue}Checking routes directory: ${ROUTES_DIR}${colors.reset}`);
  
  try {
    // Check if routes directory exists
    await stat(ROUTES_DIR);
  } catch (error) {
    console.error(`${colors.red}Error: Routes directory does not exist: ${ROUTES_DIR}${colors.reset}`);
    return false;
  }
  
  const routeFiles = await readdir(ROUTES_DIR);
  console.log(`${colors.green}Found ${routeFiles.length} route files${colors.reset}`);
  
  let hasErrors = false;
  
  for (const routeFile of routeFiles) {
    if (!routeFile.endsWith('.js')) continue;
    
    const routePath = path.join(ROUTES_DIR, routeFile);
    console.log(`\n${colors.cyan}Checking route file: ${routeFile}${colors.reset}`);
    
    try {
      const content = await readFile(routePath, 'utf8');
      
      // Extract controller imports
      const imports = {};
      let match;
      
      while ((match = CONTROLLER_IMPORT_PATTERN.exec(content)) !== null) {
        const importList = match[1].split(',').map(item => item.trim());
        const importPath = match[2];
        
        for (const importItem of importList) {
          imports[importItem] = importPath;
        }
      }
      
      console.log(`${colors.blue}Imported controllers:${colors.reset}`, imports);
      
      // Extract router methods and handlers
      const handlers = [];
      ROUTER_METHOD_PATTERN.lastIndex = 0; // Reset regex
      
      while ((match = ROUTER_METHOD_PATTERN.exec(content)) !== null) {
        const [, method, route, handler] = match;
        handlers.push({ method, route, handler });
      }
      
      // Check if each handler exists in imports
      for (const { method, route, handler } of handlers) {
        let isValid = false;
        
        // If the handler includes middleware like 'auth,' check only the last part
        const handlerParts = handler.split(',').map(p => p.trim());
        const actualHandler = handlerParts[handlerParts.length - 1];
        
        for (const importItem in imports) {
          if (actualHandler === importItem) {
            isValid = true;
            break;
          }
        }
        
        if (!isValid) {
          console.error(`${colors.red}Error: Handler '${handler}' used in ${method.toUpperCase()} ${route} is not imported${colors.reset}`);
          hasErrors = true;
        } else {
          console.log(`${colors.green}✓ ${method.toUpperCase()} ${route} => ${handler}${colors.reset}`);
        }
      }
      
    } catch (error) {
      console.error(`${colors.red}Error reading file ${routePath}: ${error.message}${colors.reset}`);
      hasErrors = true;
    }
  }
  
  return !hasErrors;
}

async function checkControllersDirectory() {
  console.log(`\n${colors.blue}Checking controllers directory: ${CONTROLLERS_DIR}${colors.reset}`);
  
  try {
    // Check if controllers directory exists
    await stat(CONTROLLERS_DIR);
  } catch (error) {
    console.error(`${colors.red}Error: Controllers directory does not exist: ${CONTROLLERS_DIR}${colors.reset}`);
    return false;
  }
  
  const controllerFiles = await readdir(CONTROLLERS_DIR);
  console.log(`${colors.green}Found ${controllerFiles.length} controller files${colors.reset}`);
  
  return true;
}

async function main() {
  console.log(`${colors.magenta}Route Verification Utility${colors.reset}\n`);
  
  try {
    const routesValid = await checkRoutesDirectory();
    const controllersValid = await checkControllersDirectory();
    
    if (routesValid && controllersValid) {
      console.log(`\n${colors.green}All routes and controllers appear to be valid!${colors.reset}`);
      process.exit(0);
    } else {
      console.error(`\n${colors.red}Issues found in routes or controllers${colors.reset}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}An error occurred during verification: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main(); 
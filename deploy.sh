#!/bin/bash

echo "==== DnD Brand Deployment Script ===="
echo "This script will prepare the application for deployment"
echo

# Check if we're in the root directory
if [ ! -d "server" ] || [ ! -d "public" ]; then
  echo "Error: This script must be run from the root directory of the project"
  exit 1
fi

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server
npm install
npm install node-cache winston --no-save

# Create .env file from example if it doesn't exist
if [ ! -f "config/.env" ] && [ -f "config/production.env.example" ]; then
  echo "Creating .env file from example..."
  cp config/production.env.example config/.env
  echo "Please update the .env file with your configuration values"
fi

# Go back to root
cd ..

# Verify routes and controllers
echo "Verifying routes and controllers..."
node verify-routes.js
if [ $? -ne 0 ]; then
  echo "Warning: Route verification detected issues that need to be addressed"
  echo "Check the output above for details on what needs to be fixed"
  
  read -p "Continue with deployment preparation anyway? (y/N): " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Deployment preparation aborted"
    exit 1
  fi
fi

echo
echo "Deployment preparation complete!"
echo "You can now deploy to Render using the 'render.yaml' configuration"
echo
echo "For manual deployment, run:"
echo "  cd server && NODE_ENV=production node production-server.js"
echo 
echo "Make sure to set up all required environment variables in your Render dashboard"
echo "==== End of Deployment Script ====" 
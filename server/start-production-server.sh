#!/bin/bash

echo "Starting DnD Brand Production Server with HTTPS..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if required packages are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies."
        exit 1
    fi
fi

# Check if SSL certificates exist
if [ -z "$SSL_KEY_PATH" ] || [ ! -f "$SSL_KEY_PATH" ]; then
    echo "Warning: SSL key file not found at $SSL_KEY_PATH"
    echo "The server will run in HTTP-only mode, which is not recommended for production."
    echo "Please configure SSL certificates for secure HTTPS connections."
    echo
fi

# Set production environment
export NODE_ENV=production

# Start the server
echo "Starting production server..."
node production-server.js

# Check if server started successfully
if [ $? -ne 0 ]; then
    echo "Error: Failed to start the server."
    exit 1
fi 
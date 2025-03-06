#!/bin/bash

echo "DnD Brand E-commerce Website"
echo "============================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Installing dependencies..."
npm install

echo
echo "Starting DnD Brand server..."
echo
echo "Server will be available at http://localhost:3000"
echo
echo "Press Ctrl+C to stop the server"
echo

npm start 
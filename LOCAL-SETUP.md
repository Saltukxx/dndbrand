# Running DnD Brand Website Locally

This guide will help you run the DnD Brand website locally on your computer to avoid CORS issues and properly test all features.

## Prerequisites

- Node.js installed on your computer (Download from [nodejs.org](https://nodejs.org/))

## Option 1: Using the Batch File (Easiest)

1. Double-click the `start-server.bat` file in the project folder
2. The server will start automatically
3. Open your browser and go to: http://localhost:3000/html/index.html

## Option 2: Using PowerShell

1. Right-click on `start-server.ps1` and select "Run with PowerShell"
2. The server will start automatically
3. Open your browser and go to: http://localhost:3000/html/index.html

## Option 3: Using Command Prompt Manually

1. Open Command Prompt
2. Navigate to the project folder:
   ```
   cd path\to\dndbrand
   ```
3. Install dependencies (first time only):
   ```
   npm install
   ```
4. Start the server:
   ```
   node server.js
   ```
5. Open your browser and go to: http://localhost:3000/html/index.html

## Troubleshooting

### CORS Issues
Running the website through this local server should resolve CORS issues. If you're still experiencing CORS errors:

1. Make sure you're accessing the website through http://localhost:3000 and not by opening the HTML files directly
2. Check that the server is running (you should see "Server running at http://localhost:3000" in the console)
3. Try clearing your browser cache

### Missing Images
If images are not loading:

1. Make sure all image files exist in the correct folders
2. Check the image paths in your HTML/CSS/JS files
3. Look for any console errors related to specific image files

### JavaScript Errors
If you encounter JavaScript errors:

1. Open your browser's developer tools (F12)
2. Check the Console tab for specific error messages
3. Fix any identified issues in the corresponding JavaScript files

## Using Clean URLs

When running through the local server, you can use clean URLs:

- http://localhost:3000/ (Homepage)
- http://localhost:3000/shop (Shop page)
- http://localhost:3000/product?id=123 (Product page)

These will automatically be mapped to the correct HTML files. 
/**
 * One-time script to upload the placeholder image to the database
 * Run this script once to ensure the placeholder image is available from the server
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

// API endpoint for uploading images
const API_URL = 'https://dndbrand-server.onrender.com/api';
const UPLOAD_ENDPOINT = `${API_URL}/images/upload`;

// Path to the placeholder image
const PLACEHOLDER_IMAGE_PATH = path.join(__dirname, 'public', 'images', 'placeholder-product.jpg');

// Ensure special filename that's easy to reference
const PLACEHOLDER_IMAGE_FILENAME = 'placeholder-product.jpg';

// Function to upload the placeholder image
async function uploadPlaceholderImage() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Reading placeholder image...');
      
      // Check if the file exists
      if (!fs.existsSync(PLACEHOLDER_IMAGE_PATH)) {
        return reject(new Error(`Placeholder image not found at ${PLACEHOLDER_IMAGE_PATH}`));
      }
      
      // Create a form with the image file
      const form = new FormData();
      form.append('image', fs.createReadStream(PLACEHOLDER_IMAGE_PATH), {
        filename: PLACEHOLDER_IMAGE_FILENAME,
        contentType: 'image/jpeg'
      });
      
      // Set up the request
      const options = {
        method: 'POST',
        headers: {
          ...form.getHeaders(),
          'X-Special-Upload': 'placeholder'  // Special header to mark this as a placeholder image
        }
      };
      
      console.log('Uploading placeholder image to server...');
      
      // Make the request
      const req = https.request(UPLOAD_ENDPOINT, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const response = JSON.parse(data);
              console.log('Upload successful!');
              console.log('Image URL:', response.url || response.path || response.imageUrl);
              resolve(response);
            } catch (error) {
              console.error('Error parsing response:', error);
              reject(error);
            }
          } else {
            console.error(`Upload failed with status ${res.statusCode}: ${data}`);
            reject(new Error(`Upload failed with status ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', (error) => {
        console.error('Error uploading image:', error);
        reject(error);
      });
      
      // Send the form data
      form.pipe(req);
      
    } catch (error) {
      console.error('Error in uploadPlaceholderImage:', error);
      reject(error);
    }
  });
}

// Execute the upload function
uploadPlaceholderImage()
  .then((result) => {
    console.log('Placeholder image uploaded successfully.');
    console.log('You can now use this image from the server as a fallback.');
    console.log('Make sure to update the imageService.js files to use this URL.');
    console.log('Result:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to upload placeholder image:', error);
    process.exit(1);
  }); 
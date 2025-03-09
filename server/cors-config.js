/**
 * CORS Configuration for DnD Brand API Server
 * 
 * This file contains the CORS configuration for the DnD Brand API server.
 * Add this to your server project and import it in your main server file.
 */

// Import the cors package (make sure to install it first: npm install cors)
const cors = require('cors');

// CORS options - PRODUCTION CONFIGURATION
const corsOptions = {
    // Allow only specific origins
    origin: [
        'https://dndbrand.com',
        'https://www.dndbrand.com',
        'https://dndbrand-server.onrender.com',
        // Keep local development environment
        'http://localhost:3000',
        'http://localhost:8080'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Export the CORS middleware
module.exports = cors(corsOptions);

/**
 * IMPORTANT: This configuration allows requests only from specified origins.
 * This is the recommended setup for production use.
 */

/**
 * How to use this in your server:
 * 
 * 1. Install the cors package:
 *    npm install cors
 * 
 * 2. Import this file in your main server file:
 *    const corsMiddleware = require('./cors-config');
 * 
 * 3. Use the middleware before your routes:
 *    app.use(corsMiddleware);
 * 
 * 4. For Express.js, you can also apply it to specific routes:
 *    app.get('/api/products', corsMiddleware, (req, res) => { ... });
 */ 
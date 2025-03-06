/**
 * CORS Configuration for DnD Brand API Server
 * 
 * This file contains the CORS configuration for the DnD Brand API server.
 * Add this to your server project and import it in your main server file.
 */

// Import the cors package (make sure to install it first: npm install cors)
const cors = require('cors');

// List of allowed domains
const allowedDomains = [
    'https://dndbrand.com',
    'https://www.dndbrand.com',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'https://saltukxx.github.io'
];

// CORS options
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) {
            return callback(null, true);
        }
        
        // Check if the origin starts with any of the allowed domains
        const isAllowed = allowedDomains.some(domain => 
            origin === domain || origin.startsWith(`${domain}/`)
        );
        
        if (isAllowed) {
            return callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            // For development, uncomment the next line to allow all origins
            // return callback(null, true);
            
            // For production, block disallowed origins
            return callback(new Error('CORS policy: Origin not allowed'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Export the CORS middleware
module.exports = cors(corsOptions);

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
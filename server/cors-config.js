/**
 * CORS Configuration for DnD Brand API Server
 * 
 * This file contains the CORS configuration for the DnD Brand API server.
 * Add this to your server project and import it in your main server file.
 */

// Import the cors package (make sure to install it first: npm install cors)
const cors = require('cors');

// CORS options - TEMPORARILY ALLOWING ALL ORIGINS
const corsOptions = {
    origin: '*', // Allow all origins temporarily
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 hours
};

// Export the CORS middleware
module.exports = cors(corsOptions);

/**
 * WARNING: This configuration allows requests from ANY origin.
 * This should only be used for development and testing.
 * For production, use a more restrictive configuration.
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
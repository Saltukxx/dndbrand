// Configuration settings for DnD Brand
const CONFIG = {
    // API URL - Production (HTTPS)
    API_URL: 'https://dndbrand-server.onrender.com/api',
    
    // Development API URL - uncomment this line when developing locally
    // API_URL: 'http://localhost:8080/api',
    
    // Version
    VERSION: '1.0.0',
    
    // Other configuration settings
    ITEMS_PER_PAGE: 12,
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    
    // Feature flags
    FEATURES: {
        ENABLE_CACHE: true,
        DEBUG_MODE: false,
        FORCE_HTTPS: false // Disabled to prevent redirect loops
    },
    
    // Security settings
    SECURITY: {
        REQUIRE_HTTPS: false, // Disabled to prevent redirect loops
        HSTS_ENABLED: false   // Disabled to prevent redirect issues
    }
};

// Enforce HTTPS in production environments - DISABLED to prevent redirect loops
(function() {
    // This function is now disabled to prevent redirect loops
    // If you need to enforce HTTPS, enable this in a production environment
    // with proper SSL certificates
    
    // Check if we're in a browser environment
    /*
    if (typeof window !== 'undefined' && window.location && 
        CONFIG.SECURITY.REQUIRE_HTTPS && 
        window.location.protocol === 'http:' && 
        !window.location.hostname.includes('localhost')) {
        // Redirect to HTTPS
        window.location.href = window.location.href.replace('http:', 'https:');
    }
    */
})();

// Don't modify below this line
// This makes the config available to other scripts
(function() {
    window.CONFIG = CONFIG;
})(); 
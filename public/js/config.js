// Configuration settings for DnD Brand
const CONFIG = {
    // API URL - Production (HTTPS)
    API_URL: '/api',
    
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
        FORCE_HTTPS: true // Force HTTPS for all API calls in production
    },
    
    // Security settings
    SECURITY: {
        REQUIRE_HTTPS: true, // Enforce HTTPS for sensitive operations
        HSTS_ENABLED: true   // HTTP Strict Transport Security
    }
};

// Enforce HTTPS in production environments
(function() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && window.location && 
        CONFIG.SECURITY.REQUIRE_HTTPS && 
        window.location.protocol === 'http:' && 
        !window.location.hostname.includes('localhost')) {
        // Redirect to HTTPS
        window.location.href = window.location.href.replace('http:', 'https:');
    }
})();

// Don't modify below this line
// This makes the config available to other scripts
(function() {
    window.CONFIG = CONFIG;
})(); 
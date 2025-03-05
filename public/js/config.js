// Configuration settings for DnD Brand
const CONFIG = {
    // API URL - Change this when deploying to production
    API_URL: 'https://your-deployed-backend-url.com/api',
    
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
        DEBUG_MODE: false
    }
};

// Don't modify below this line
// This makes the config available to other scripts
(function() {
    window.CONFIG = CONFIG;
})(); 
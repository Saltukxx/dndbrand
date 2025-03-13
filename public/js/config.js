// Configuration settings for D&D Brand
const CONFIG = {
    // API Base URL - different for development and production
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:8080' 
        : 'https://api.dndbrand.com',
    
    // Version
    API_VERSION: 'v1',
    
    // Image paths
    IMAGES_PATH: '/images',
    
    // Other configuration variables can be added here
    CURRENCY: '₺',
    COMPANY_NAME: 'D&D Brand',
    
    // CORS Proxy URLs - multiple options for redundancy
    CORS_PROXIES: [
        // Local proxy first (most reliable)
        window.location.origin + '/api-proxy/',
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url='
    ],
    
    // Version
    VERSION: '1.0.0',
    
    // Other configuration settings
    ITEMS_PER_PAGE: 12,
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    
    // Feature flags
    FEATURES: {
        ENABLE_CACHE: true,
        DEBUG_MODE: false, // Disabled for production
        FORCE_HTTPS: true, // Enable for production
        USE_CORS_PROXY: true, // Enable CORS proxy until server CORS is fixed
        USE_MOCK_DATA: false, // MOCK DATA IS DISABLED - MUST REMAIN FALSE
        ENABLE_CART: true,
        ENABLE_WISHLIST: true,
        ENABLE_REVIEWS: true
    },
    
    // Security settings
    SECURITY: {
        REQUIRE_HTTPS: true, // Enable for production
        HSTS_ENABLED: true,  // Enable for production
        MAX_LOGIN_ATTEMPTS: 5,
        AUTO_LOGOUT_TIME: 30 * 60 * 1000 // 30 minutes of inactivity
    },
    
    // API Request settings
    API_REQUEST: {
        // Default fetch options for API requests
        DEFAULT_OPTIONS: {
            mode: 'cors',
            credentials: 'omit', // Use 'omit' to avoid CORS preflight issues
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        },
        
        // Retry settings for failed requests
        RETRY_COUNT: 3,
        RETRY_DELAY: 1000, // 1 second
        
        // Proxy settings
        PROXY_TIMEOUT: 15000 // 15 seconds
    }
};

// Helper function to fetch from API with CORS handling
async function fetchAPI(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}/${endpoint}`;
    const fetchOptions = { ...CONFIG.API_REQUEST.DEFAULT_OPTIONS, ...options };
    
    console.log(`Attempting to fetch: ${url}`);
    
    // Try direct request first
    try {
        const response = await fetch(url, fetchOptions);
        if (response.ok) {
            return await response.json();
        }
        console.warn(`Direct API request failed with status: ${response.status}`);
    } catch (error) {
        console.warn(`Direct API request failed: ${error.message}`);
    }
    
    // If direct request fails, try each CORS proxy
    if (CONFIG.FEATURES.USE_CORS_PROXY) {
        for (const proxy of CONFIG.CORS_PROXIES) {
            try {
                console.log(`Trying CORS proxy: ${proxy}`);
                const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
                
                // When using a proxy, we need to omit credentials
                const proxyOptions = { 
                    ...fetchOptions, 
                    credentials: 'omit',
                    // Some proxies don't support AbortSignal
                    signal: AbortSignal.timeout(CONFIG.API_REQUEST.PROXY_TIMEOUT)
                };
                
                const response = await fetch(proxyUrl, proxyOptions);
                if (response.ok) {
                    return await response.json();
                }
                console.warn(`Proxy request failed with status: ${response.status}`);
            } catch (error) {
                console.warn(`Proxy request failed: ${error.message}`);
            }
        }
    }
    
    // If all else fails, try no-cors mode with mock data fallback
    if (CONFIG.FEATURES.USE_MOCK_DATA) {
        console.log('All API requests failed. Unable to fetch data.');
        
        // Return empty data rather than trying to call undefined getMockData function
        console.warn('Mock data functionality is not available. Returning empty data.');
        return { error: 'Failed to fetch data', data: [] };
    }
    
    // If we get here, all approaches failed
    throw new Error('All API request approaches failed');
}

// Helper function for API requests with proper CORS handling
CONFIG.fetchAPI = async function(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}/${endpoint.replace(/^\//, '')}`;
    
    // Merge default options with provided options
    const fetchOptions = {
        ...CONFIG.API_REQUEST.DEFAULT_OPTIONS,
        ...options,
        headers: {
            ...CONFIG.API_REQUEST.DEFAULT_OPTIONS.headers,
            ...(options.headers || {})
        }
    };
    
    // Create a new AbortSignal with timeout if not provided
    if (!options.signal && !fetchOptions.signal) {
        fetchOptions.signal = AbortSignal.timeout(CONFIG.API_REQUEST.PROXY_TIMEOUT); // Use the configured timeout
    }
    
    // Log the request if debug mode is enabled
    if (CONFIG.FEATURES.DEBUG_MODE) {
        console.log(`API Request: ${url}`, fetchOptions);
    }
    
    // Implement retry logic for direct requests
    let retryCount = 0;
    const maxRetries = CONFIG.API_REQUEST.RETRY_COUNT;
    const retryDelay = CONFIG.API_REQUEST.RETRY_DELAY;
    
    // Function to delay execution
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Try direct request with retries
    while (retryCount <= maxRetries) {
        try {
            console.log(`Attempting direct API request to ${url} (attempt ${retryCount + 1}/${maxRetries + 1})`);
            
            // For Render-hosted backends, ensure we're not sending credentials
            const directFetchOptions = {
                ...fetchOptions,
                credentials: 'omit' // Change to 'omit' for Render
            };
            
            const response = await fetch(url, directFetchOptions);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Direct API request successful');
                return data;
            } else {
                console.warn(`Direct API request failed with status: ${response.status}`);
                
                // If we get a 404, don't retry
                if (response.status === 404) {
                    throw new Error(`Resource not found (404): ${url}`);
                }
                
                // If we get a 401 or 403, don't retry
                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Authentication error (${response.status}): ${url}`);
                }
            }
        } catch (error) {
            console.warn(`Direct API request attempt ${retryCount + 1} failed:`, error);
            
            // If this was our last retry, throw the error
            if (retryCount === maxRetries) {
                throw new Error(`Failed to fetch data after ${maxRetries + 1} attempts: ${error.message}`);
            }
        }
        
        // Increment retry count and wait before next attempt
        retryCount++;
        console.log(`Waiting ${retryDelay}ms before retry ${retryCount}...`);
        await delay(retryDelay);
    }
    
    // If direct requests fail, try CORS proxies
    if (CONFIG.FEATURES.USE_CORS_PROXY) {
        console.log('Direct API requests failed, trying CORS proxies...');
        
        // Try each proxy in sequence
        for (const proxyUrl of CONFIG.CORS_PROXIES) {
            try {
                console.log(`Using CORS proxy (${proxyUrl}) for API request:`, url);
                
                // When using proxy, we don't need credentials
                const proxyFetchOptions = {
                    ...fetchOptions,
                    credentials: 'omit',
                    mode: 'cors'
                };
                
                // Construct the proxy URL
                const encodedUrl = encodeURIComponent(url);
                const fullProxyUrl = proxyUrl.includes('?') 
                    ? `${proxyUrl}${encodedUrl}`
                    : `${proxyUrl}${url}`;
                
                const proxyResponse = await fetch(fullProxyUrl, proxyFetchOptions);
                
                if (proxyResponse.ok) {
                    const data = await proxyResponse.json();
                    console.log(`CORS proxy (${proxyUrl}) request successful`);
                    return data;
                } else {
                    console.warn(`CORS proxy (${proxyUrl}) request failed with status: ${proxyResponse.status}`);
                }
            } catch (proxyError) {
                console.warn(`CORS proxy (${proxyUrl}) request failed:`, proxyError);
                // Continue to next proxy
            }
        }
    }
    
    // If we get here, all approaches failed
    throw new Error(`Failed to fetch data from ${url} after trying all available methods`);
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
    
    // Add HSTS header if enabled
    if (CONFIG.SECURITY.HSTS_ENABLED && typeof document !== 'undefined') {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Strict-Transport-Security';
        meta.content = 'max-age=31536000; includeSubDomains; preload';
        document.head.appendChild(meta);
    }
})();

// Make fetchAPI globally available
window.fetchAPI = fetchAPI;

// Don't modify below this line
// This makes the config available to other scripts
(function() {
    window.CONFIG = CONFIG;
})();

// Don't allow modification of the config
Object.freeze(CONFIG); 
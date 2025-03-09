// Configuration settings for DnD Brand
const CONFIG = {
    // API URL - Production (HTTPS)
    API_URL: 'https://dndbrand-server.onrender.com/api',
    
    // Development API URL - uncomment this line when developing locally
    // API_URL: 'http://localhost:8080/api',
    
    // CORS Proxy URLs - multiple options for redundancy
    CORS_PROXIES: [
        // Local proxy first (most reliable)
        window.location.origin + '/api-proxy/',
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/',
        'https://cors-anywhere.herokuapp.com/',
        'https://cors.bridged.cc/'
    ],
    
    // Version
    VERSION: '1.0.0',
    
    // Other configuration settings
    ITEMS_PER_PAGE: 12,
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    
    // Feature flags
    FEATURES: {
        ENABLE_CACHE: true,
        DEBUG_MODE: true, // Enable for more detailed logging
        FORCE_HTTPS: false, // Disabled to prevent redirect loops
        USE_CORS_PROXY: true, // Enable CORS proxy by default until server CORS is fixed
        USE_MOCK_DATA: false // MOCK DATA IS DISABLED - MUST REMAIN FALSE
    },
    
    // Security settings
    SECURITY: {
        REQUIRE_HTTPS: false, // Disabled to prevent redirect loops
        HSTS_ENABLED: false   // Disabled to prevent redirect issues
    },
    
    // API Request settings
    API_REQUEST: {
        // Default fetch options for API requests
        DEFAULT_OPTIONS: {
            mode: 'cors',
            credentials: 'omit', // Changed from 'include' to 'omit' to avoid CORS preflight issues
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        },
        
        // Retry settings for failed requests
        RETRY_COUNT: 5, // Increased from 3 to 5
        RETRY_DELAY: 2000, // Increased from 1000 to 2000 (2 seconds)
        
        // Proxy settings
        PROXY_TIMEOUT: 30000 // Increased from 10000 to 30000 (30 seconds)
    }
};

// Helper function to fetch from API with CORS handling
async function fetchAPI(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_URL}/${endpoint}`;
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
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_URL}/${endpoint.replace(/^\//, '')}`;
    
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

// Make fetchAPI globally available
window.fetchAPI = fetchAPI;

// Don't modify below this line
// This makes the config available to other scripts
(function() {
    window.CONFIG = CONFIG;
})(); 
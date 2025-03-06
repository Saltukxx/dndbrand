// Configuration settings for DnD Brand
const CONFIG = {
    // API URL - Production (HTTPS)
    API_URL: 'https://dndbrand-server.onrender.com/api',
    
    // Development API URL - uncomment this line when developing locally
    // API_URL: 'http://localhost:8080/api',
    
    // CORS Proxy URLs - multiple options for redundancy
    CORS_PROXIES: [
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
        USE_MOCK_DATA: true // Use mock data as last resort fallback
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
        RETRY_COUNT: 3,
        RETRY_DELAY: 1000, // 1 second
        
        // Proxy settings
        PROXY_TIMEOUT: 10000 // 10 seconds
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
        console.log('All API requests failed. Using mock data as fallback.');
        
        // Extract resource type from URL (e.g., 'products' from '/api/products')
        const resource = url.split('/').pop().split('?')[0];
        return getMockData(resource);
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
        fetchOptions.signal = AbortSignal.timeout(15000); // 15 second timeout
    }
    
    // Log the request if debug mode is enabled
    if (CONFIG.FEATURES.DEBUG_MODE) {
        console.log(`API Request: ${url}`, fetchOptions);
    }
    
    // Try different approaches in sequence
    let lastError = null;
    
    // 1. Try direct request first if we're not on file:// protocol
    if (window.location.protocol !== 'file:') {
        try {
            console.log('Attempting direct API request to:', url);
            
            // For Render-hosted backends, ensure we're not sending credentials
            // which can cause CORS preflight issues
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
                lastError = new Error(`API request failed with status ${response.status}`);
            }
        } catch (error) {
            console.warn('Direct API request failed:', error);
            lastError = error;
        }
    }
    
    // 2. Try CORS proxies if enabled
    if (CONFIG.FEATURES.USE_CORS_PROXY) {
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
                lastError = proxyError;
                // Continue to next proxy
            }
        }
    }
    
    // 3. Try no-cors mode as a last resort (will return opaque response)
    try {
        console.log('Attempting no-cors mode request as last resort');
        const noCorsOptions = {
            ...fetchOptions,
            mode: 'no-cors',
            credentials: 'omit'
        };
        
        await fetch(url, noCorsOptions);
        console.log('No-cors request completed (opaque response)');
        
        // Since we can't read the response with no-cors, use mock data
        if (CONFIG.FEATURES.USE_MOCK_DATA) {
            console.log('Using mock data due to CORS restrictions');
            return getMockData(endpoint);
        }
    } catch (noCorsError) {
        console.warn('No-cors request failed:', noCorsError);
        lastError = noCorsError;
    }
    
    // If all approaches failed, throw the last error
    if (lastError) {
        console.error('All API request approaches failed');
        
        // Return mock data if enabled
        if (CONFIG.FEATURES.USE_MOCK_DATA) {
            console.log('Using mock data as fallback after all approaches failed');
            return getMockData(endpoint);
        }
        
        throw lastError;
    }
};

// Helper function to get mock data based on endpoint
function getMockData(endpoint) {
    // Extract the resource type from the endpoint
    const resource = endpoint.split('/')[0].toLowerCase();
    
    // Mock data for different resources
    const mockData = {
        products: [
            {
                id: 1,
                name: 'Premium Pamuklu T-Shirt',
                category: 'men',
                price: 349.99,
                oldPrice: 499.99,
                image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'white', 'blue'],
                sizes: ['s', 'm', 'l', 'xl'],
                isNew: true,
                isSale: true,
                featured: true
            },
            {
                id: 2,
                name: 'Slim Fit Denim Pantolon',
                category: 'men',
                price: 599.99,
                image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['blue', 'black'],
                sizes: ['s', 'm', 'l', 'xl', 'xxl'],
                isNew: false,
                isSale: false
            },
            {
                id: 3,
                name: 'Oversize Sweatshirt',
                category: 'women',
                price: 449.99,
                oldPrice: 599.99,
                image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['gray', 'black', 'white'],
                sizes: ['xs', 's', 'm', 'l'],
                isNew: false,
                isSale: true
            },
            {
                id: 4,
                name: 'Slim Fit Blazer Ceket',
                category: 'men',
                price: 1299.99,
                image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'navy'],
                sizes: ['s', 'm', 'l', 'xl'],
                isNew: true,
                isSale: false,
                featured: true
            },
            {
                id: 5,
                name: 'Kadın Deri Ceket',
                category: 'women',
                price: 1899.99,
                image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'brown'],
                sizes: ['xs', 's', 'm', 'l'],
                isNew: true,
                isSale: false
            },
            {
                id: 6,
                name: 'Deri Kemer',
                category: 'accessories',
                price: 299.99,
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
                colors: ['black', 'brown'],
                sizes: ['universal'],
                isNew: false,
                isSale: false
            }
        ],
        categories: [
            { id: 1, name: 'men', displayName: 'Erkek' },
            { id: 2, name: 'women', displayName: 'Kadın' },
            { id: 3, name: 'accessories', displayName: 'Aksesuarlar' }
        ],
        orders: [],
        users: []
    };
    
    // Return appropriate mock data based on the resource
    if (resource === 'products') {
        return { data: mockData.products }; // Match the expected API response format
    } else if (resource === 'categories') {
        return { data: mockData.categories }; // Match the expected API response format
    } else {
        // Default mock data
        return { message: 'Mock data not available for this endpoint' };
    }
}

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
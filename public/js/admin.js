/**
 * DnD Brand E-commerce - Admin Dashboard Functionality
 * Comprehensive admin panel with product management, order tracking, and analytics
 */

// Default placeholder image URL (should be the same as in ImageService)
const DEFAULT_PLACEHOLDER_URL = 'https://dndbrand-server.onrender.com/api/uploads/image/placeholder-product.jpg';
// Local placeholder fallback
const LOCAL_PLACEHOLDER_URL = '/images/placeholder-product.jpg';

// Get API URL from config if available
let adminApiUrl;
if (window.CONFIG && window.CONFIG.API_URL) {
    adminApiUrl = window.CONFIG.API_URL;
    console.log('Using API URL from config.js:', adminApiUrl);
} else {
    adminApiUrl = 'https://dndbrand-server.onrender.com/api';
    console.log('Config not found, using fallback API URL:', adminApiUrl);
}

// Authentication variables
let authToken = sessionStorage.getItem('adminToken');
let adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';

// Auto-refresh interval (30 seconds)
const ADMIN_REFRESH_INTERVAL = 30000;

// Placeholder image status cache
const placeholderStatus = {
    defaultTested: false,
    defaultAvailable: false
};

// Test if the default placeholder is available
function testPlaceholderAvailability() {
    if (!placeholderStatus.defaultTested) {
        const img = new Image();
        img.onload = function() {
            placeholderStatus.defaultAvailable = true;
            placeholderStatus.defaultTested = true;
            console.log('Default placeholder image is available');
        };
        img.onerror = function() {
            placeholderStatus.defaultAvailable = false;
            placeholderStatus.defaultTested = true;
            console.log('Default placeholder image is not available, will use local fallback');
        };
        img.src = DEFAULT_PLACEHOLDER_URL;
    }
}

// Initialize placeholder test
testPlaceholderAvailability();

/**
 * Get best available placeholder image
 * @returns {string} URL to the best available placeholder image
 */
function getBestPlaceholderImage() {
    if (placeholderStatus.defaultAvailable) {
        return DEFAULT_PLACEHOLDER_URL;
    }
    return LOCAL_PLACEHOLDER_URL;
}

/**
 * Handle image loading errors with proper fallback
 * @param {HTMLImageElement} imgElement - The image element that failed to load
 */
function handleImageError(imgElement) {
    if (!imgElement) return;
    
    // Use the best placeholder image
    imgElement.src = getBestPlaceholderImage();
    
    // Remove error handler to prevent loops
    imgElement.onerror = null;
}

// Helper function to make API requests with CORS handling
async function fetchWithCORS(endpoint, options = {}) {
    try {
        // Use CONFIG.fetchAPI if available
        if (window.CONFIG && typeof window.CONFIG.fetchAPI === 'function') {
            console.log('Using CONFIG.fetchAPI for endpoint:', endpoint);
            const fullEndpoint = endpoint.startsWith('http') ? endpoint : endpoint;
            
            // Add auth token to headers if present
            const headers = options.headers || {};
            if (authToken && !headers['Authorization']) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            // Use CONFIG.fetchAPI for the request
            return await window.CONFIG.fetchAPI(fullEndpoint, {
                ...options,
                headers
            });
        }
        
        // If CONFIG.fetchAPI is not available, use direct fetch
        // Use the API URL from settings or default
        const apiUrl = adminApiUrl;
        
        // Construct the full URL
        const url = endpoint.startsWith('http') ? endpoint : `${apiUrl}/${endpoint}`;
        
        console.log(`Fetching from: ${url}`);
        
        // Add default headers
        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(options.headers || {})
            }
        };

        // Add auth token to headers if not already present
        if (authToken && !fetchOptions.headers['Authorization']) {
            fetchOptions.headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        // Try multiple CORS approaches in sequence
        
        // 1. Try direct fetch with no credentials first (least restrictive)
        try {
            console.log('Attempting direct fetch with no credentials:', url);
            const directResponse = await fetch(url, {
                ...fetchOptions,
                credentials: 'omit',
                mode: 'cors',
                signal: AbortSignal.timeout(8000) // 8 second timeout
            });
            
            if (directResponse.ok) {
                return await directResponse.json();
            }
            
            if (directResponse.status === 403 || directResponse.status === 401) {
                // Handle authentication errors
                handleAuthError(directResponse.status);
            }
            
            console.warn(`Direct fetch failed with status: ${directResponse.status}`);
        } catch (directError) {
            console.warn(`Direct fetch failed: ${directError.message}`);
        }
        
        // 2. Try with credentials included (for authenticated requests)
        try {
            console.log('Attempting fetch with credentials included:', url);
            const withCredentialsResponse = await fetch(url, {
                ...fetchOptions,
                credentials: 'include',
                mode: 'cors',
                signal: AbortSignal.timeout(8000) // 8 second timeout
            });
            
            if (withCredentialsResponse.ok) {
                return await withCredentialsResponse.json();
            }
            
            if (withCredentialsResponse.status === 403 || withCredentialsResponse.status === 401) {
                // Handle authentication errors
                handleAuthError(withCredentialsResponse.status);
            }
            
            console.warn(`Fetch with credentials failed with status: ${withCredentialsResponse.status}`);
        } catch (withCredentialsError) {
            console.warn(`Fetch with credentials failed: ${withCredentialsError.message}`);
        }
        
        // 3. Try using a proxy if available
        try {
            const proxyUrl = window.location.origin + '/api-proxy?url=' + encodeURIComponent(url);
            console.log(`Trying local proxy: ${proxyUrl}`);
            
            const proxyResponse = await fetch(proxyUrl, {
                ...fetchOptions,
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (proxyResponse.ok) {
                return await proxyResponse.json();
            }
            console.warn(`Local proxy request failed with status: ${proxyResponse.status}`);
        } catch (proxyError) {
            console.warn(`Local proxy request failed: ${proxyError.message}`);
        }
        
        // If all methods failed and we're in demo mode, use mock data as last resort
        const isDemo = authToken && authToken.startsWith('demo_token_');
        
        if (isDemo) {
            console.log('Using demo mode as fallback, providing mock data');
            const mockData = getMockData(endpoint, options);
            if (mockData) {
                console.log('Returning mock data for endpoint:', endpoint);
                return mockData;
            }
        }
        
        // All approaches failed
        throw new Error(`Sunucuya erişilemiyor (${url}). Lütfen internet bağlantınızı kontrol edin.`);
    } catch (error) {
        console.error('Error in fetchWithCORS:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}

// Handle authentication errors
function handleAuthError(statusCode) {
    console.error('Authentication error:', statusCode);
    
    // Check if we're on the admin login page
    if (!window.location.href.includes('admin-login.html')) {
        alert('Oturum süresi doldu veya yetkiniz yok. Lütfen tekrar giriş yapın.');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminAuthenticated');
        window.location.href = 'admin-login.html';
    }
    throw new Error(`Yetkilendirme hatası: ${statusCode}`);
}

/**
 * Get mock data for demo mode
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Object|null} - Mock data or null if not supported
 */
function getMockData(endpoint, options) {
    if (endpoint === 'admin/stats' || endpoint === 'stats') {
        return {
            totalSales: 12450,
            totalOrders: 38,
            totalCustomers: 56,
            totalProducts: 8
        };
    }
    
    if (endpoint === 'admin/products' || endpoint === 'products') {
        if (options.method === 'GET') {
            return [
                {
                    _id: 'demo_product_1',
                    id: 'demo_product_1',
                    name: 'Demo Ürün 1',
                    price: 199.99,
                    sku: 'DEMO001',
                    category: 'men',
                    description: 'Bu bir demo ürün açıklamasıdır.',
                    stock: 15,
                    status: 'active',
                    featured: true,
                    createdAt: new Date().toISOString(),
                    images: []
                },
                {
                    _id: 'demo_product_2',
                    id: 'demo_product_2',
                    name: 'Demo Ürün 2',
                    price: 129.99,
                    sku: 'DEMO002',
                    category: 'women',
                    description: 'Bu bir demo ürün açıklamasıdır.',
                    stock: 8,
                    status: 'active',
                    featured: false,
                    createdAt: new Date().toISOString(),
                    images: []
                }
            ];
        }
    }
    
    // For product creation
    if (endpoint === 'products' && options.method === 'POST') {
        try {
            const productData = JSON.parse(options.body);
            return {
                ...productData,
                _id: 'demo_product_' + Math.floor(Math.random() * 1000),
                id: 'demo_product_' + Math.floor(Math.random() * 1000),
                createdAt: new Date().toISOString(),
                success: true,
                message: 'Ürün başarıyla oluşturuldu (Demo)'
            };
        } catch (e) {
            return null;
        }
    }
    
    // For product updates
    if (endpoint.startsWith('products/') && options.method === 'PUT') {
        try {
            const productData = JSON.parse(options.body);
            return {
                ...productData,
                _id: endpoint.split('/')[1],
                id: endpoint.split('/')[1],
                updatedAt: new Date().toISOString(),
                success: true,
                message: 'Ürün başarıyla güncellendi (Demo)'
            };
        } catch (e) {
            return null;
        }
    }
    
    // For product deletion
    if (endpoint.startsWith('products/') && options.method === 'DELETE') {
        return {
            success: true,
            message: 'Ürün başarıyla silindi (Demo)'
        };
    }
    
    // Default case: no mock data available
    return null;
}

// Check if admin is authenticated
function checkAdminAuth() {
    const adminToken = sessionStorage.getItem('adminToken');
    if (!adminToken) {
        // Don't redirect automatically if we're already on the login page
        if (!window.location.href.includes('admin-login.html')) {
            window.location.href = 'admin-login.html';
        }
        return false;
    }
    
    // Check if using demo mode
    const isDemo = adminToken.startsWith('demo_token_');
    if (isDemo) {
        console.log('Using demo admin mode');
    }
    
    return true;
}

// Admin login function
async function loginAdmin(email, password) {
    try {
        console.log('Attempting admin login for:', email);
        
        // For local development/testing only - hardcoded demo credentials
        // This allows login even when the backend is unreachable
        if (email === 'admin@dndbrand.com' && password === 'admin123') {
            console.log('Using demo admin credentials');
            
            // Store authentication data in session storage
            const demoToken = 'demo_token_' + Math.random().toString(36).substring(2);
            sessionStorage.setItem('adminToken', demoToken);
            sessionStorage.setItem('adminAuthenticated', 'true');
            sessionStorage.setItem('adminName', 'Demo Admin');
            sessionStorage.setItem('adminEmail', email);
            
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
            return { success: true };
        }
        
        // Try to login via server
        const loginResponse = await fetchWithCORS('admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('Login response:', loginResponse);
        
        if (loginResponse && (loginResponse.token || loginResponse.data?.token)) {
            // Extract token (handle different API response formats)
            const token = loginResponse.token || loginResponse.data?.token;
            
            // Store authentication data in session storage
            sessionStorage.setItem('adminToken', token);
            sessionStorage.setItem('adminAuthenticated', 'true');
            sessionStorage.setItem('adminName', loginResponse.user?.name || loginResponse.data?.user?.name || 'Admin');
            sessionStorage.setItem('adminEmail', email);
            
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
            
            return { success: true };
        } else {
            console.error('Invalid login response:', loginResponse);
            return { 
                success: false, 
                message: 'Invalid credentials. Please try again.'
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        
        return { 
            success: false, 
            message: 'Server error. Please try again later or use demo credentials.'
        };
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('adminNotification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `admin-notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize admin dashboard
function initializeAdminDashboard() {
    console.log('Initializing admin dashboard...');
    
    // Check if we're in demo mode
    const adminToken = sessionStorage.getItem('adminToken');
    const isDemo = adminToken && adminToken.startsWith('demo_token_');
    
    // Load dashboard data if elements exist
    if (document.getElementById('totalSales') || document.getElementById('totalOrders') || 
        document.getElementById('totalCustomers') || document.getElementById('totalProducts')) {
        // Only call API if not in demo mode
        if (!isDemo) {
            loadDashboardStats();
        } else {
            // For demo mode, set placeholder stats
            if (document.getElementById('totalSales')) document.getElementById('totalSales').textContent = '₺12,450';
            if (document.getElementById('totalOrders')) document.getElementById('totalOrders').textContent = '38';
            if (document.getElementById('totalCustomers')) document.getElementById('totalCustomers').textContent = '56';
            if (document.getElementById('totalProducts')) document.getElementById('totalProducts').textContent = '8';
        }
    }
    
    // Only load recent orders if the element exists
    if (document.getElementById('recentOrdersList')) {
        // Only call API if not in demo mode
        if (!isDemo) {
            loadRecentOrders();
        } else {
            // For demo mode, set empty state
            const recentOrdersElement = document.getElementById('recentOrdersList');
            if (recentOrdersElement) {
                recentOrdersElement.innerHTML = '<li>Demo mode: Sample orders will appear here.</li>';
            }
        }
    }
    
    // Set up navigation
    setupNavigation();
    
    // Set up mobile sidebar
    setupMobileSidebar();
    
    // Set up search functionality
    setupSearch();
    
    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminAuthenticated');
            sessionStorage.removeItem('adminUser');
            window.location.href = 'admin-login.html';
        });
    }
    
    // Set up refresh interval with a more reasonable refresh rate
    // and clear any existing intervals first
    if (window.adminRefreshInterval) {
        clearInterval(window.adminRefreshInterval);
    }
    
    window.adminRefreshInterval = setInterval(() => {
        // Only refresh if the tab is visible to reduce unnecessary processing
        if (document.visibilityState === 'visible') {
            loadDashboardStats();
            loadRecentOrders();
        }
    }, ADMIN_REFRESH_INTERVAL);
    
    // Clear interval when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && window.adminRefreshInterval) {
            clearInterval(window.adminRefreshInterval);
        } else if (document.visibilityState === 'visible' && !window.adminRefreshInterval) {
            window.adminRefreshInterval = setInterval(() => {
                loadDashboardStats();
                loadRecentOrders();
            }, ADMIN_REFRESH_INTERVAL);
        }
    });
}

// Load dashboard stats
async function loadDashboardStats() {
    if (!checkAdminAuth()) return;
    
    // Get stats elements
    const salesElement = document.getElementById('totalSales');
    const customersElement = document.getElementById('totalCustomers');
    const productsElement = document.getElementById('totalProducts');
    const ordersElement = document.getElementById('newOrders');
    
    try {
        // Show loading state
        salesElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        customersElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        productsElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        ordersElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Fetch stats from API
        const stats = await fetchWithCORS('admin/stats', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        // Update UI with stats
        salesElement.textContent = stats.totalSales ? `₺${stats.totalSales.toLocaleString('tr-TR')}` : '₺0';
        customersElement.textContent = stats.totalCustomers || '0';
        productsElement.textContent = stats.totalProducts || '0';
        ordersElement.textContent = stats.newOrders || '0';
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        
        // Show error state
        salesElement.textContent = 'Hata';
        customersElement.textContent = 'Hata';
        productsElement.textContent = 'Hata';
        ordersElement.textContent = 'Hata';
        
        // Show notification
        showNotification('İstatistikler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
    }
}

// Load recent orders for dashboard
async function loadRecentOrders() {
    if (!checkAdminAuth()) return;
    
    // Get recent orders element
    const recentOrdersElement = document.getElementById('recentOrdersList');
    
    // Check if the element exists
    if (!recentOrdersElement) {
        console.warn('Recent orders list element not found');
        return;
    }
    
    // Show loading state
    recentOrdersElement.innerHTML = '<li class="loading">Siparişler yükleniyor...</li>';
    
    try {
        // Fetch recent orders from API (limit to 5)
        const orders = await fetchWithCORS('orders?limit=5', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        // Clear loading state
        recentOrdersElement.innerHTML = '';
        
        // Check if we have orders
        if (!orders || (Array.isArray(orders) && orders.length === 0)) {
            recentOrdersElement.innerHTML = '<li>Henüz sipariş bulunmamaktadır.</li>';
            return;
        }
        
        // Make sure orders is an array
        const ordersArray = Array.isArray(orders) ? orders : 
                           (orders.data ? orders.data : 
                           (orders.orders ? orders.orders : []));
        
        // Sort orders by date (newest first)
        ordersArray.sort((a, b) => {
            return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        });
        
        // Limit to 5 most recent orders
        const recentOrders = ordersArray.slice(0, 5);
        
        // Add orders to list
        recentOrders.forEach(order => {
            const date = new Date(order.date || order.createdAt).toLocaleDateString('tr-TR');
            const total = typeof order.total === 'number' ? 
                '₺' + order.total.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) : '₺0.00';
            
            // Determine status class
            let statusClass = '';
            switch (order.status?.toLowerCase()) {
                case 'completed':
                case 'tamamlandı':
                    statusClass = 'completed';
                    break;
                case 'pending':
                case 'beklemede':
                    statusClass = 'pending';
                    break;
                case 'processing':
                case 'işleniyor':
                    statusClass = 'processing';
                    break;
                case 'cancelled':
                case 'iptal edildi':
                    statusClass = 'cancelled';
                    break;
                default:
                    statusClass = 'pending';
            }
            
            const orderItem = document.createElement('li');
            orderItem.innerHTML = `
                <div class="order-id">#${order.orderNumber || order._id?.substring(0, 8) || 'N/A'}</div>
                <div class="order-date">${date}</div>
                <div class="order-status">
                    <span class="status-badge ${statusClass}">${order.status || 'Beklemede'}</span>
                </div>
                <div class="order-total">${total}</div>
                <div class="order-actions">
                    <button class="action-btn view-order-btn" data-id="${order._id || order.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            
            recentOrdersElement.appendChild(orderItem);
        });
        
        // Add event listeners to order action buttons
        document.querySelectorAll('.view-order-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderId = this.getAttribute('data-id');
                viewOrder(orderId);
            });
        });
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
        recentOrdersElement.innerHTML = '<li class="error">Siparişler yüklenirken bir hata oluştu.</li>';
        
        // Show notification
        showNotification('Siparişler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
    }
}

// View order details
function viewOrder(orderId) {
    // Show order details (to be implemented)
    showNotification(`Sipariş #${orderId} görüntüleniyor`);
}

// Load products
async function loadProducts() {
    if (!checkAdminAuth()) return;
    
    // Show loading state
    const productsTable = document.getElementById('productsTable');
    if (!productsTable) return;
    
    const tableBody = productsTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="7"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Ürünler Yükleniyor...</div></td></tr>';
    
    // Track retry attempts
    let retryCount = 0;
    const maxRetries = 2;
    
    async function attemptFetch() {
        try {
            console.log(`Loading products, attempt: ${retryCount + 1}`);
            
            // Try to fetch actual products from the server
            const response = await fetchWithCORS('products', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            console.log('Products API response:', response);
            
            // Process the response to handle different API formats
            let products = [];
            
            if (Array.isArray(response)) {
                // Direct array response
                products = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                // Data property contains products
                products = response.data;
            } else if (response && response.products && Array.isArray(response.products)) {
                // Products property contains products
                products = response.products;
            } else if (response && typeof response === 'object') {
                // Handle paginated results
                const possibleArrayProps = Object.keys(response).filter(key => 
                    Array.isArray(response[key]) && response[key].length > 0 &&
                    typeof response[key][0] === 'object' && 
                    (response[key][0].name || response[key][0].title)
                );
                
                if (possibleArrayProps.length > 0) {
                    products = response[possibleArrayProps[0]];
                } else {
                    console.warn('Unknown API response format, no product arrays found:', response);
                }
            }
            
            // If no products were found, show empty state
            if (!products || products.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="empty-state">
                                <i class="fas fa-box-open"></i>
                                <p>Henüz ürün eklenmemiş.</p>
                                <button id="addFirstProductBtn" class="btn btn-primary">
                                    <i class="fas fa-plus"></i> İlk Ürünü Ekle
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                
                // Add event listener to add product button
                const addFirstProductBtn = document.getElementById('addFirstProductBtn');
                if (addFirstProductBtn) {
                    addFirstProductBtn.addEventListener('click', function() {
                        const addProductBtn = document.getElementById('addProductBtn');
                        if (addProductBtn) {
                            addProductBtn.click();
                        } else {
                            setupAddProductButton();
                            // Create and trigger a click on the add product button
                            const event = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            document.getElementById('addProductBtn').dispatchEvent(event);
                        }
                    });
                }
                
                return;
            }
            
            // Display products
            displayProducts(products, tableBody);
            
            // Clear retry intervals if success
            if (window.productsRetryInterval) {
                clearInterval(window.productsRetryInterval);
                window.productsRetryInterval = null;
            }
        } catch (error) {
            console.error('Error loading products:', error);
            
            // Retry logic
            if (retryCount < maxRetries) {
                retryCount++;
                
                // Show retry message
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="loading-state">
                                <i class="fas fa-sync fa-spin"></i>
                                <p>Bağlantı hatası, yeniden deneniyor... (${retryCount}/${maxRetries})</p>
                            </div>
                        </td>
                    </tr>
                `;
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
                return attemptFetch();
            }
            
            // Show error message in the table after max retries
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Ürünler yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.</p>
                            <p class="error-details">${error.message}</p>
                            <button id="retryProductsBtn" class="btn btn-primary">
                                <i class="fas fa-sync"></i> Yeniden Dene
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            // Add event listener to retry button
            const retryBtn = document.getElementById('retryProductsBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', function() {
                    // Reset retry count and try again
                    retryCount = 0;
                    loadProducts();
                });
            }
            
            // Auto-retry every 30 seconds
            if (!window.productsRetryInterval) {
                window.productsRetryInterval = setInterval(() => {
                    retryCount = 0;
                    loadProducts();
                }, 30000);
            }
            
            // Show notification
            showNotification('Ürünler yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.', 'error');
        }
    }
    
    // Start the fetch attempt
    await attemptFetch();
}

// Extract product image URL with fallback
function getProductImageUrl(product) {
    let imageUrl;
    
    // First attempt: Use ImageService if available
    if (window.ImageService && typeof window.ImageService.getProductImage === 'function') {
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return window.ImageService.getProductImage(product.images[0]);
        } else if (product.image) {
            return window.ImageService.getProductImage(product.image);
        }
    }
    
    // Second attempt: Try to resolve image from product data
    if (product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
        imageUrl = product.images[0];
    } else if (product.image && typeof product.image === 'string') {
        imageUrl = product.image;
    } else {
        // No image found, use placeholder
        return getBestPlaceholderImage();
    }
    
    // Check if the image URL is relative and add API URL if needed
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:') && !imageUrl.startsWith('/')) {
        imageUrl = `${adminApiUrl}/${imageUrl}`;
    }
    
    return imageUrl;
}

// Extract the product display logic to a separate function
function displayProducts(products, tableBody) {
    // Clear table body
    tableBody.innerHTML = '';
    
    // Sort products by newest first
    products.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
    });
    
    // Add products to table
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Safely get product ID
        const productId = product._id || product.id || '';
        
        // Get product image with consistent placeholder fallback
        const imageUrl = getProductImageUrl(product);
        
        // Format price with fallback for missing price
        const price = typeof product.price === 'number' ? product.price : 
                     (typeof product.price === 'string' ? parseFloat(product.price) : 0);
                     
        const formattedPrice = price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        row.innerHTML = `
        <td class="product-cell">
            <div class="product-info">
                <img src="${imageUrl}" alt="${product.name}" onerror="handleImageError(this)">
                <span>${product.name}</span>
            </div>
        </td>
        <td>${product.sku || '-'}</td>
        <td>${product.category || '-'}</td>
        <td>₺${formattedPrice}</td>
        <td>${product.stock}</td>
        <td><span class="status-badge ${product.status === 'inactive' ? 'inactive' : product.stock > 0 ? 'active' : 'out-of-stock'}">${product.status === 'inactive' ? 'Pasif' : product.stock > 0 ? 'Aktif' : 'Stokta Yok'}</span></td>
        <td class="actions-cell">
            <button class="action-btn view-btn" data-id="${productId}" title="Görüntüle">
                <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn edit-btn" data-id="${productId}" title="Düzenle">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${productId}" title="Sil">
                <i class="fas fa-trash"></i>
            </button>
        </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addProductActionListeners();
    
    // Add search functionality
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = tableBody.querySelectorAll('tr');
            
            rows.forEach(row => {
                const productName = row.querySelector('.product-info span')?.textContent.toLowerCase() || '';
                const sku = row.cells[1]?.textContent.toLowerCase() || '';
                const category = row.cells[2]?.textContent.toLowerCase() || '';
                
                if (productName.includes(searchTerm) || sku.includes(searchTerm) || category.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

// Add product action listeners
function addProductActionListeners() {
    // View product
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            viewProduct(productId);
        });
    });
    
    // Edit product
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    // Delete product
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            confirmDeleteProduct(productId);
        });
    });
}

// View product
function viewProduct(productId) {
    // Fetch product details
    fetchWithCORS(`admin/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(product => {
        // Create modal with product details
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        // Format price
        const formattedPrice = product.price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Create product image gallery
        let imageGallery = '';
        if (product.images && product.images.length > 0) {
            imageGallery = `
                <div class="product-gallery">
                    ${product.images.map(image => {
                        // Use our consistent image loading function
                        const imageUrl = typeof image === 'string' ? getProductImageUrl({image}) : getBestPlaceholderImage();
                        return `<img src="${imageUrl}" alt="${product.name}" onerror="handleImageError(this)">`;
                    }).join('')}
                </div>
            `;
        } else if (product.image) {
            // Single image case
            const imageUrl = getProductImageUrl(product);
            imageGallery = `
                <div class="product-gallery">
                    <img src="${imageUrl}" alt="${product.name}" onerror="handleImageError(this)">
                </div>
            `;
        } else {
            // No images case
            const placeholderUrl = getBestPlaceholderImage();
            imageGallery = `
                <div class="product-gallery">
                    <img src="${placeholderUrl}" alt="${product.name}">
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${product.name}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${imageGallery}
                    <div class="product-details">
                        <p><strong>SKU:</strong> ${product.sku || '-'}</p>
                        <p><strong>Kategori:</strong> ${product.category || '-'}</p>
                        <p><strong>Fiyat:</strong> ₺${formattedPrice}</p>
                        <p><strong>Stok:</strong> ${product.stock || 0}</p>
                        <p><strong>Açıklama:</strong> ${product.description || '-'}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-btn">Kapat</button>
                    <button class="btn btn-primary edit-btn" data-id="${product._id || product.id}">Düzenle</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
        });
        
        modal.querySelector('.close-btn').addEventListener('click', () => {
                modal.remove();
        });
        
        modal.querySelector('.edit-btn').addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
                modal.remove();
            editProduct(productId);
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    })
    .catch(error => {
        console.error('Error fetching product details:', error);
        showNotification('Ürün detayları yüklenirken bir hata oluştu.', 'error');
    });
}

// Edit product
function editProduct(productId) {
    // Fetch product details
    fetchWithCORS(`admin/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(product => {
        // Create modal with product details in a form
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        // Get product image with placeholder fallback
        const imageUrl = getProductImageUrl(product);
        
        // Create image preview
        const imagePreview = `
            <div class="image-preview">
                <img src="${imageUrl}" alt="${product.name}" onerror="handleImageError(this)">
            </div>
        `;
        
        // Format price
        const price = typeof product.price === 'number' ? product.price : 
                      (typeof product.price === 'string' ? parseFloat(product.price) : 0);
        
        const formattedPrice = price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Get product images as comma-separated string
        let imagesList = '';
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            imagesList = product.images.join(', ');
        } else if (product.image && typeof product.image === 'string') {
            imagesList = product.image;
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Ürün Düzenle</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editProductForm">
                        ${imagePreview}
                        <div class="form-row">
                            <div class="form-group">
                                <label for="name">Ürün Adı *</label>
                                <input type="text" id="name" name="name" value="${product.name || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="sku">SKU</label>
                                <input type="text" id="sku" name="sku" value="${product.sku || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="category">Kategori *</label>
                                <select id="category" name="category" required>
                                    <option value="men" ${product.category === 'men' ? 'selected' : ''}>Erkek</option>
                                    <option value="women" ${product.category === 'women' ? 'selected' : ''}>Kadın</option>
                                    <option value="accessories" ${product.category === 'accessories' ? 'selected' : ''}>Aksesuar</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="price">Fiyat (₺) *</label>
                                <input type="number" id="price" name="price" value="${price}" min="0" step="0.01" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="stock">Stok</label>
                                <input type="number" id="stock" name="stock" value="${product.stock || 0}" min="0">
                            </div>
                            <div class="form-group">
                                <label for="status">Durum</label>
                                <select id="status" name="status">
                                    <option value="active" ${product.status !== 'inactive' ? 'selected' : ''}>Aktif</option>
                                    <option value="inactive" ${product.status === 'inactive' ? 'selected' : ''}>Pasif</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="description">Açıklama *</label>
                            <textarea id="description" name="description" rows="4" required>${product.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="images">Resim URL'leri (virgülle ayırın)</label>
                            <textarea id="images" name="images" rows="2">${imagesList}</textarea>
                            <small>Birden fazla resim URL'sini virgül ile ayırın. Boş bırakmak, varsayılan resmi kullanacaktır.</small>
                        </div>
                        <div class="form-row checkbox-row">
                            <div class="form-group">
                                <label class="checkbox-container">
                                    <input type="checkbox" id="featured" name="featured" ${product.featured ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Öne Çıkan Ürün
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">İptal</button>
                    <button class="btn btn-primary update-product-btn">Güncelle</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal on close button click
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Close modal on cancel button click
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Update product on button click
        modal.querySelector('.update-product-btn').addEventListener('click', () => {
            // Get form data
            const form = document.getElementById('editProductForm');
            const formData = new FormData(form);
            const productData = {};
            
            // Convert FormData to object
            for (const [key, value] of formData.entries()) {
                if (key === 'featured') {
                    productData[key] = true;
                } else if (key === 'images') {
                    productData[key] = value.split(',').map(url => url.trim()).filter(url => url !== '');
                } else {
                    productData[key] = value;
                }
            }
            
            // If featured checkbox is not checked, set it to false
            if (!formData.has('featured')) {
                productData.featured = false;
            }
            
            // Update product
            updateProduct(productId, productData, modal);
        });
        
        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching product for edit:', error);
        showNotification('Ürün bilgileri yüklenirken bir hata oluştu.', 'error');
    });
}

// Update product with improved error handling
async function updateProduct(productId, productData, modal) {
    // Validation for required fields
    const requiredFields = ['name', 'price', 'category', 'description'];
    const missingFields = requiredFields.filter(field => !productData[field] || (productData[field].trim && productData[field].trim() === ''));
    
    if (missingFields.length > 0) {
        const fieldNames = {
            name: 'Ürün Adı',
            price: 'Fiyat',
            category: 'Kategori',
            description: 'Açıklama'
        };
        
        const errorMessage = `Lütfen şu alanları doldurun: ${missingFields.map(field => fieldNames[field] || field).join(', ')}`;
        
        // Show error in modal
        if (modal) {
            const form = modal.querySelector('form');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = errorMessage;
            
            // Remove existing error if any
            const existingError = form.querySelector('.form-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Add error message to form
            form.prepend(errorDiv);
            
            // Highlight missing fields
            missingFields.forEach(field => {
                const input = form.querySelector(`[name="${field}"]`);
                if (input) {
                    input.classList.add('error');
                    input.addEventListener('input', function() {
                        this.classList.remove('error');
                    }, { once: true });
                }
            });
        }
        
        showNotification(errorMessage, 'error');
        return;
    }
    
    // Convert price to number
    if (productData.price) {
        productData.price = parseFloat(productData.price);
        
        // Validate price is a valid number
        if (isNaN(productData.price) || productData.price < 0) {
            const errorMessage = 'Fiyat geçerli bir pozitif sayı olmalıdır.';
            
            // Show error in modal
            if (modal) {
                const form = modal.querySelector('form');
                const priceInput = form.querySelector('[name="price"]');
                priceInput.classList.add('error');
                
                const errorDiv = document.createElement('div');
                errorDiv.className = 'form-error';
                errorDiv.textContent = errorMessage;
                
                // Remove existing error if any
                const existingError = form.querySelector('.form-error');
                if (existingError) {
                    existingError.remove();
                }
                
                // Add error message to form
                form.prepend(errorDiv);
            }
            
            showNotification(errorMessage, 'error');
            return;
        }
    }
    
    // Convert stock to number
    if (productData.stock) {
        productData.stock = parseInt(productData.stock, 10);
        
        // Validate stock is a valid number
        if (isNaN(productData.stock) || productData.stock < 0) {
            productData.stock = 0;
        }
    }
    
    // Disable the update button and show loading state
    if (modal) {
        const updateButton = modal.querySelector('.update-product-btn');
        updateButton.disabled = true;
        updateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Güncelleniyor...';
    }
    
    try {
        // Add timestamp for update
        productData.updatedAt = new Date().toISOString();
        
        console.log('Updating product with data:', productData);
        
        // Track retry attempts
        let retryCount = 0;
        const maxRetries = 2;
        
        async function attemptUpdate() {
            try {
                console.log(`Updating product ${productId}, attempt: ${retryCount + 1}`);
                
                // Make API request to update product
                const response = await fetchWithCORS(`products/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(productData),
                    signal: AbortSignal.timeout(15000) // 15 second timeout
                });
                
                console.log('Update product API response:', response);
                
                // Check for successful response
                let success = false;
                let message = '';
                
                if (response && (response.success === true || response._id || response.id)) {
                    success = true;
                    message = response.message || 'Ürün başarıyla güncellendi.';
                } else if (response && response.error) {
                    message = response.error;
                    throw new Error(message);
                } else {
                    message = 'Ürün güncellenirken bir hata oluştu.';
                    throw new Error(message);
                }
                
                // Close modal
                if (modal) {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                }
                
                // Show success notification
                showNotification(message, 'success');
                
                // Reload products
                loadProducts();
                
                return true;
            } catch (error) {
                console.error(`Error updating product (attempt ${retryCount + 1}):`, error);
                
                if (retryCount < maxRetries) {
                    retryCount++;
                    
                    // Update button state if modal exists
                    if (modal) {
                        const updateButton = modal.querySelector('.update-product-btn');
                        if (updateButton) {
                            updateButton.innerHTML = `<i class="fas fa-sync fa-spin"></i> Tekrar deneniyor (${retryCount}/${maxRetries})...`;
                        }
                        
                        // Add warning message to form
                        const form = modal.querySelector('form');
                        if (form) {
                            const warningDiv = document.createElement('div');
                            warningDiv.className = 'form-warning';
                            warningDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Bağlantı hatası, tekrar deneniyor...`;
                            
                            // Remove existing warning if any
                            const existingWarning = form.querySelector('.form-warning');
                            if (existingWarning) {
                                existingWarning.remove();
                            }
                            
                            form.prepend(warningDiv);
                        }
                    }
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                    
                    // Try again
                    return attemptUpdate();
                }
                
                // Show error notification after max retries
                showNotification(`Ürün güncellenirken bir hata oluştu: ${error.message}`, 'error');
                
                // Reset button state
                if (modal) {
                    const updateButton = modal.querySelector('.update-product-btn');
                    if (updateButton) {
                        updateButton.disabled = false;
                        updateButton.innerHTML = 'Güncelle';
                    }
                    
                    // Add error message to modal
                    const form = modal.querySelector('form');
                    if (form) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'form-error';
                        errorDiv.innerHTML = `
                            <p>Sunucu hatası, lütfen tekrar deneyin.</p>
                            <small>${error.message}</small>
                        `;
                        
                        // Remove existing error if any
                        const existingError = form.querySelector('.form-error');
                        if (existingError) {
                            existingError.remove();
                        }
                        
                        // Add error message to form
                        form.prepend(errorDiv);
                    }
                }
                
                throw error;
            }
        }
        
        // Start the update attempt
        return await attemptUpdate();
    } catch (error) {
        console.error('Failed to update product:', error);
        return false;
    }
}

// Setup Add Product button
function setupAddProductButton() {
    const addProductBtn = document.getElementById('addProductBtn');
    if (!addProductBtn) return;
    
    addProductBtn.addEventListener('click', () => {
        // Create modal with product form
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        // Get placeholder image for preview
        const placeholderUrl = getBestPlaceholderImage();
        
        // Create image preview
        const imagePreview = `
            <div class="image-preview">
                <img src="${placeholderUrl}" alt="Yeni Ürün">
                <div class="preview-overlay">
                    <i class="fas fa-image"></i>
                    <span>Resim URL girin</span>
                </div>
            </div>
        `;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Yeni Ürün Ekle</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addProductForm">
                        ${imagePreview}
                        <div class="form-row">
                            <div class="form-group">
                                <label for="name">Ürün Adı *</label>
                                <input type="text" id="name" name="name" required>
                            </div>
                            <div class="form-group">
                                <label for="sku">SKU</label>
                                <input type="text" id="sku" name="sku">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="category">Kategori *</label>
                                <select id="category" name="category" required>
                                    <option value="">Kategori Seçin</option>
                                    <option value="men">Erkek</option>
                                    <option value="women">Kadın</option>
                                    <option value="accessories">Aksesuar</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="price">Fiyat (₺) *</label>
                                <input type="number" id="price" name="price" min="0" step="0.01" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="stock">Stok</label>
                                <input type="number" id="stock" name="stock" value="0" min="0">
                            </div>
                            <div class="form-group">
                                <label for="status">Durum</label>
                                <select id="status" name="status">
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Pasif</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="description">Açıklama *</label>
                            <textarea id="description" name="description" rows="4" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="images">Resim URL'leri (virgülle ayırın)</label>
                            <textarea id="images" name="images" rows="2"></textarea>
                            <small>Birden fazla resim URL'sini virgül ile ayırın. Boş bırakmak, varsayılan resmi kullanacaktır.</small>
                        </div>
                        <div class="form-row checkbox-row">
                            <div class="form-group">
                                <label class="checkbox-container">
                                    <input type="checkbox" id="featured" name="featured" value="true">
                                    <span class="checkmark"></span>
                                    Öne Çıkan Ürün
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">İptal</button>
                    <button class="btn btn-primary add-new-product-btn">Ekle</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Update image preview when image URL changes
        const imagesInput = modal.querySelector('#images');
        const previewImg = modal.querySelector('.image-preview img');
        const previewOverlay = modal.querySelector('.preview-overlay');
        
        imagesInput.addEventListener('input', function() {
            const imageUrls = this.value.split(',').map(url => url.trim()).filter(url => url !== '');
            if (imageUrls.length > 0) {
                previewImg.src = imageUrls[0];
                previewOverlay.style.display = 'none';
            } else {
                previewImg.src = placeholderUrl;
                previewOverlay.style.display = 'flex';
            }
        });
        
        // Handle image loading errors
        previewImg.addEventListener('error', function() {
            this.src = placeholderUrl;
            previewOverlay.style.display = 'flex';
            previewOverlay.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Geçersiz resim URL\'si</span>';
        });
        
        // Close modal on close button click
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Close modal on cancel button click
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Add button click
        modal.querySelector('.add-new-product-btn').addEventListener('click', () => {
            const form = document.getElementById('addProductForm');
            const formData = new FormData(form);
            const productData = {};
            
            // Convert FormData to object
            for (const [key, value] of formData.entries()) {
                if (key === 'featured') {
                    productData[key] = value === 'true';
                } else if (key === 'images') {
                    productData[key] = value.split(',').map(url => url.trim()).filter(url => url !== '');
                } else {
                    productData[key] = value;
                }
            }
            
            // Create product
            createProduct(productData, modal);
        });
        
        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
    });
}

// Create product with improved validation and error handling
async function createProduct(productData, modal) {
    // Validation for required fields
    const requiredFields = ['name', 'price', 'category', 'description'];
    const missingFields = requiredFields.filter(field => !productData[field] || productData[field].trim && productData[field].trim() === '');
    
    if (missingFields.length > 0) {
        const fieldNames = {
            name: 'Ürün Adı',
            price: 'Fiyat',
            category: 'Kategori',
            description: 'Açıklama'
        };
        
        // Create error message with missing fields
        const errorMessage = `Lütfen şu alanları doldurun: ${missingFields.map(field => fieldNames[field] || field).join(', ')}`;
        
        // Show error in modal if exists
        if (modal) {
            const form = modal.querySelector('form');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = errorMessage;
            
            // Remove existing error if any
            const existingError = form.querySelector('.form-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Add error message to form
            form.prepend(errorDiv);
            
            // Highlight missing fields
            missingFields.forEach(field => {
                const input = form.querySelector(`[name="${field}"]`);
                if (input) {
                    input.classList.add('error');
                    input.addEventListener('input', function() {
                        this.classList.remove('error');
                    }, { once: true });
                }
            });
            
            // Enable button if disabled
            const addButton = modal.querySelector('.add-new-product-btn');
            if (addButton) {
                addButton.disabled = false;
                addButton.innerHTML = 'Ekle';
            }
        }
        
        showNotification(errorMessage, 'error');
        return;
    }
    
    // Validate price is a number
    if (isNaN(parseFloat(productData.price))) {
        showNotification('Fiyat geçerli bir sayı olmalıdır.', 'error');
        
        // Highlight price field
        if (modal) {
            const priceInput = modal.querySelector('[name="price"]');
            if (priceInput) {
                priceInput.classList.add('error');
                priceInput.addEventListener('input', function() {
                    this.classList.remove('error');
                }, { once: true });
            }
        }
        
        return;
    }
    
    // Disable the button and show loading state
    if (modal) {
        const addButton = modal.querySelector('.add-new-product-btn');
        if (addButton) {
            addButton.disabled = true;
            addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ekleniyor...';
        }
    }
    
    try {
        // Convert price to number
        productData.price = parseFloat(productData.price);
        
        // Convert stock to number if exists
        if (productData.stock) {
            productData.stock = parseInt(productData.stock, 10) || 0;
        }
        
        // Convert featured to boolean if exists
        if (productData.featured) {
            productData.featured = productData.featured === 'true' || productData.featured === true;
        }
        
        // Set status active/inactive
        if (!productData.status) {
            productData.status = 'active';
        }
        
        // Add timestamps
        productData.createdAt = new Date().toISOString();
        productData.updatedAt = new Date().toISOString();
        
        console.log('Sending product data to server:', productData);
        
        // Track retry attempts
        let retryCount = 0;
        const maxRetries = 2;
        
        async function attemptCreate() {
            try {
                console.log(`Creating product, attempt: ${retryCount + 1}`);
                
                const response = await fetchWithCORS('products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(productData),
                    signal: AbortSignal.timeout(15000) // 15 second timeout
                });
                
                console.log('API response for product creation:', response);
                
                // Check different response formats
                let success = false;
                let message = '';
                let createdProduct = null;
                
                if (response && response.success === true) {
                    success = true;
                    message = response.message || 'Ürün başarıyla eklendi.';
                    createdProduct = response.data || response.product || null;
                } else if (response && (response._id || response.id)) {
                    // Direct product response
                    success = true;
                    message = 'Ürün başarıyla eklendi.';
                    createdProduct = response;
                } else if (response && response.product) {
                    // Product in response.product
                    success = true;
                    message = 'Ürün başarıyla eklendi.';
                    createdProduct = response.product;
                } else if (response && response.error) {
                    // Error in response
                    success = false;
                    message = response.error || 'Ürün eklenirken bir hata oluştu.';
                    throw new Error(message);
                } else {
                    // Unknown format
                    console.error('Unknown API response format:', response);
                    success = false;
                    message = 'Ürün eklenirken beklenmeyen bir cevap alındı.';
                    throw new Error(message);
                }
                
                // Close modal
                if (modal) {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                }
                
                // Show success notification
                showNotification(message, 'success');
                
                // Reload products
                loadProducts();
                
                return true;
            } catch (error) {
                console.error(`Error creating product (attempt ${retryCount + 1}):`, error);
                
                if (retryCount < maxRetries) {
                    retryCount++;
                    
                    // Update button state if modal exists
                    if (modal) {
                        const addButton = modal.querySelector('.add-new-product-btn');
                        if (addButton) {
                            addButton.innerHTML = `<i class="fas fa-sync fa-spin"></i> Tekrar deneniyor (${retryCount}/${maxRetries})...`;
                        }
                    }
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                    
                    // Try again
                    return attemptCreate();
                }
                
                // Show error notification after max retries
                showNotification(`Ürün eklenirken bir hata oluştu: ${error.message}`, 'error');
                
                // Reset button state
                if (modal) {
                    const addButton = modal.querySelector('.add-new-product-btn');
                    if (addButton) {
                        addButton.disabled = false;
                        addButton.innerHTML = 'Ekle';
                    }
                    
                    // Add error message to modal
                    const form = modal.querySelector('form');
                    if (form) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'form-error';
                        errorDiv.innerHTML = `
                            <p>Sunucu hatası, lütfen tekrar deneyin.</p>
                            <small>${error.message}</small>
                        `;
                        
                        // Remove existing error if any
                        const existingError = form.querySelector('.form-error');
                        if (existingError) {
                            existingError.remove();
                        }
                        
                        // Add error message to form
                        form.prepend(errorDiv);
                    }
                }
                
                throw error;
            }
        }
        
        // Start the creation attempt
        return await attemptCreate();
    } catch (error) {
        console.error('Failed to create product:', error);
        return false;
    }
}

// Confirm delete product
function confirmDeleteProduct(productId) {
    // Fetch product details first to show what's being deleted
    fetchWithCORS(`admin/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(product => {
        // Create confirmation modal
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        // Get product image for preview
        const imageUrl = getProductImageUrl(product);
        
        // Create product preview
        const productPreview = `
            <div class="delete-product-preview">
                <img src="${imageUrl}" alt="${product.name}" onerror="handleImageError(this)">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>SKU: ${product.sku || '-'}</p>
                    <p>Kategori: ${product.category || '-'}</p>
                    <p>Fiyat: ₺${typeof product.price === 'number' ? product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0,00'}</p>
                </div>
            </div>
        `;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Ürünü Sil</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="delete-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </p>
                    ${productPreview}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">İptal</button>
                    <button class="btn btn-danger confirm-btn">
                        <i class="fas fa-trash"></i> Evet, Sil
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal on close button click
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Close modal on cancel button click
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Delete product on confirm button click
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            // Disable button and show loading state
            const confirmBtn = modal.querySelector('.confirm-btn');
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Siliniyor...';
            
            // Delete product
            deleteProduct(productId, modal);
        });
        
        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching product for delete:', error);
        
        // If can't fetch product, just show a simple confirmation dialog
        if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            deleteProduct(productId);
        }
    });
}

// Delete product with improved error handling and retry logic
async function deleteProduct(productId, modal) {
    // Track retry attempts
    let retryCount = 0;
    const maxRetries = 2;
    
    async function attemptDelete() {
        try {
            console.log(`Deleting product ${productId}, attempt: ${retryCount + 1}`);
            
            // Make API request to delete the product
            const response = await fetchWithCORS(`products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });
            
            console.log('Delete product API response:', response);
            
            // Check different response formats for success
            let success = false;
            
            if (response && response.success === true) {
                success = true;
            } else if (response && response.message && response.message.includes('success')) {
                success = true;
            } else if (response && response.status && (response.status === 'success' || response.status === 200)) {
                success = true;
            } else if (response === null || response === '') {
                // Some APIs return empty response on successful delete
                success = true;
            }
            
            // Close modal if it exists
            if (modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
            
            if (success) {
                // Show success notification
                showNotification('Ürün başarıyla silindi.', 'success');
                
                // Reload products
                loadProducts();
                
                return true;
            } else {
                throw new Error('API returned unsuccessful response');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            
            // Retry logic
            if (retryCount < maxRetries) {
                retryCount++;
                
                // Update modal if it exists
                if (modal) {
                    const confirmBtn = modal.querySelector('.confirm-btn');
                    if (confirmBtn) {
                        confirmBtn.innerHTML = `<i class="fas fa-sync fa-spin"></i> Tekrar deneniyor (${retryCount}/${maxRetries})...`;
                    }
                    
                    // Add warning message to modal
                    const modalBody = modal.querySelector('.modal-body');
                    if (modalBody) {
                        const warningElement = document.createElement('p');
                        warningElement.className = 'warning-text';
                        warningElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Bağlantı hatası, tekrar deneniyor...`;
                        
                        // Remove existing warning if any
                        const existingWarning = modalBody.querySelector('.warning-text');
                        if (existingWarning) {
                            existingWarning.remove();
                        }
                        
                        modalBody.appendChild(warningElement);
                    }
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                
                // Try again
                return attemptDelete();
            }
            
            // Show error notification after max retries
            showNotification(`Ürün silinirken bir hata oluştu: ${error.message}`, 'error');
            
            // Update modal if it exists after max retries
            if (modal) {
                const confirmBtn = modal.querySelector('.confirm-btn');
                if (confirmBtn) {
                    confirmBtn.innerHTML = 'Evet, Sil';
                    confirmBtn.disabled = false;
                }
                
                // Add error message to modal
                const modalBody = modal.querySelector('.modal-body');
                if (modalBody) {
                    const errorElement = document.createElement('div');
                    errorElement.className = 'form-error';
                    errorElement.innerHTML = `
                        <p>Silme işlemi başarısız oldu. Lütfen tekrar deneyin.</p>
                        <small>${error.message}</small>
                    `;
                    
                    // Remove existing error if any
                    const existingError = modalBody.querySelector('.form-error');
                    if (existingError) {
                        existingError.remove();
                    }
                    
                    modalBody.appendChild(errorElement);
                    
                    // Add retry button
                    const retryBtn = document.createElement('button');
                    retryBtn.className = 'btn btn-primary';
                    retryBtn.innerHTML = '<i class="fas fa-sync"></i> Tekrar Dene';
                    retryBtn.style.marginTop = '10px';
                    retryBtn.style.marginRight = '10px';
                    
                    const modalFooter = modal.querySelector('.modal-footer');
                    
                    // Remove existing retry button if any
                    const existingRetryBtn = modalFooter.querySelector('button.btn-primary');
                    if (existingRetryBtn) {
                        existingRetryBtn.remove();
                    }
                    
                    modalFooter.prepend(retryBtn);
                    
                    retryBtn.addEventListener('click', () => {
                        // Reset retry count
                        retryCount = 0;
                        
                        // Remove error element
                        errorElement.remove();
                        
                        // Remove retry button
                        retryBtn.remove();
                        
                        // Disable confirm button and show loading state
                        confirmBtn.disabled = true;
                        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Siliniyor...';
                        
                        // Try again
                        attemptDelete();
                    });
                }
            }
            
            return false;
        }
    }
    
    // Start the delete attempt
    return attemptDelete();
}

// Load orders
async function loadOrders() {
    if (!checkAdminAuth()) return;
    
    // Show loading state
    const ordersTable = document.getElementById('ordersTable');
    const tableBody = ordersTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="6">Yükleniyor...</td></tr>';
    
    try {
        const response = await fetchWithCORS('admin/orders', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        // Ensure orders is an array
        const orders = Array.isArray(response) ? response : 
                      (response && response.orders ? response.orders : []);
            
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">Henüz sipariş bulunmamaktadır.</td></tr>';
            return;
        }
            
        tableBody.innerHTML = '';
            
        orders.forEach(order => {
            const row = document.createElement('tr');
                
            // Format date
            const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
            const formattedDate = orderDate.toLocaleDateString('tr-TR');
                
            // Format price
            const formattedTotal = typeof order.total === 'number' ? 
                order.total.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) : '0.00';
                
            // Get status badge class
            let statusClass = '';
            let statusText = '';
            
            switch(order.status) {
                case 'completed': 
                    statusClass = 'completed'; 
                    statusText = 'Tamamlandı'; 
                    break;
                case 'processing': 
                    statusClass = 'processing'; 
                    statusText = 'İşleniyor'; 
                    break;
                case 'shipped': 
                    statusClass = 'shipped'; 
                    statusText = 'Kargoya Verildi'; 
                    break;
                case 'cancelled': 
                    statusClass = 'cancelled'; 
                    statusText = 'İptal Edildi'; 
                    break;
                default: 
                    statusClass = 'processing';
                    statusText = 'İşleniyor';
            }
                
            row.innerHTML = `
                <td>${order.orderNumber || `#${order._id || order.id || 'N/A'}`}</td>
                <td>${order.customer && order.customer.name ? order.customer.name : 'Misafir'}</td>
                <td>${formattedDate}</td>
                <td>₺${formattedTotal}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="actions-cell">
                <button class="action-btn view-btn" data-id="${order._id || order.id}" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                <button class="action-btn edit-btn" data-id="${order._id || order.id}" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                <button class="action-btn print-btn" data-id="${order._id || order.id}" title="Yazdır">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            `;
                
            tableBody.appendChild(row);
        });
            
        // Add event listeners to action buttons
        addOrderActionListeners();
    } catch (error) {
        console.error('Error loading orders:', error);
        
        // Show error message in the table
        tableBody.innerHTML = '<tr><td colspan="6">Siparişler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</td></tr>';
        
        // Show notification
        showNotification('Sunucu bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.', 'error');
    }
}

// Load customers
async function loadCustomers() {
    if (!checkAdminAuth()) return;
    
    // Show loading state
    const customersTable = document.getElementById('customersTable');
    const tableBody = customersTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="6">Yükleniyor...</td></tr>';
    
    try {
        const response = await fetchWithCORS('admin/customers', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        // Ensure customers is an array
        const customers = Array.isArray(response) ? response : 
                         (response && response.customers ? response.customers : []);
            
        if (customers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">Henüz müşteri bulunmamaktadır.</td></tr>';
            return;
        }
            
        tableBody.innerHTML = '';
            
        customers.forEach(customer => {
            const row = document.createElement('tr');
                
            // Format date
            const registrationDate = customer.createdAt ? new Date(customer.createdAt) : new Date();
            const formattedDate = registrationDate.toLocaleDateString('tr-TR');
                
            row.innerHTML = `
                <td>${customer.name || 'İsimsiz'}</td>
                <td>${customer.email || '-'}</td>
                <td>${customer.phone || '-'}</td>
                <td>${formattedDate}</td>
                <td>${customer.orderCount || 0}</td>
                <td class="actions-cell">
                <button class="action-btn view-btn" data-id="${customer._id || customer.id}" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                <button class="action-btn edit-btn" data-id="${customer._id || customer.id}" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
                
            tableBody.appendChild(row);
        });
            
        // Add event listeners to action buttons
        addCustomerActionListeners();
    } catch (error) {
        console.error('Error loading customers:', error);
        
        // Show error message in the table
        tableBody.innerHTML = '<tr><td colspan="6">Müşteriler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</td></tr>';
        
        // Show notification
        showNotification('Sunucu bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.', 'error');
    }
}

// Add event listeners to customer action buttons
function addCustomerActionListeners() {
    // View customer
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.getAttribute('data-id');
            viewCustomer(customerId);
        });
    });
    
    // Edit customer
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.getAttribute('data-id');
            editCustomer(customerId);
        });
    });
}

// View customer details
function viewCustomer(customerId) {
    // Show customer details (to be implemented)
    showNotification(`Müşteri #${customerId} görüntüleniyor`);
}

// Edit customer
function editCustomer(customerId) {
    // Edit customer (to be implemented)
    showNotification(`Müşteri #${customerId} düzenleniyor`);
}

// Set up navigation between admin sections
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.admin-section');
    
    // Function to show a section and hide others
    function showSection(sectionId) {
        // Hide all sections
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show the selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Load section data if needed
            switch(sectionId) {
                case 'products':
                loadProducts();
                    break;
                case 'orders':
                loadOrders();
                    break;
                case 'customers':
                loadCustomers();
                    break;
                case 'settings':
                    // Load settings if needed
                    break;
            }
        }
        
        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
            
            // Update URL hash
        window.location.hash = sectionId;
    }
    
    // Add click event listeners to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });
    
    // Check URL hash on page load
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        showSection(sectionId);
    } else {
        // Default to dashboard
        showSection('dashboard');
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', function() {
        if (window.location.hash) {
            const sectionId = window.location.hash.substring(1);
            showSection(sectionId);
        }
    });
}

// Mobile sidebar functionality
function setupMobileSidebar() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const adminSidebar = document.getElementById('adminSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileSidebarClose = document.getElementById('mobileSidebarClose');
    
    function openMobileSidebar() {
        adminSidebar.classList.add('mobile-open');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMobileSidebar() {
        adminSidebar.classList.remove('mobile-open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (mobileMenuToggle && adminSidebar && sidebarOverlay) {
        mobileMenuToggle.addEventListener('click', openMobileSidebar);
        
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
        
        if (mobileSidebarClose) {
            mobileSidebarClose.addEventListener('click', closeMobileSidebar);
        }
        
        // Close sidebar when clicking on a menu item (mobile only)
        const navLinks = document.querySelectorAll('.admin-nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    closeMobileSidebar();
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && adminSidebar.classList.contains('mobile-open')) {
                closeMobileSidebar();
            }
        });
    }
}

// Search functionality
function setupSearch() {
    // Product search
    const productSearchInput = document.getElementById('productSearchInput');
    if (productSearchInput) {
        productSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#productsTable tbody tr');
            
            rows.forEach(row => {
                const productName = row.querySelector('.product-cell span')?.textContent.toLowerCase() || '';
                const sku = row.cells[1]?.textContent.toLowerCase() || '';
                const category = row.cells[2]?.textContent.toLowerCase() || '';
                
                if (productName.includes(searchTerm) || sku.includes(searchTerm) || category.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Order search
    const orderSearchInput = document.getElementById('orderSearchInput');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#ordersTable tbody tr');
            
            rows.forEach(row => {
                const orderNumber = row.cells[0]?.textContent.toLowerCase() || '';
                const customerName = row.cells[1]?.textContent.toLowerCase() || '';
                
                if (orderNumber.includes(searchTerm) || customerName.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Customer search
    const customerSearchInput = document.getElementById('customerSearchInput');
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('#customersTable tbody tr');
            
            rows.forEach(row => {
                const customerName = row.cells[0]?.textContent.toLowerCase() || '';
                const email = row.cells[1]?.textContent.toLowerCase() || '';
                const phone = row.cells[2]?.textContent.toLowerCase() || '';
                
                if (customerName.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

// Set up settings forms
function setupSettingsForms() {
    // General Settings Form
    const generalSettingsForm = document.getElementById('generalSettingsForm');
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                siteName: document.getElementById('siteName').value,
                siteDescription: document.getElementById('siteDescription').value,
                contactEmail: document.getElementById('contactEmail').value,
                contactPhone: document.getElementById('contactPhone').value
            };
            
            // Save to localStorage for demo purposes
            localStorage.setItem('generalSettings', JSON.stringify(formData));
            
            // Show success notification
            showNotification('Genel ayarlar başarıyla kaydedildi.');
        });
        
        // Load saved settings if available
        const savedGeneralSettings = localStorage.getItem('generalSettings');
        if (savedGeneralSettings) {
            const settings = JSON.parse(savedGeneralSettings);
            document.getElementById('siteName').value = settings.siteName || 'DnD Brand';
            document.getElementById('siteDescription').value = settings.siteDescription || 'DnD Brand - Moda ve Stil';
            document.getElementById('contactEmail').value = settings.contactEmail || 'info@dndbrand.com';
            document.getElementById('contactPhone').value = settings.contactPhone || '+90 555 123 4567';
        }
    }
    
    // API Settings Form
    const apiSettingsForm = document.getElementById('api-settings-form');
    if (apiSettingsForm) {
        apiSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                apiUrl: document.getElementById('apiUrl').value.trim(),
                corsEnabled: document.getElementById('corsEnabled').checked
            };
            
            // Save settings to localStorage
            localStorage.setItem('adminSettings', JSON.stringify({
                apiUrl: formData.apiUrl,
                corsEnabled: formData.corsEnabled
            }));
            
            // Update adminApiUrl variable
            if (formData.apiUrl) {
                adminApiUrl = formData.apiUrl;
                window.adminApiUrl = formData.apiUrl;
            }
            
            showNotification('API ayarları kaydedildi', 'success');
        });
        
        // Load saved settings
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            document.getElementById('apiUrl').value = settings.apiUrl || adminApiUrl;
            document.getElementById('corsEnabled').checked = settings.corsEnabled || false;
        } else {
            // Set default values
            document.getElementById('apiUrl').value = adminApiUrl;
            document.getElementById('corsEnabled').checked = true;
        }
    }
    
    // User Settings Form
    const userSettingsForm = document.getElementById('userSettingsForm');
    if (userSettingsForm) {
        userSettingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Basic validation
            if (newPassword && newPassword !== confirmPassword) {
                showNotification('Yeni şifre ve şifre tekrarı eşleşmiyor.', 'error');
                return;
            }
            
            // For demo purposes, only validate if current password is the demo password
            if (currentPassword && currentPassword !== 'admin123') {
                showNotification('Mevcut şifre yanlış.', 'error');
                return;
            }
            
            const formData = {
                adminName: document.getElementById('adminName').value,
                adminEmail: document.getElementById('adminEmail').value
            };
            
            // Save to localStorage for demo purposes
            localStorage.setItem('userSettings', JSON.stringify(formData));
            
            // Update admin name in the UI
            const adminNameElement = document.getElementById('adminName');
            if (adminNameElement) {
                adminNameElement.textContent = formData.adminName;
            }
            
            // Show success notification
            showNotification('Kullanıcı ayarları başarıyla kaydedildi.');
            
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        });
        
        // Load saved settings if available
        const savedUserSettings = localStorage.getItem('userSettings');
        if (savedUserSettings) {
            const settings = JSON.parse(savedUserSettings);
            document.getElementById('adminName').value = settings.adminName || 'Admin';
            document.getElementById('adminEmail').value = settings.adminEmail || 'admin@dndbrand.com';
        } else {
            // Try to get user data from session storage
            const adminUser = sessionStorage.getItem('adminUser');
            if (adminUser) {
                const userData = JSON.parse(adminUser);
                document.getElementById('adminName').value = userData.name || 'Admin';
                document.getElementById('adminEmail').value = userData.email || 'admin@dndbrand.com';
            }
        }
    }
}

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is authenticated
    if (!checkAdminAuth()) return;
    
    // Initialize dashboard
    initializeAdminDashboard();
    
    // Set up add product button
    setupAddProductButton();
    
    // Set up settings forms
    setupSettingsForms();
    
    console.log('Admin dashboard initialized');
}); 


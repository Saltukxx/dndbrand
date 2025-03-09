/**
 * DnD Brand E-commerce - Admin Dashboard Functionality
 * Comprehensive admin panel with product management, order tracking, and analytics
 */

// Default placeholder image URL (should be the same as in ImageService)
const DEFAULT_PLACEHOLDER_URL = 'https://dndbrand-server.onrender.com/api/uploads/image/placeholder-product.jpg';

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

// Helper function to make API requests with CORS handling
async function fetchWithCORS(endpoint, options = {}) {
    try {
        // Use CONFIG.fetchAPI if available
        if (window.CONFIG && typeof window.CONFIG.fetchAPI === 'function') {
            console.log('Using CONFIG.fetchAPI for endpoint:', endpoint);
            const fullEndpoint = endpoint.startsWith('http') ? endpoint : endpoint;
            
            // Add auth token to headers if present
            const headers = options.headers || {};
            
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
            },
            // Set credentials to omit to fix CORS issues
            credentials: 'omit'
        };
        
        // Try using the local proxy first
        try {
            const proxyUrl = window.location.origin + '/api-proxy/' + encodeURIComponent(url);
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
        
        // Try direct fetch as a backup
        const response = await fetch(url, fetchOptions);
        if (response.ok) {
            return await response.json();
        }
        
        // Handle non-200 responses
        console.error(`API request failed with status: ${response.status}`);
        throw new Error(`API request failed with status: ${response.status}`);
    } catch (error) {
        console.error('Error in fetchWithCORS:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}

// Check if admin is authenticated
function checkAdminAuth() {
    if (!sessionStorage.getItem('adminToken')) {
        // Don't redirect automatically if we're already on the login page
        if (!window.location.href.includes('admin-login.html')) {
            window.location.href = 'admin-login.html';
        }
        return false;
    }
    return true;
}

// Admin login function
async function loginAdmin(email, password) {
    try {
        // Try to login via server
        const loginData = await fetchWithCORS('admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (loginData && loginData.token) {
            // Store authentication data in session storage
            sessionStorage.setItem('adminToken', loginData.token);
            sessionStorage.setItem('adminAuthenticated', 'true');
            sessionStorage.setItem('adminName', loginData.user?.name || 'Admin');
            sessionStorage.setItem('adminEmail', email);
            
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
            
            return { success: true };
        } else {
            return { 
                success: false, 
                message: 'Invalid credentials. Please try again.'
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        
        return { 
            success: false, 
            message: 'Server error. Please try again later.'
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
    // Load dashboard data if elements exist
    if (document.getElementById('totalSales') || document.getElementById('totalOrders') || 
        document.getElementById('totalCustomers') || document.getElementById('totalProducts')) {
        loadDashboardStats();
    }
    
    // Only load recent orders if the element exists
    if (document.getElementById('recentOrdersList')) {
        loadRecentOrders();
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

// Load products with enhanced error handling and retry logic
async function loadProducts() {
    if (!checkAdminAuth()) return;
    
    // Show loading state
    const productsTable = document.getElementById('productsTable');
    const tableBody = productsTable.querySelector('tbody');
    tableBody.innerHTML = '<tr><td colspan="7"><div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Ürünler yükleniyor...</div></td></tr>';
    
    // Track retry attempts
    let retryCount = 0;
    const maxRetries = 3;
    
    async function attemptFetch() {
        try {
            console.log('Fetching products, attempt:', retryCount + 1);
            
            const response = await fetchWithCORS('products', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                // Add cache-busting parameter
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });
            
            console.log('Products API response:', response);
            
            // Handle different API response formats
            let products = [];
            
            if (Array.isArray(response)) {
                // Direct array response
                products = response;
            } else if (response && response.success && Array.isArray(response.data)) {
                // Success wrapper with data array
                products = response.data;
            } else if (response && response.products && Array.isArray(response.products)) {
                // Products container object
                products = response.products;
            } else if (response && typeof response === 'object') {
                // Object with multiple products as properties
                const possibleArrays = Object.values(response).filter(Array.isArray);
                if (possibleArrays.length > 0) {
                    // Take the longest array, which is likely the products
                    products = possibleArrays.reduce((a, b) => a.length > b.length ? a : b, []);
                }
            }
            
            console.log('Processed products:', products);
            
            if (!Array.isArray(products)) {
                console.error('Products is not an array:', products);
                throw new Error('Invalid products data format');
            }
            
            // Check if we have any products
            if (products.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="empty-state">
                                <i class="fas fa-box-open"></i>
                                <p>Henüz ürün bulunmamaktadır.</p>
                                <button id="addFirstProductBtn" class="btn btn-primary">
                                    <i class="fas fa-plus"></i> İlk Ürünü Ekle
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                
                // Add event listener to the add first product button
                const addFirstProductBtn = document.getElementById('addFirstProductBtn');
                if (addFirstProductBtn) {
                    addFirstProductBtn.addEventListener('click', function() {
                        const addProductBtn = document.getElementById('addProductBtn');
                        if (addProductBtn) {
                            addProductBtn.click();
                        }
                    });
                }
                
                return;
            }
            
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
                
                // Safely get image URL
                let imageUrl = DEFAULT_PLACEHOLDER_URL;
                
                // Use ImageService if available for consistent image handling
                if (window.ImageService && typeof window.ImageService.getProductImage === 'function') {
                    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                        imageUrl = window.ImageService.getProductImage(product.images[0]);
                    } else if (product.image) {
                        imageUrl = window.ImageService.getProductImage(product.image);
                    }
                } else {
                    // Fallback to the old method if ImageService is not available
                    if (product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
                        imageUrl = product.images[0];
                        
                        // Check if the image URL is relative and add API URL if needed
                        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('../')) {
                            imageUrl = `${adminApiUrl}/${imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl}`;
                        }
                    } else if (product.image && typeof product.image === 'string') {
                        imageUrl = product.image;
                        
                        // Check if the image URL is relative and add API URL if needed
                        if (!imageUrl.startsWith('http') && !imageUrl.startsWith('../')) {
                            imageUrl = `${adminApiUrl}/${imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl}`;
                        }
                    }
                }
                
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
                        <img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src=${DEFAULT_PLACEHOLDER_URL};">
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
                        const productName = row.querySelector('.product-info span').textContent.toLowerCase();
                        const category = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                        const sku = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                        
                        if (productName.includes(searchTerm) || category.includes(searchTerm) || sku.includes(searchTerm)) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                });
            }
            
        } catch (error) {
            console.error('Error loading products:', error);
            
            // Retry logic
            if (retryCount < maxRetries) {
                retryCount++;
                
                // Show retrying message
                tableBody.innerHTML = `<tr><td colspan="7"><div class="loading-spinner"><i class="fas fa-sync fa-spin"></i> Bağlantı hatası, yeniden deneniyor (${retryCount}/${maxRetries})...</div></td></tr>`;
                
                // Wait a bit longer between retries
                await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                
                // Try again
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
                    loadProducts();
                });
            }
            
            // Show notification
            showNotification('Sunucu bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.', 'error');
        }
    }
    
    // Start the fetch attempt
    await attemptFetch();
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
                        const imageUrl = window.ImageService && typeof window.ImageService.getProductImage === 'function' 
                            ? window.ImageService.getProductImage(image)
                            : image;
                        return `<img src="${imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src=${DEFAULT_PLACEHOLDER_URL};">`;
                    }).join('')}
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
        console.error('Error fetching product:', error);
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
        // Create modal with product form
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Ürün Düzenle</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-product-form">
                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="name">Ürün Adı</label>
                                <input type="text" id="name" name="name" value="${product.name}" required>
                            </div>
                            <div class="form-group col-6">
                                <label for="sku">SKU</label>
                                <input type="text" id="sku" name="sku" value="${product.sku || ''}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="category">Kategori</label>
                                <input type="text" id="category" name="category" value="${product.category || ''}">
                            </div>
                            <div class="form-group col-6">
                                <label for="price">Fiyat (₺)</label>
                                <input type="number" id="price" name="price" value="${product.price}" step="0.01" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="stock">Stok</label>
                                <input type="number" id="stock" name="stock" value="${product.stock || 0}" min="0" required>
                            </div>
                            <div class="form-group col-6">
                                <label for="status">Durum</label>
                                <select id="status" name="status">
                                    <option value="active" ${product.status === 'active' ? 'selected' : ''}>Aktif</option>
                                    <option value="draft" ${product.status === 'draft' ? 'selected' : ''}>Taslak</option>
                                    <option value="archived" ${product.status === 'archived' ? 'selected' : ''}>Arşivlenmiş</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="description">Açıklama</label>
                            <textarea id="description" name="description" rows="4">${product.description || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="images">Resim URL'leri (Her satıra bir URL)</label>
                            <textarea id="images" name="images" rows="3">${product.images ? product.images.join('\n') : ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-btn">İptal</button>
                    <button class="btn btn-danger delete-btn" data-id="${product._id || product.id}">Sil</button>
                    <button class="btn btn-primary save-btn">Kaydet</button>
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
        
        modal.querySelector('.delete-btn').addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            modal.remove();
            confirmDeleteProduct(productId);
        });
        
        modal.querySelector('.save-btn').addEventListener('click', function() {
            const form = document.getElementById('edit-product-form');
            
            // Get form data
            const productData = {
                name: form.name.value,
                sku: form.sku.value,
                category: form.category.value,
                price: parseFloat(form.price.value),
                stock: parseInt(form.stock.value),
                status: form.status.value,
                description: form.description.value,
                images: form.images.value.split('\n').filter(url => url.trim() !== '')
            };
            
            // Update product
            updateProduct(productId, productData, modal);
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                    modal.remove();
            }
        });
    })
    .catch(error => {
        console.error('Error fetching product:', error);
        showNotification('Ürün detayları yüklenirken bir hata oluştu.', 'error');
    });
}

// Update product
async function updateProduct(productId, productData, modal) {
    try {
        await fetchWithCORS(`products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
        });
            
            // Close modal
            if (modal) {
            modal.remove();
            }
            
            // Show success notification
            showNotification('Ürün başarıyla güncellendi.', 'success');
            
            // Reload products
            loadProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Ürün güncellenirken bir hata oluştu.', 'error');
    }
}

// Add product button functionality
function setupAddProductButton() {
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            // Create and show add product modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'addProductModal';
            
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Yeni Ürün Ekle</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addProductForm">
                            <div class="form-row">
                                <div class="form-group col-6">
                                    <label for="newProductName">Ürün Adı</label>
                                    <input type="text" id="newProductName" name="name" required>
                                </div>
                                <div class="form-group col-6">
                                    <label for="newProductPrice">Fiyat (₺)</label>
                                    <input type="number" id="newProductPrice" name="price" step="0.01" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group col-6">
                                    <label for="newProductCategory">Kategori</label>
                                    <select id="newProductCategory" name="category" required>
                                        <option value="men">Erkek</option>
                                        <option value="women">Kadın</option>
                                        <option value="accessories">Aksesuar</option>
                                    </select>
                                </div>
                                <div class="form-group col-6">
                                    <label for="newProductStock">Stok</label>
                                    <input type="number" id="newProductStock" name="stock" value="1" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group col-6">
                                    <label for="newProductStatus">Durum</label>
                                    <select id="newProductStatus" name="status" required>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Pasif</option>
                                    </select>
                                </div>
                                <div class="form-group col-6">
                                    <label for="newProductFeatured">Öne Çıkan</label>
                                    <select id="newProductFeatured" name="featured">
                                        <option value="false">Hayır</option>
                                        <option value="true">Evet</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="newProductDescription">Açıklama</label>
                                <textarea id="newProductDescription" name="description" rows="4" required></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="newProductImages">Ürün Görselleri (URL'leri virgülle ayırın)</label>
                                <textarea id="newProductImages" name="images" rows="2"></textarea>
                                <small>Görsel eklemek için URL'leri virgülle ayırarak girin</small>
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
            
            // Show modal
            setTimeout(() => {
                modal.style.display = 'flex';
            }, 10);
            
            // Close modal on close button click
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            });
            
            // Close modal on cancel button click
            modal.querySelector('.close-modal-btn').addEventListener('click', () => {
                modal.style.display = 'none';
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
                    modal.style.display = 'none';
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                }
            });
        });
    }
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
        if (productData.status === 'active') {
            productData.status = 'active';
        } else if (productData.status === 'inactive') {
            productData.status = 'inactive';
        }
        
        // Add timestamps
        productData.createdAt = new Date().toISOString();
        productData.updatedAt = new Date().toISOString();
        
        console.log('Sending product data:', productData);
        
        const response = await fetchWithCORS('products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
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
        } else if (response && response._id) {
            // Direct product response
            success = true;
            message = 'Ürün başarıyla eklendi.';
            createdProduct = response;
        } else if (response && response.id) {
            // Direct product response with id
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
        } else {
            // Unknown format
            console.error('Unknown API response format:', response);
            success = false;
            message = 'Ürün eklenirken beklenmeyen bir cevap alındı.';
        }
        
        // Close modal
        if (modal) {
            modal.remove();
        }
        
        if (success) {
            // Show success notification
            showNotification(message, 'success');
            
            // Reload products
            loadProducts();
            
            return true;
        } else {
            // Show error notification
            showNotification(message, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error creating product:', error);
        
        // Show error notification
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
                errorDiv.textContent = `Sunucu hatası: ${error.message}`;
                
                // Remove existing error if any
                const existingError = form.querySelector('.form-error');
                if (existingError) {
                    existingError.remove();
                }
                
                // Add error message to form
                form.prepend(errorDiv);
            }
        }
        
        return false;
    }
}

// Confirm delete product with improved UI
function confirmDeleteProduct(productId) {
    // Fetch product details first to show product name
    fetchWithCORS(`products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        // Get product name with fallback
        let productName = 'Bu ürünü';
        let productImage = DEFAULT_PLACEHOLDER_URL;
        
        // Handle different response formats
        if (response && response.name) {
            productName = response.name;
            
            if (response.images && response.images.length > 0) {
                productImage = response.images[0];
            } else if (response.image) {
                productImage = response.image;
            }
        } else if (response && response.data && response.data.name) {
            productName = response.data.name;
            
            if (response.data.images && response.data.images.length > 0) {
                productImage = response.data.images[0];
            } else if (response.data.image) {
                productImage = response.data.image;
            }
        }
        
        // Create and show confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'deleteProductModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Ürün Silmeyi Onayla</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="delete-product-info">
                        <img src="${productImage}" alt="${productName}" onerror="this.src=${DEFAULT_PLACEHOLDER_URL};">
                        <div class="delete-product-details">
                            <h3>${productName}</h3>
                            <p>Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">İptal</button>
                    <button class="btn btn-danger confirm-btn">Evet, Sil</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.style.display = 'flex';
        }, 10);
        
        // Close modal on close button click
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Close modal on cancel button click
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.style.display = 'none';
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
                modal.style.display = 'none';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching product details:', error);
        
        // Create and show generic confirmation modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'deleteProductModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Ürün Silmeyi Onayla</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">İptal</button>
                    <button class="btn btn-danger confirm-btn">Evet, Sil</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.style.display = 'flex';
        }, 10);
        
        // Close modal on close button click
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Close modal on cancel button click
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.style.display = 'none';
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
                modal.style.display = 'none';
                setTimeout(() => {
                    modal.remove();
                }, 300);
            }
        });
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
                modal.style.display = 'none';
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
                    modalBody.appendChild(errorElement);
                    
                    // Add retry button
                    const retryBtn = document.createElement('button');
                    retryBtn.className = 'btn btn-primary';
                    retryBtn.innerHTML = '<i class="fas fa-sync"></i> Tekrar Dene';
                    retryBtn.style.marginTop = '10px';
                    retryBtn.style.marginRight = '10px';
                    
                    const modalFooter = modal.querySelector('.modal-footer');
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

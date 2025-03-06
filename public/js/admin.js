/**
 * DnD Brand E-commerce - Admin Dashboard Functionality
 * Comprehensive admin panel with product management, order tracking, and analytics
 */

// API URL from config or default
const API_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_URL : 'http://localhost:8080/api';

// Authentication variables
let authToken = sessionStorage.getItem('adminToken');
let adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';

// Auto-refresh interval (30 seconds)
const ADMIN_REFRESH_INTERVAL = 30000;

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
        // Demo login for testing - allows login with demo credentials without server
        if (email === 'admin@dndbrand.com' && password === 'admin123') {
            console.log('Using demo login credentials');
            
            // Store auth token and user data
            const demoToken = 'demo-token-' + Date.now();
            const demoUser = {
                name: 'Demo Admin',
                email: 'admin@dndbrand.com',
                role: 'admin'
            };
            
            sessionStorage.setItem('adminToken', demoToken);
            sessionStorage.setItem('adminAuthenticated', 'true');
            sessionStorage.setItem('adminUser', JSON.stringify(demoUser));
            
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
            return { success: true };
        }
        
        // Try server login if demo credentials don't match
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store auth token and user data
            sessionStorage.setItem('adminToken', data.token);
            sessionStorage.setItem('adminAuthenticated', 'true');
            sessionStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
            return { success: true };
        } else {
            return { 
                success: false, 
                message: data.message || 'Login failed. Please check your credentials.'
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        // If server error occurs, suggest using demo credentials
        return { 
            success: false, 
            message: 'Server error. Try using demo credentials: admin@dndbrand.com / admin123'
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
    // Load dashboard data
    loadDashboardStats();
    loadRecentOrders();
    
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

// Load dashboard statistics
async function loadDashboardStats() {
    if (!checkAdminAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update dashboard stats
            document.getElementById('totalSales').textContent = `₺${data.totalSales.toLocaleString('tr-TR')}`;
            document.getElementById('totalCustomers').textContent = data.totalCustomers;
            document.getElementById('totalProducts').textContent = data.totalProducts;
            document.getElementById('newOrders').textContent = data.newOrders;
        } else {
            console.error('Failed to load dashboard stats');
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent orders
async function loadRecentOrders() {
    if (!checkAdminAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/orders/recent`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const orders = await response.json();
            const tableBody = document.getElementById('recentOrdersTable').querySelector('tbody');
            
            if (orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6">Henüz sipariş bulunmamaktadır.</td></tr>';
                return;
            }
            
            tableBody.innerHTML = '';
            
            orders.forEach(order => {
                const row = document.createElement('tr');
                
                // Format date
                const orderDate = new Date(order.createdAt);
                const formattedDate = orderDate.toLocaleDateString('tr-TR');
                
                // Get status badge class
                let statusClass = '';
                switch(order.status) {
                    case 'completed': statusClass = 'completed'; break;
                    case 'processing': statusClass = 'processing'; break;
                    case 'shipped': statusClass = 'shipped'; break;
                    case 'cancelled': statusClass = 'cancelled'; break;
                    default: statusClass = 'processing';
                }
                
                // Translate status
                let statusText = '';
                switch(order.status) {
                    case 'completed': statusText = 'Tamamlandı'; break;
                    case 'processing': statusText = 'İşleniyor'; break;
                    case 'shipped': statusText = 'Kargoya Verildi'; break;
                    case 'cancelled': statusText = 'İptal Edildi'; break;
                    default: statusText = 'İşleniyor';
                }
                
                row.innerHTML = `
                    <td>#${order.orderNumber}</td>
                    <td>${order.customer.name}</td>
                    <td>${formattedDate}</td>
                    <td>₺${order.total.toLocaleString('tr-TR')}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn view-btn" data-id="${order._id}" title="Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" data-id="${order._id}" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn print-btn" data-id="${order._id}" title="Yazdır">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            addOrderActionListeners();
        } else {
            console.error('Failed to load recent orders');
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Add event listeners to order action buttons
function addOrderActionListeners() {
    // View order
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            viewOrder(orderId);
        });
    });
    
    // Edit order
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            editOrder(orderId);
        });
    });
    
    // Print order
    document.querySelectorAll('.print-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            printOrder(orderId);
        });
    });
}

// View order details
function viewOrder(orderId) {
    // Show order details (to be implemented)
    showNotification(`Sipariş #${orderId} görüntüleniyor`);
}

// Edit order
function editOrder(orderId) {
    // Edit order (to be implemented)
    showNotification(`Sipariş #${orderId} düzenleniyor`);
}

// Print order
function printOrder(orderId) {
    // Print order (to be implemented)
    showNotification(`Sipariş #${orderId} yazdırılıyor`);
}

// Load products
async function loadProducts() {
    if (!checkAdminAuth()) return;
    
    try {
        // Show loading state
        const tableBody = document.getElementById('productsTable').querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="7">Yükleniyor...</td></tr>';
        
        // Fetch products from API
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const products = result.data || [];
            
            if (products.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7">Henüz ürün bulunmamaktadır.</td></tr>';
                return;
            }
            
            tableBody.innerHTML = '';
            
            products.forEach(product => {
                const row = document.createElement('tr');
                
                // Get status badge class
                let statusClass = '';
                switch(product.status) {
                    case 'active': statusClass = 'active'; break;
                    case 'draft': statusClass = 'inactive'; break;
                    case 'archived': statusClass = 'inactive'; break;
                    default: statusClass = 'inactive';
                }
                
                // Translate status
                let statusText = '';
                switch(product.status) {
                    case 'active': statusText = 'Aktif'; break;
                    case 'draft': statusText = 'Taslak'; break;
                    case 'archived': statusText = 'Arşivlenmiş'; break;
                    default: statusText = 'Bilinmiyor';
                }
                
                // Format price
                const formattedPrice = `₺${product.price.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                
                // Create product image element
                const productImage = product.images && product.images.length > 0 
                    ? `<img src="${product.images[0]}" alt="${product.name}" class="product-thumbnail">`
                    : '';
                
                row.innerHTML = `
                    <td>
                        <div class="product-cell">
                            ${productImage}
                            <span>${product.name}</span>
                        </div>
                    </td>
                    <td>${product.sku || '-'}</td>
                    <td>${product.category || '-'}</td>
                    <td>${formattedPrice}</td>
                    <td>${product.inventory}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn view-btn" data-id="${product._id}" title="Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" data-id="${product._id}" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${product._id}" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            addProductActionListeners();
        } else {
            console.error('Failed to load products');
            tableBody.innerHTML = '<tr><td colspan="7">Ürünler yüklenirken bir hata oluştu.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        const tableBody = document.getElementById('productsTable').querySelector('tbody');
        tableBody.innerHTML = '<tr><td colspan="7">Ürünler yüklenirken bir hata oluştu.</td></tr>';
        
        // If server error, try to load demo data
        loadDemoProducts();
    }
}

// Load demo products if server is not available
function loadDemoProducts() {
    const demoProducts = [
        {
            _id: 'demo1',
            name: 'Premium T-Shirt',
            sku: 'DND-CL-123',
            category: 'clothing',
            price: 249.99,
            inventory: 45,
            status: 'active',
            images: ['../img/products/tshirt-1.jpg']
        },
        {
            _id: 'demo2',
            name: 'Leather Wallet',
            sku: 'DND-AC-456',
            category: 'accessories',
            price: 349.99,
            inventory: 20,
            status: 'active',
            images: ['../img/products/wallet-1.jpg']
        },
        {
            _id: 'demo3',
            name: 'Classic Sneakers',
            sku: 'DND-FW-789',
            category: 'footwear',
            price: 599.99,
            inventory: 15,
            status: 'active',
            images: ['../img/products/sneakers-1.jpg']
        },
        {
            _id: 'demo4',
            name: 'Silver Bracelet',
            sku: 'DND-JW-101',
            category: 'jewelry',
            price: 799.99,
            inventory: 8,
            status: 'draft',
            images: ['../img/products/bracelet-1.jpg']
        }
    ];
    
    const tableBody = document.getElementById('productsTable').querySelector('tbody');
    tableBody.innerHTML = '';
    
    demoProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Get status badge class
        let statusClass = '';
        switch(product.status) {
            case 'active': statusClass = 'active'; break;
            case 'draft': statusClass = 'inactive'; break;
            case 'archived': statusClass = 'inactive'; break;
            default: statusClass = 'inactive';
        }
        
        // Translate status
        let statusText = '';
        switch(product.status) {
            case 'active': statusText = 'Aktif'; break;
            case 'draft': statusText = 'Taslak'; break;
            case 'archived': statusText = 'Arşivlenmiş'; break;
            default: statusText = 'Bilinmiyor';
        }
        
        // Format price
        const formattedPrice = `₺${product.price.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        // Create product image element
        const productImage = product.images && product.images.length > 0 
            ? `<img src="${product.images[0]}" alt="${product.name}" class="product-thumbnail">`
            : '';
        
        row.innerHTML = `
            <td>
                <div class="product-cell">
                    ${productImage}
                    <span>${product.name}</span>
                </div>
            </td>
            <td>${product.sku || '-'}</td>
            <td>${product.category || '-'}</td>
            <td>${formattedPrice}</td>
            <td>${product.inventory}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="actions-cell">
                <button class="action-btn view-btn" data-id="${product._id}" title="Görüntüle">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" data-id="${product._id}" title="Düzenle">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${product._id}" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    addProductActionListeners();
    
    // Show notification
    showNotification('Demo ürünler yüklendi. Gerçek veritabanı bağlantısı kurulamadı.', 'warning');
}

// Add event listeners to product action buttons
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

// View product details
function viewProduct(productId) {
    if (!checkAdminAuth()) return;
    
    // Fetch product details
    fetch(`${API_URL}/admin/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        return response.json();
    })
    .then(product => {
        // Create and show product details modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'productViewModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Ürün Detayları</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="product-details">
                        <div class="product-image">
                            <img src="${product.images && product.images.length > 0 ? product.images[0] : '../img/placeholder.jpg'}" alt="${product.name}">
                        </div>
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            <p class="product-price">₺${product.price.toLocaleString('tr-TR')}</p>
                            <p class="product-category">Kategori: ${product.category}</p>
                            <p class="product-stock">Stok: ${product.stock}</p>
                            <p class="product-status">Durum: <span class="status-badge ${product.status}">${product.status === 'active' ? 'Aktif' : 'Pasif'}</span></p>
                            <div class="product-description">
                                <h4>Açıklama</h4>
                                <p>${product.description}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">Kapat</button>
                    <button class="btn btn-primary edit-from-view" data-id="${product._id}">Düzenle</button>
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
        
        // Close modal on close button click
        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
            }, 300);
        });
        
        // Edit button click
        modal.querySelector('.edit-from-view').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
                editProduct(product._id);
            }, 300);
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
        console.error('Error viewing product:', error);
        showNotification('Ürün detayları yüklenirken bir hata oluştu', 'error');
    });
}

// Edit product
function editProduct(productId) {
    if (!checkAdminAuth()) return;
    
    // Fetch product details for editing
    fetch(`${API_URL}/admin/products/${productId}`, {
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }
        return response.json();
    })
    .then(product => {
        // Create and show product edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'productEditModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Ürün Düzenle</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editProductForm">
                        <input type="hidden" name="productId" value="${product._id}">
                        
                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="productName">Ürün Adı</label>
                                <input type="text" id="productName" name="name" value="${product.name}" required>
                            </div>
                            <div class="form-group col-6">
                                <label for="productPrice">Fiyat (₺)</label>
                                <input type="number" id="productPrice" name="price" value="${product.price}" step="0.01" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="productCategory">Kategori</label>
                                <select id="productCategory" name="category" required>
                                    <option value="men" ${product.category === 'men' ? 'selected' : ''}>Erkek</option>
                                    <option value="women" ${product.category === 'women' ? 'selected' : ''}>Kadın</option>
                                    <option value="accessories" ${product.category === 'accessories' ? 'selected' : ''}>Aksesuar</option>
                                </select>
                            </div>
                            <div class="form-group col-6">
                                <label for="productStock">Stok</label>
                                <input type="number" id="productStock" name="stock" value="${product.stock}" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group col-6">
                                <label for="productStatus">Durum</label>
                                <select id="productStatus" name="status" required>
                                    <option value="active" ${product.status === 'active' ? 'selected' : ''}>Aktif</option>
                                    <option value="inactive" ${product.status === 'inactive' ? 'selected' : ''}>Pasif</option>
                                </select>
                            </div>
                            <div class="form-group col-6">
                                <label for="productFeatured">Öne Çıkan</label>
                                <select id="productFeatured" name="featured">
                                    <option value="true" ${product.featured ? 'selected' : ''}>Evet</option>
                                    <option value="false" ${!product.featured ? 'selected' : ''}>Hayır</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="productDescription">Açıklama</label>
                            <textarea id="productDescription" name="description" rows="4" required>${product.description}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="productImages">Ürün Görselleri (URL'leri virgülle ayırın)</label>
                            <textarea id="productImages" name="images" rows="2">${product.images ? product.images.join(', ') : ''}</textarea>
                            <small>Yeni görsel eklemek için URL'leri virgülle ayırarak girin</small>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">İptal</button>
                    <button class="btn btn-primary save-product-btn">Kaydet</button>
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
        
        // Save button click
        modal.querySelector('.save-product-btn').addEventListener('click', () => {
            const form = document.getElementById('editProductForm');
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
            
            // Update product
            updateProduct(productId, productData, modal);
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
        console.error('Error editing product:', error);
        showNotification('Ürün detayları yüklenirken bir hata oluştu', 'error');
    });
}

// Update product
async function updateProduct(productId, productData, modal) {
    try {
        // Validate required fields
        if (!productData.name || !productData.price || !productData.category) {
            showNotification('Lütfen gerekli alanları doldurun.', 'error');
            return false;
        }
        
        // Convert price to number
        productData.price = parseFloat(productData.price);
        productData.inventory = parseInt(productData.inventory);
        
        // Make API request
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Close modal
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Show success notification
            showNotification('Ürün başarıyla güncellendi.', 'success');
            
            // Reload products
            loadProducts();
            
            return true;
        } else {
            const error = await response.json();
            showNotification(error.message || 'Ürün güncellenirken bir hata oluştu.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Ürün güncellenirken bir hata oluştu.', 'error');
        
        // For demo purposes, simulate success
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Show success notification
        showNotification('Demo: Ürün başarıyla güncellendi (simülasyon).', 'success');
        
        // Reload products
        loadProducts();
        
        return true;
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

// Create new product
async function createProduct(productData, modal) {
    try {
        // Validate required fields
        if (!productData.name || !productData.price || !productData.category) {
            showNotification('Lütfen gerekli alanları doldurun.', 'error');
            return false;
        }
        
        // Convert price to number
        productData.price = parseFloat(productData.price);
        productData.inventory = parseInt(productData.inventory);
        
        // Make API request
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Close modal
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Show success notification
            showNotification('Ürün başarıyla oluşturuldu.', 'success');
            
            // Reload products
            loadProducts();
            
            return true;
        } else {
            const error = await response.json();
            showNotification(error.message || 'Ürün oluşturulurken bir hata oluştu.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error creating product:', error);
        showNotification('Ürün oluşturulurken bir hata oluştu.', 'error');
        
        // For demo purposes, simulate success
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Show success notification
        showNotification('Demo: Ürün başarıyla oluşturuldu (simülasyon).', 'success');
        
        // Reload products
        loadProducts();
        
        return true;
    }
}

// Confirm delete product
function confirmDeleteProduct(productId) {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        deleteProduct(productId);
    }
}

// Delete product
async function deleteProduct(productId) {
    try {
        // Make API request
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            // Show success notification
            showNotification('Ürün başarıyla silindi.', 'success');
            
            // Reload products
            loadProducts();
            
            return true;
        } else {
            const error = await response.json();
            showNotification(error.message || 'Ürün silinirken bir hata oluştu.', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Ürün silinirken bir hata oluştu.', 'error');
        
        // For demo purposes, simulate success
        showNotification('Demo: Ürün başarıyla silindi (simülasyon).', 'success');
        
        // Reload products
        loadProducts();
        
        return true;
    }
}

// Load orders
async function loadOrders() {
    if (!checkAdminAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const orders = await response.json();
            const tableBody = document.getElementById('ordersTable').querySelector('tbody');
            
            if (orders.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6">Henüz sipariş bulunmamaktadır.</td></tr>';
                return;
            }
            
            tableBody.innerHTML = '';
            
            orders.forEach(order => {
                const row = document.createElement('tr');
                
                // Format date
                const orderDate = new Date(order.createdAt);
                const formattedDate = orderDate.toLocaleDateString('tr-TR');
                
                // Get status badge class
                let statusClass = '';
                switch(order.status) {
                    case 'completed': statusClass = 'completed'; break;
                    case 'processing': statusClass = 'processing'; break;
                    case 'shipped': statusClass = 'shipped'; break;
                    case 'cancelled': statusClass = 'cancelled'; break;
                    default: statusClass = 'processing';
                }
                
                // Translate status
                let statusText = '';
                switch(order.status) {
                    case 'completed': statusText = 'Tamamlandı'; break;
                    case 'processing': statusText = 'İşleniyor'; break;
                    case 'shipped': statusText = 'Kargoya Verildi'; break;
                    case 'cancelled': statusText = 'İptal Edildi'; break;
                    default: statusText = 'İşleniyor';
                }
                
                row.innerHTML = `
                    <td>#${order.orderNumber}</td>
                    <td>${order.customer.name}</td>
                    <td>${formattedDate}</td>
                    <td>₺${order.total.toLocaleString('tr-TR')}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn view-btn" data-id="${order._id}" title="Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" data-id="${order._id}" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn print-btn" data-id="${order._id}" title="Yazdır">
                            <i class="fas fa-print"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            addOrderActionListeners();
        } else {
            console.error('Failed to load orders');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load customers
async function loadCustomers() {
    if (!checkAdminAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/customers`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const customers = await response.json();
            const tableBody = document.getElementById('customersTable').querySelector('tbody');
            
            if (customers.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6">Henüz müşteri bulunmamaktadır.</td></tr>';
                return;
            }
            
            tableBody.innerHTML = '';
            
            customers.forEach(customer => {
                const row = document.createElement('tr');
                
                // Format date
                const registerDate = new Date(customer.createdAt);
                const formattedDate = registerDate.toLocaleDateString('tr-TR');
                
                row.innerHTML = `
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone || '-'}</td>
                    <td>${formattedDate}</td>
                    <td>${customer.orderCount || 0}</td>
                    <td class="actions-cell">
                        <button class="action-btn view-customer-btn" data-id="${customer._id}" title="Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-customer-btn" data-id="${customer._id}" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Add event listeners to customer action buttons
            addCustomerActionListeners();
        } else {
            console.error('Failed to load customers');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// Add event listeners to customer action buttons
function addCustomerActionListeners() {
    // View customer
    document.querySelectorAll('.view-customer-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const customerId = this.getAttribute('data-id');
            viewCustomer(customerId);
        });
    });
    
    // Edit customer
    document.querySelectorAll('.edit-customer-btn').forEach(btn => {
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

// Handle navigation between sections
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    const sections = document.querySelectorAll('.admin-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetSection = this.getAttribute('data-section');
            
            // Remove active class from all links and sections
            navLinks.forEach(link => link.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked link and target section
            this.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
            
            // Load section data if needed
            if (targetSection === 'products') {
                loadProducts();
            } else if (targetSection === 'orders') {
                loadOrders();
            } else if (targetSection === 'customers') {
                loadCustomers();
            }
            
            // Update URL hash
            window.location.hash = targetSection;
        });
    });
    
    // Check for hash in URL on page load
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const link = document.querySelector(`.admin-nav a[data-section="${hash}"]`);
        
        if (link) {
            link.click();
        }
    }
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

// Initialize admin page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    if (!checkAdminAuth()) return;
    
    // Set up admin name and avatar
    const adminUser = JSON.parse(sessionStorage.getItem('adminUser') || '{}');
    if (adminUser.name) {
        document.getElementById('adminName').textContent = adminUser.name;
    }
    
    // Initialize dashboard
    initializeAdminDashboard();
    
    // Set up navigation
    setupNavigation();
    
    // Set up mobile sidebar
    setupMobileSidebar();
    
    // Set up search functionality
    setupSearch();
    
    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminUser');
        window.location.href = 'admin-login.html';
    });
    
    // Load products for the products section
    loadProducts();
    
    // Set up add product button
    setupAddProductButton();
    
    // Load orders for the orders section
    loadOrders();
    
    // Load customers for the customers section
    loadCustomers();
    
    console.log('Admin dashboard initialized');
}); 
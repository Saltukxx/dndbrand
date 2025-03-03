/**
 * DnD Brand E-commerce - Admin Dashboard Functionality
 * Comprehensive admin panel with product management, order tracking, and analytics
 */

// API URL
const API_URL = 'http://localhost:5000/api';
let authToken = sessionStorage.getItem('adminToken');

// Check for admin authentication
function checkAdminAuth() {
    // Check if token exists in session storage
    const isAuthenticated = sessionStorage.getItem('adminToken');
    
    if (!isAuthenticated) {
        // Redirect to login page
        window.location.href = 'admin-login.html';
    }
}

// Login admin user
async function loginAdmin(email, password) {
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Save token to session storage
            sessionStorage.setItem('adminToken', data.token);
            sessionStorage.setItem('adminAuthenticated', 'true');
            sessionStorage.setItem('adminUser', JSON.stringify(data.user));
            
            // Set global auth token
            authToken = data.token;
            
            // Redirect to admin dashboard
            window.location.href = 'admin.html';
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Fetch products from API
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to fetch products');
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

// Create product
async function createProduct(productData) {
    try {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to create product');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

// Update product
async function updateProduct(productId, productData) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to update product');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

// Delete product
async function deleteProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            return true;
        } else {
            throw new Error(data.message || 'Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

// Upload product images
async function uploadProductImages(formData) {
    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data; // Array of image URLs
        } else {
            throw new Error(data.message || 'Failed to upload images');
        }
    } catch (error) {
        console.error('Error uploading images:', error);
        throw error;
    }
}

// Fetch customers from API
async function fetchCustomers() {
    try {
        const response = await fetch(`${API_URL}/customers`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to fetch customers');
        }
    } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
    }
}

// Fetch orders from API
async function fetchOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to fetch orders');
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// Update order status
async function updateOrderStatus(orderId, statusData) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(statusData)
        });

        const data = await response.json();

        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    // ======== ELEMENT SELECTORS ========
    const navLinks = document.querySelectorAll('.admin-nav a');
    const sections = document.querySelectorAll('.admin-section');
    const viewAllLinks = document.querySelectorAll('.view-all');
    const addProductBtn = document.querySelector('.add-product-btn');
    const productModal = document.getElementById('productModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const productForm = document.getElementById('productForm');
    const productSearch = document.querySelector('.product-search');
    const orderSearch = document.querySelector('.order-search');
    const statusFilters = document.querySelectorAll('.filter-select');
    const deleteProductBtns = document.querySelectorAll('.delete-product');
    const editProductBtns = document.querySelectorAll('.edit-product');
    const fileUpload = document.getElementById('productImages');
    const imagePreview = document.querySelector('.image-preview');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const deleteModal = document.getElementById('deleteModal');
    
    // ======== INITIALIZATION ========
    initializeAdminDashboard();
    
    function initializeAdminDashboard() {
        // Check authentication first
        checkAdminAuth();
        
        // Initialize product table with data from API
        initializeProductTable();
        
        // Initialize customer table with data from API
        initializeCustomerTable();
        
        // Initialize order table with data from API
        initializeOrderTable();
        
        // Initialize pagination
        initializePagination();
        
        // Show dashboard by default, hide other sections
        sections.forEach(section => {
            if (section.id !== 'dashboard') {
                section.style.display = 'none';
            }
        });
        
        // Initialize navigation
        navLinks.forEach(link => {
            link.addEventListener('click', handleNavigation);
        });
        
        // Initialize view all links
        viewAllLinks.forEach(link => {
            link.addEventListener('click', handleViewAll);
        });
        
        // Initialize product modal
        if (addProductBtn) {
            addProductBtn.addEventListener('click', openProductModal);
        }
        
        // Initialize close modal buttons
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Initialize product form
        if (productForm) {
            productForm.addEventListener('submit', handleProductSubmit);
        }
        
        // Initialize search functionality
        if (productSearch) {
            productSearch.addEventListener('input', handleProductSearch);
        }
        
        if (orderSearch) {
            orderSearch.addEventListener('input', handleOrderSearch);
        }
        
        // Initialize status filters
        statusFilters.forEach(filter => {
            filter.addEventListener('change', handleStatusFilter);
        });
        
        // Initialize delete product buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-product')) {
                handleDeleteProduct(e);
            }
        });
        
        // Initialize edit product buttons
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('edit-product')) {
                handleEditProduct(e);
            }
        });
        
        // Initialize file upload
        if (fileUpload) {
            fileUpload.addEventListener('change', handleFileUpload);
        }
        
        // Initialize confirm delete button
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', confirmDelete);
        }
        
        // Initialize cancel delete button
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', cancelDeleteModal);
        }
    }
    
    // ======== NAVIGATION HANDLERS ========
    function handleNavigation(e) {
        e.preventDefault();
        
        // Remove active class from all links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to clicked link
        this.classList.add('active');
        
        // Get section ID from data attribute
        const sectionId = this.getAttribute('data-section');
        
        // Hide all sections
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }
        
        // Update URL hash
        window.location.hash = sectionId;
    }
    
    function handleViewAll(e) {
        e.preventDefault();
        
        // Get section ID from data attribute
        const sectionId = this.getAttribute('data-section');
        
        // Trigger click on corresponding nav link
        document.querySelector(`.admin-nav a[data-section="${sectionId}"]`).click();
    }
    
    function checkUrlHash() {
        const hash = window.location.hash.substring(1);
        
        if (hash && document.getElementById(hash)) {
            document.querySelector(`.admin-nav a[data-section="${hash}"]`).click();
        }
    }
    
    // ======== PRODUCT MANAGEMENT ========
    function openProductModal(isEdit = false) {
        console.log('Opening product modal');
        console.log('Product Modal Element:', productModal);
        
        // Reset form
        if (productForm) {
            productForm.reset();
            
            // Clear image preview
            if (imagePreview) {
                imagePreview.innerHTML = '';
            }
            
            // Set modal title based on action
            document.querySelector('.modal-title').textContent = isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle';
            
            // Clear hidden ID field if adding new product
            if (!isEdit) {
                document.getElementById('productId').value = '';
                
                // Generate a new SKU
                const skuField = document.getElementById('productSKU');
                if (skuField) {
                    skuField.value = generateSKU();
                }
            }
        }
        
        // Show modal - FIXED: Add 'show' class instead of 'active'
        if (productModal) {
            productModal.style.display = 'block'; // Make sure it's visible
            productModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal() {
        // Hide all modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none'; // Hide the modal
            modal.classList.remove('show');
        });
        
        document.body.style.overflow = '';
    }
    
    function handleProductSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const form = e.target;
        const formData = new FormData(form);
        const productId = form.dataset.id;
        
        // Create product data object
        const productData = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            comparePrice: parseFloat(formData.get('comparePrice') || 0),
            category: formData.get('category'),
            inventory: parseInt(formData.get('inventory')),
            status: formData.get('status'),
            featured: formData.get('featured') === 'on',
            onSale: formData.get('onSale') === 'on',
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            weight: parseFloat(formData.get('weight') || 0),
            dimensions: {
                length: parseFloat(formData.get('length') || 0),
                width: parseFloat(formData.get('width') || 0),
                height: parseFloat(formData.get('height') || 0)
            }
        };
        
        // Get variant data
        const variantNames = document.querySelectorAll('.variant-name');
        const variantOptions = document.querySelectorAll('.variant-options');
        
        productData.variants = [];
        
        for (let i = 0; i < variantNames.length; i++) {
            const name = variantNames[i].value.trim();
            const options = variantOptions[i].value.split(',').map(option => option.trim()).filter(option => option);
            
            if (name && options.length > 0) {
                productData.variants.push({
                    name,
                    options
                });
            }
        }
        
        // Handle image uploads
        const imageFiles = form.querySelector('#productImages').files;
        
        if (imageFiles.length > 0) {
            // Create form data for image upload
            const imageFormData = new FormData();
            for (let i = 0; i < imageFiles.length; i++) {
                imageFormData.append('images', imageFiles[i]);
            }
            
            try {
                // Upload images
                const imageUrls = await uploadProductImages(imageFormData);
                
                // Add image URLs to product data
                productData.images = imageUrls;
            } catch (error) {
                alert('Error uploading images: ' + error.message);
                return;
            }
        }
        
        try {
            // Create or update product
            if (productId) {
                // Update existing product
                await updateProduct(productId, productData);
                alert('Product updated successfully');
            } else {
                // Create new product
                await createProduct(productData);
                alert('Product created successfully');
            }
            
            // Close modal
            closeModal();
            
            // Refresh product table
            initializeProductTable();
        } catch (error) {
            alert('Error saving product: ' + error.message);
        }
    }
    
    function handleDeleteProduct(e) {
        const productId = e.target.closest('.delete-product').dataset.id;
        const productName = e.target.closest('tr').querySelector('td:nth-child(2)').textContent;
        
        // Show delete confirmation modal
        const deleteModal = document.getElementById('deleteModal');
        const productToDelete = document.getElementById('productToDelete');
        
        if (deleteModal && productToDelete) {
            productToDelete.textContent = productName;
            deleteModal.dataset.id = productId;
            deleteModal.style.display = 'flex';
        }
    }
    
    // Confirm delete product
    async function confirmDelete() {
        const deleteModal = document.getElementById('deleteModal');
        const productId = deleteModal.dataset.id;
        
        try {
            // Delete product
            await deleteProduct(productId);
            
            // Close modal
            cancelDeleteModal();
            
            // Refresh product table
            initializeProductTable();
            
            alert('Product deleted successfully');
        } catch (error) {
            alert('Error deleting product: ' + error.message);
        }
    }
    
    function cancelDeleteModal() {
        closeModal();
    }
    
    function handleEditProduct(e) {
        e.preventDefault();
        
        // Get product row
        const row = this.closest('tr');
        const productId = row.getAttribute('data-id');
        
        // Get product data from row
        const productName = row.querySelector('.product-cell span').textContent;
        const productSKU = row.querySelector('td:nth-child(3)').textContent;
        const productCategory = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        const productPrice = row.querySelector('td:nth-child(5)').textContent.replace('₺', '').replace(/\./g, '').replace(',', '.');
        const productStock = row.querySelector('td:nth-child(6)').textContent;
        const productStatus = row.querySelector('.status-badge').classList.contains('active') ? 'active' : 'inactive';
        
        // Open modal
        openProductModal(true);
        
        // Populate form with product data
        document.getElementById('productId').value = productId;
        document.getElementById('productName').value = productName;
        document.getElementById('productSKU').value = productSKU;
        
        // Set category
        const categorySelect = document.getElementById('productCategory');
        for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].text.toLowerCase() === productCategory.toLowerCase()) {
                categorySelect.selectedIndex = i;
                break;
            }
        }
        
        document.getElementById('productPrice').value = productPrice;
        document.getElementById('productStock').value = productStock;
        
        // Set status
        const statusSelect = document.getElementById('productStatus');
        for (let i = 0; i < statusSelect.options.length; i++) {
            if (statusSelect.options[i].value === productStatus) {
                statusSelect.selectedIndex = i;
                break;
            }
        }
        
        // For demo purposes, we'll set a placeholder description
        document.getElementById('productDescription').value = 'Bu ürün için örnek açıklama metni. Gerçek uygulamada bu veri veritabanından gelecektir.';
    }
    
    function handleFileUpload(e) {
        if (imagePreview) {
            imagePreview.innerHTML = '';
            
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            // Check if too many files are selected
            if (files.length > 5) {
                showNotification('En fazla 5 görsel yükleyebilirsiniz.', 'error');
            }
            
            for (let i = 0; i < Math.min(files.length, 5); i++) {
                const file = files[i];
                
                // Validate file type
                if (!file.type.match('image.*')) {
                    showNotification('Lütfen sadece resim dosyaları yükleyin.', 'error');
                    continue;
                }
                
                // Validate file size (2MB max)
                if (file.size > 2 * 1024 * 1024) {
                    showNotification('Görsel boyutu 2MB\'dan küçük olmalıdır.', 'error');
                    continue;
                }
                
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Ürün Görseli">
                        <span class="remove-image"><i class="fas fa-times"></i></span>
                    `;
                    
                    // Add remove functionality
                    previewItem.querySelector('.remove-image').addEventListener('click', function() {
                        previewItem.remove();
                    });
                    
                    imagePreview.appendChild(previewItem);
                };
                
                reader.readAsDataURL(file);
            }
        }
    }
    
    function generateSKU() {
        // Generate a random SKU in format DND-XX-000
        const categories = {
            'erkek': 'ME',
            'kadin': 'WO',
            'aksesuar': 'AC',
            'ayakkabi': 'SH',
            'canta': 'BA'
        };
        
        const category = document.getElementById('productCategory').value;
        const categoryCode = categories[category] || 'XX';
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `DND-${categoryCode}-${randomNum}`;
    }
    
    function generateProductId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }
    
    // ======== SEARCH AND FILTER HANDLERS ========
    function handleProductSearch() {
        const searchTerm = this.value.toLowerCase();
        const productRows = document.querySelectorAll('.products-table tbody tr');
        
        productRows.forEach(row => {
            const productName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const productCategory = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
            
            if (productName.includes(searchTerm) || productCategory.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    function handleOrderSearch() {
        const searchTerm = this.value.toLowerCase();
        const orderRows = document.querySelectorAll('.orders-table tbody tr');
        
        orderRows.forEach(row => {
            const orderNumber = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const customerName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            
            if (orderNumber.includes(searchTerm) || customerName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    function handleStatusFilter() {
        const filterValue = this.value.toLowerCase();
        const table = this.closest('.admin-section').querySelector('.admin-table');
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const statusCell = row.querySelector('.status-badge');
            if (!statusCell) return;
            
            const status = statusCell.textContent.toLowerCase();
            
            if (!filterValue || status.includes(filterValue)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // ======== CHARTS ========
    function initializeCharts() {
        // Sales Chart
        const salesChartCanvas = document.getElementById('salesChart');
        if (salesChartCanvas) {
            const salesChart = new Chart(salesChartCanvas, {
                type: 'line',
                data: {
                    labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
                    datasets: [{
                        label: 'Satışlar (₺)',
                        data: [1500, 2500, 1800, 3000, 2800, 3500, 4000, 3800, 4200, 4800, 5200, 6000],
                        backgroundColor: 'rgba(201, 167, 124, 0.2)',
                        borderColor: 'rgba(201, 167, 124, 1)',
                        borderWidth: 2,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#a0a0a0'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: '#a0a0a0'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#f5f5f5'
                            }
                        }
                    }
                }
            });
        }
        
        // Products Chart
        const productsChartCanvas = document.getElementById('productsChart');
        if (productsChartCanvas) {
            const productsChart = new Chart(productsChartCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Deri Ceket', 'Premium Gömlek', 'Tasarım Bluz', 'Yün Palto', 'Diğer'],
                    datasets: [{
                        data: [30, 22, 18, 15, 15],
                        backgroundColor: [
                            'rgba(201, 167, 124, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)'
                        ],
                        borderColor: [
                            'rgba(201, 167, 124, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#f5f5f5',
                                padding: 20
                            }
                        }
                    }
                }
            });
        }
    }
    
    // ======== NOTIFICATION SYSTEM ========
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove notification after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Add notification styles
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .admin-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            background-color: #252525;
            color: #f5f5f5;
            border-left: 4px solid var(--accent-color);
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            transform: translateY(100px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .admin-notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .admin-notification.success {
            border-left-color: #4CAF50;
        }
        
        .admin-notification.error {
            border-left-color: #F44336;
        }
    `;
    document.head.appendChild(notificationStyles);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });

    // Add logout functionality
    document.querySelector('.admin-logout a').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Clear admin session
        sessionStorage.removeItem('adminAuthenticated');
        
        // Redirect to login page
        window.location.href = 'admin-login.html';
    });

    // Add these functions to admin.js

    // Save products to localStorage
    function saveProducts(products) {
        return storageManager.saveProducts(products);
    }

    // Get products from localStorage
    function getProducts() {
        return storageManager.getProducts();
    }

    // Update initializeProductTable function
    async function initializeProductTable() {
        const productTable = document.querySelector('.products-table tbody');
        if (!productTable) return;
        
        // Clear table
        productTable.innerHTML = '';
        
        // Show loading
        productTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading products...</td></tr>';
        
        // Fetch products from API
        const products = await fetchProducts();
        
        // Clear loading
        productTable.innerHTML = '';
        
        // Check if there are products
        if (products.length === 0) {
            productTable.innerHTML = '<tr><td colspan="7" class="text-center">No products found</td></tr>';
            return;
        }
        
        // Add products to table
        products.forEach(product => {
            const row = document.createElement('tr');
            row.dataset.id = product._id;
            
            row.innerHTML = `
                <td>
                    <div class="product-image-small">
                        <img src="${product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/50'}" alt="${product.name}">
                    </div>
                </td>
                <td>${product.name}</td>
                <td>${product.sku}</td>
                <td>₺${product.price.toFixed(2)}</td>
                <td>${product.inventory}</td>
                <td><span class="status-badge ${product.status}">${product.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-product" data-id="${product._id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-product" data-id="${product._id}"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            productTable.appendChild(row);
        });
        
        // Update product count in dashboard
        const productCount = document.querySelector('#dashboard .stat-value:nth-child(3)');
        if (productCount) {
            productCount.textContent = products.length;
        }
    }

    // Initialize customer table with data from API
    async function initializeCustomerTable() {
        const customerTable = document.querySelector('.customer-table tbody');
        if (!customerTable) return;
        
        // Clear table
        customerTable.innerHTML = '';
        
        // Show loading
        customerTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading customers...</td></tr>';
        
        // Fetch customers from API
        const customers = await fetchCustomers();
        
        // Clear loading
        customerTable.innerHTML = '';
        
        // Check if there are customers
        if (customers.length === 0) {
            customerTable.innerHTML = '<tr><td colspan="6" class="text-center">No customers found</td></tr>';
            return;
        }
        
        // Add customers to table
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.dataset.id = customer._id;
            
            row.innerHTML = `
                <td>${customer.firstName} ${customer.lastName}</td>
                <td>${customer.email}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>${customer.orders.length}</td>
                <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="view-customer" data-id="${customer._id}"><i class="fas fa-eye"></i></button>
                    </div>
                </td>
            `;
            
            customerTable.appendChild(row);
        });
        
        // Update customer count in dashboard
        const customerCount = document.querySelector('#dashboard .stat-value:nth-child(2)');
        if (customerCount) {
            customerCount.textContent = customers.length;
        }
    }

    // Initialize order table with data from API
    async function initializeOrderTable() {
        const orderTable = document.querySelector('.order-table tbody');
        if (!orderTable) return;
        
        // Clear table
        orderTable.innerHTML = '';
        
        // Show loading
        orderTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading orders...</td></tr>';
        
        // Fetch orders from API
        const orders = await fetchOrders();
        
        // Clear loading
        orderTable.innerHTML = '';
        
        // Check if there are orders
        if (orders.length === 0) {
            orderTable.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
            return;
        }
        
        // Add orders to table
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.dataset.id = order._id;
            
            row.innerHTML = `
                <td>${order.orderNumber}</td>
                <td>${order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'N/A'}</td>
                <td>₺${order.total.toFixed(2)}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td><span class="status-badge ${order.paymentStatus}">${order.paymentStatus}</span></td>
                <td><span class="status-badge ${order.orderStatus}">${order.orderStatus}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="view-order" data-id="${order._id}"><i class="fas fa-eye"></i></button>
                        <button class="edit-order-status" data-id="${order._id}"><i class="fas fa-edit"></i></button>
                    </div>
                </td>
            `;
            
            orderTable.appendChild(row);
        });
        
        // Calculate total sales
        const totalSales = orders.reduce((total, order) => {
            if (order.paymentStatus === 'paid') {
                return total + order.total;
            }
            return total;
        }, 0);
        
        // Update sales count in dashboard
        const salesCount = document.querySelector('#dashboard .stat-value:first-child');
        if (salesCount) {
            salesCount.textContent = `₺${totalSales.toFixed(2)}`;
        }
    }

    // Add a button to the admin panel to clear demo products
    function addClearDemoButton() {
        const actionsContainer = document.querySelector('.products-actions');
        if (!actionsContainer) return;
        
        const clearDemoBtn = document.createElement('button');
        clearDemoBtn.className = 'btn btn-secondary clear-demo-btn';
        clearDemoBtn.innerHTML = '<i class="fas fa-trash"></i> Demo Ürünleri Temizle';
        clearDemoBtn.addEventListener('click', clearDemoProducts);
        
        actionsContainer.appendChild(clearDemoBtn);
    }

    // Add this function to admin.js to handle pagination
    function initializePagination() {
        const paginationLinks = document.querySelectorAll('.pagination-link');
        const productRows = document.querySelectorAll('.products-table tbody tr');
        const itemsPerPage = 10; // Number of items to show per page
        
        if (paginationLinks.length === 0 || productRows.length === 0) return;
        
        // Function to show items for a specific page
        function showPage(pageNum) {
            // Hide all rows
            productRows.forEach(row => {
                row.style.display = 'none';
            });
            
            // Calculate start and end indices
            const startIndex = (pageNum - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, productRows.length);
            
            // Show rows for current page
            for (let i = startIndex; i < endIndex; i++) {
                if (productRows[i]) {
                    productRows[i].style.display = '';
                }
            }
            
            // Update active page link
            paginationLinks.forEach(link => {
                link.classList.remove('active');
                if (parseInt(link.getAttribute('data-page')) === pageNum) {
                    link.classList.add('active');
                }
            });
        }
        
        // Add click event to pagination links
        paginationLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const pageNum = parseInt(this.getAttribute('data-page'));
                showPage(pageNum);
            });
        });
        
        // Show first page by default
        showPage(1);
    }

    // Add this function to admin.js to export products
    function exportProducts() {
        const products = getProducts();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "dnd-products.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        showNotification('Ürün verileri dışa aktarıldı!', 'success');
    }

    // Add an import function as well
    function importProducts() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const products = JSON.parse(event.target.result);
                    saveProducts(products);
                    initializeProductTable();
                    showNotification('Ürün verileri içe aktarıldı!', 'success');
                } catch (error) {
                    showNotification('Geçersiz JSON dosyası!', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Add buttons to the admin panel
    function addDataManagementButtons() {
        const actionsContainer = document.querySelector('.products-actions');
        if (!actionsContainer) return;
        
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-secondary export-btn';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Ürünleri Dışa Aktar';
        exportBtn.addEventListener('click', handleExportProducts);
        
        const importBtn = document.createElement('button');
        importBtn.className = 'btn btn-secondary import-btn';
        importBtn.innerHTML = '<i class="fas fa-upload"></i> Ürünleri İçe Aktar';
        importBtn.addEventListener('click', handleImportProducts);
        
        actionsContainer.appendChild(exportBtn);
        actionsContainer.appendChild(importBtn);
    }

    // Handle export products
    function handleExportProducts() {
        storageManager.exportProducts();
        showNotification('Ürün verileri dışa aktarıldı!', 'success');
    }

    // Handle import products
    function handleImportProducts() {
        storageManager.importProducts()
            .then(products => {
                initializeProductTable();
                showNotification(`${products.length} ürün içe aktarıldı!`, 'success');
            })
            .catch(error => {
                showNotification('Ürün verileri içe aktarılamadı!', 'error');
                console.error('Import error:', error);
            });
    }
}); 
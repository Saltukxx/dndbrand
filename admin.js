/**
 * DnD Brand E-commerce - Admin Dashboard Functionality
 * Comprehensive admin panel with product management, order tracking, and analytics
 */

// Check for admin authentication
function checkAdminAuth() {
    // In a real application, this would verify a session token or JWT
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    
    if (!isAuthenticated) {
        // Redirect to login page
        window.location.href = 'admin-login.html';
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
        
        // Initialize product table with sample data
        initializeProductTable();
        
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
        deleteProductBtns.forEach(btn => {
            btn.addEventListener('click', handleDeleteProduct);
        });
        
        // Initialize edit product buttons
        editProductBtns.forEach(btn => {
            btn.addEventListener('click', handleEditProduct);
        });
        
        // Initialize file upload
        if (fileUpload) {
            fileUpload.addEventListener('change', handleFileUpload);
        }
        
        // Initialize delete confirmation
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', confirmDelete);
        }
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', cancelDelete);
        }
        
        // Initialize charts
        initializeCharts();
        
        // Check URL hash for direct navigation
        checkUrlHash();
        
        // Add clear demo button
        addClearDemoButton();
        
        // Add data management buttons
        addDataManagementButtons();
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
        const formData = new FormData(this);
        
        // Create product object
        const product = {
            id: parseInt(formData.get('productId')) || generateProductId(),
            name: formData.get('productName'),
            price: parseFloat(formData.get('productPrice')),
            description: formData.get('productDescription'),
            category: formData.get('productCategory'),
            colors: Array.from(document.querySelectorAll('input[name="productColors"]:checked')).map(el => el.value),
            sizes: Array.from(document.querySelectorAll('input[name="productSizes"]:checked')).map(el => el.value),
            stock: parseInt(formData.get('productStock')),
            sku: formData.get('productSKU'),
            status: 'active', // Set status to active by default
            featured: document.getElementById('productFeatured').checked
        };
        
        // Validate required fields
        const productName = product.name;
        const productPrice = product.price;
        const productCategory = product.category;
        
        if (!productName || !productPrice || !productCategory) {
            showNotification('Lütfen tüm zorunlu alanları doldurun.', 'error');
            return;
        }
        
        // Validate price format
        if (isNaN(parseFloat(productPrice)) || parseFloat(productPrice) <= 0) {
            showNotification('Lütfen geçerli bir fiyat girin.', 'error');
            return;
        }
        
        // Collect color and size data
        const selectedColors = product.colors;
        const selectedSizes = product.sizes;
        
        // Get image files
        const imageFiles = document.getElementById('productImages').files;
        
        // Check if we're editing an existing product
        const isEdit = formData.get('productId') ? true : false;
        
        // Process image files
        if (imageFiles && imageFiles.length > 0) {
            processProductImages(product, imageFiles, isEdit);
        } else {
            // No new images, use placeholder or keep existing images
            if (!isEdit) {
                // New product with no images, use placeholder
                product.images = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZm9udC13ZWlnaHQ9IjUwMCI+VXJuIEdvcnNlbGk8L3RleHQ+PC9zdmc+'];
            } else {
                // Editing product, keep existing images
                const existingProducts = getProducts();
                const existingProduct = existingProducts.find(p => p.id === product.id);
                if (existingProduct && existingProduct.images) {
                    product.images = existingProduct.images;
                } else {
                    product.images = ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZm9udC13ZWlnaHQ9IjUwMCI+VXJuIEdvcnNlbGk8L3RleHQ+PC9zdmc+'];
                }
            }
            
            // Save product and update UI
            saveProduct(product, isEdit);
            closeModal();
            showNotification(isEdit ? 'Ürün güncellendi!' : 'Ürün eklendi!', 'success');
        }
    }
    
    function processProductImages(product, imageFiles, isEdit) {
        let processedImages = 0;
        const totalImages = Math.min(imageFiles.length, 5); // Limit to 5 images
        product.images = [];
        
        // Process each image
        for (let i = 0; i < totalImages; i++) {
            const file = imageFiles[i];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                product.images.push(e.target.result);
                processedImages++;
                
                // When all images are processed, save the product
                if (processedImages === totalImages) {
                    saveProduct(product, isEdit);
                    closeModal();
                    showNotification(isEdit ? 'Ürün güncellendi!' : 'Ürün eklendi!', 'success');
                }
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    function saveProduct(product, isEdit) {
        // Get existing products
        const products = getProducts();
        
        if (isEdit) {
            // Update existing product
            const index = products.findIndex(p => p.id === product.id);
            if (index !== -1) {
                products[index] = product;
            } else {
                products.push(product);
            }
        } else {
            // Add new product
            products.push(product);
        }
        
        // Save to localStorage
        saveProducts(products);
        
        // Update product table
        addProductToTable(product);
    }
    
    function handleDeleteProduct(e) {
        e.preventDefault();
        
        // Get product row
        const row = this.closest('tr');
        const productId = parseInt(row.getAttribute('data-id'));
        
        // Get product name
        const productName = row.querySelector('.product-cell span').textContent;
        
        // Show delete confirmation modal
        const deleteModal = document.getElementById('deleteModal');
        const deleteProductName = document.getElementById('deleteProductName');
        const deleteProductId = document.getElementById('deleteProductId');
        
        if (deleteModal && deleteProductName && deleteProductId) {
            deleteProductName.textContent = productName;
            deleteProductId.value = productId;
            
            deleteModal.style.display = 'block';
            deleteModal.classList.add('show');
        }
    }
    
    function confirmDelete() {
        const deleteProductId = document.getElementById('deleteProductId');
        if (!deleteProductId) return;
        
        const productId = parseInt(deleteProductId.value);
        
        // Get products
        const products = getProducts();
        
        // Remove product
        const updatedProducts = products.filter(product => product.id !== productId);
        
        // Save updated products
        saveProducts(updatedProducts);
        
        // Remove row from table
        const row = document.querySelector(`tr[data-id="${productId}"]`);
        if (row) {
            row.remove();
        }
        
        // Close modal
        closeModal();
        
        // Show notification
        showNotification('Ürün silindi!', 'success');
    }
    
    function cancelDelete() {
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
    function initializeProductTable() {
        const productTable = document.querySelector('.products-table tbody');
        if (!productTable) return;
        
        // Clear existing rows
        productTable.innerHTML = '';
        
        // Get products from localStorage or use sample data if none exist
        let products = getProducts();
        
        // If no products in localStorage, use sample data
        if (products.length === 0) {
            products = [
                {
                    id: 1001,
                    name: 'Premium Deri Ceket',
                    sku: 'DND-ME-001',
                    category: 'erkek',
                    price: 1250.00,
                    stock: 15,
                    status: 'active',
                    description: 'Yüksek kaliteli deri ceket, modern tasarım.',
                    colors: ['siyah', 'kahverengi'],
                    sizes: ['m', 'l', 'xl'],
                    featured: true,
                    images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZm9udC13ZWlnaHQ9IjUwMCI+RGVyaSBDZWtldDwvdGV4dD48L3N2Zz4=']
                },
                {
                    id: 1002,
                    name: 'Tasarım Bluz',
                    sku: 'DND-WO-002',
                    category: 'kadin',
                    price: 450.00,
                    stock: 28,
                    status: 'active',
                    description: 'Şık ve rahat tasarım bluz.',
                    colors: ['beyaz', 'mavi', 'kirmizi'],
                    sizes: ['s', 'm', 'l'],
                    featured: true,
                    images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZm9udC13ZWlnaHQ9IjUwMCI+VGFzYXJpbSBCbHV6PC90ZXh0Pjwvc3ZnPg==']
                },
                {
                    id: 1003,
                    name: 'Yün Palto',
                    sku: 'DND-ME-003',
                    category: 'erkek',
                    price: 1850.00,
                    stock: 8,
                    status: 'active',
                    description: 'Sıcak tutan yün palto, kış için ideal.',
                    colors: ['siyah', 'lacivert', 'gri'],
                    sizes: ['m', 'l', 'xl'],
                    featured: false,
                    images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZm9udC13ZWlnaHQ9IjUwMCI+WXVuIFBhbHRvPC90ZXh0Pjwvc3ZnPg==']
                },
                {
                    id: 1004,
                    name: 'Deri Çanta',
                    sku: 'DND-BA-004',
                    category: 'canta',
                    price: 750.00,
                    stock: 0,
                    status: 'inactive',
                    description: 'Dayanıklı ve şık deri çanta.',
                    colors: ['siyah', 'kahverengi'],
                    sizes: [],
                    featured: false,
                    images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZm9udC13ZWlnaHQ9IjUwMCI+RGVyaSBDYW50YTwvdGV4dD48L3N2Zz4=']
                }
            ];
            
            // Save sample products to localStorage
            saveProducts(products);
        }
        
        // Add products to table
        products.forEach(product => {
            addProductToTable(product);
        });
    }

    // Helper function to add a product to the table
    function addProductToTable(product) {
        const productTable = document.querySelector('.products-table tbody');
        if (!productTable) return;
        
        // Check if product already exists in table
        const existingRow = document.querySelector(`tr[data-id="${product.id}"]`);
        if (existingRow) {
            existingRow.remove();
        }
        
        const newRow = document.createElement('tr');
        newRow.setAttribute('data-id', product.id);
        
        // Get category display name
        const categoryMap = {
            'erkek': 'Erkek',
            'kadin': 'Kadın',
            'aksesuar': 'Aksesuar',
            'ayakkabi': 'Ayakkabı',
            'canta': 'Çanta'
        };
        
        const categoryDisplay = categoryMap[product.category] || product.category;
        
        // Format price
        const price = product.price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Create row HTML
        newRow.innerHTML = `
            <td>
                <input type="checkbox" class="product-checkbox">
            </td>
            <td class="product-cell">
                <img src="${product.images[0]}" alt="${product.name}">
                <span>${product.name}</span>
            </td>
            <td>${product.sku}</td>
            <td>${categoryDisplay}</td>
            <td>₺${price}</td>
            <td>${product.stock}</td>
            <td><span class="status-badge ${product.status}">${product.status === 'active' ? 'Aktif' : 'Pasif'}</span></td>
            <td class="actions-cell">
                <a href="#" class="action-btn edit-btn"><i class="fas fa-edit"></i></a>
                <a href="#" class="action-btn delete-btn"><i class="fas fa-trash"></i></a>
            </td>
        `;
        
        // Add event listeners to new buttons
        newRow.querySelector('.edit-btn').addEventListener('click', handleEditProduct);
        newRow.querySelector('.delete-btn').addEventListener('click', handleDeleteProduct);
        
        // Add to table
        productTable.prepend(newRow);
    }

    // Clear demo products
    function clearDemoProducts() {
        // Get products
        const products = getProducts();
        
        // Filter out demo products (those with IDs less than 10000)
        const userAddedProducts = products.filter(product => product.id > 10000);
        
        // Save only user-added products
        saveProducts(userAddedProducts);
        
        // Refresh product table
        initializeProductTable();
        
        // Show notification
        showNotification('Demo ürünler temizlendi!', 'success');
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
/**
 * DnD Brand E-commerce - Product Detail Page Functionality
 * Displays product details from backend API
 */

// API URL
const API_URL = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        // Load product details
        loadProductDetails(productId);
    } else {
        // Redirect to shop page if no product ID
        window.location.href = 'shop.html';
    }
    
    // Initialize quantity selector
    initializeQuantitySelector();
    
    // Initialize product image gallery
    initializeProductGallery();
    
    // Initialize product tabs
    initializeProductTabs();
    
    // Initialize related products
    initializeRelatedProducts();
});

// Helper function to get the correct image path
function getProductImage(imagePath) {
    if (!imagePath) return '/img/no-image.jpg';
    
    // If it's already a full URL, return it as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's an upload path, use it directly from the server root
    if (imagePath.includes('/uploads/')) {
        // Make sure we don't duplicate the /uploads/ part
        if (imagePath.startsWith('/api/uploads/')) {
            return imagePath.replace('/api/uploads/', '/uploads/');
        }
        // Make sure the path starts with a slash
        if (!imagePath.startsWith('/')) {
            return '/' + imagePath;
        }
        return imagePath;
    } 
    
    // For other API paths, add the API_URL
    if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
    }
    return `${API_URL}${imagePath}`;
}

// Fetch product details from API
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message || 'Failed to fetch product details');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
}

// Load product details
async function loadProductDetails(productId) {
    // Show loading
    const productContainer = document.querySelector('.product-detail');
    if (productContainer) {
        productContainer.innerHTML = '<div class="loading-product"><p>Loading product details...</p></div>';
    }
    
    // Fetch product details from API
    const product = await fetchProductDetails(productId);
    
    if (!product) {
        // Show error message
        if (productContainer) {
            productContainer.innerHTML = '<div class="error-message"><p>Product not found</p><a href="shop.html" class="btn">Back to Shop</a></div>';
        }
        return;
    }
    
    // Update page title
    document.title = `${product.name} | DnD Brand`;
    
    // Update product details in the DOM
    updateProductDetails(product);
    
    // Initialize add to cart button
    initializeAddToCart(product);
}

// Update product details in the DOM
function updateProductDetails(product) {
    // Get product container
    const productContainer = document.querySelector('.product-detail');
    if (!productContainer) return;
    
    // Format price
    const price = product.price.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Format compare price if exists
    let comparePriceHtml = '';
    if (product.comparePrice && product.comparePrice > product.price) {
        const comparePrice = product.comparePrice.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        comparePriceHtml = `<span class="compare-price">₺${comparePrice}</span>`;
    }
    
    // Create sale badge if on sale
    const saleBadge = product.onSale ? '<span class="sale-badge">İndirim</span>' : '';
    
    // Create featured badge if featured
    const featuredBadge = product.featured ? '<span class="featured-badge">Öne Çıkan</span>' : '';
    
    // Create image gallery HTML
    let galleryHtml = '';
    let thumbnailsHtml = '';
    
    if (product.images && product.images.length > 0) {
        // Main image
        galleryHtml = `
            <div class="product-main-image">
                <img src="${getProductImage(product.images[0])}" alt="${product.name}">
                ${saleBadge}
                ${featuredBadge}
            </div>
        `;
        
        // Thumbnails
        thumbnailsHtml = '<div class="product-thumbnails">';
        product.images.forEach((image, index) => {
            thumbnailsHtml += `
                <div class="thumbnail ${index === 0 ? 'active' : ''}">
                    <img src="${getProductImage(image)}" alt="${product.name} - Image ${index + 1}">
                </div>
            `;
        });
        thumbnailsHtml += '</div>';
    } else {
        // Default image if no images
        galleryHtml = `
            <div class="product-main-image">
                <img src="/img/no-image.jpg" alt="${product.name}">
                ${saleBadge}
                ${featuredBadge}
            </div>
        `;
    }
    
    // Create variants HTML
    let variantsHtml = '';
    if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
            variantsHtml += `
                <div class="product-variant">
                    <h4>${variant.name}</h4>
                    <div class="variant-options">
                        ${variant.options.map(option => `
                            <button class="variant-option" data-variant="${variant.name}" data-value="${option}">${option}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }
    
    // Create product HTML
    const productHtml = `
        <div class="product-images">
            ${galleryHtml}
            ${thumbnailsHtml}
        </div>
        <div class="product-info">
            <h1 class="product-name">${product.name}</h1>
            <div class="product-price">
                <span class="current-price">₺${price}</span>
                ${comparePriceHtml}
            </div>
            <div class="product-description">
                ${product.description}
            </div>
            ${variantsHtml}
            <div class="product-quantity">
                <h4>Adet</h4>
                <div class="quantity-selector">
                    <button class="quantity-decrease">-</button>
                    <input type="number" value="1" min="1" max="${product.inventory}" id="product-quantity">
                    <button class="quantity-increase">+</button>
                </div>
                <span class="stock-info">${product.inventory} adet stokta</span>
            </div>
            <div class="product-actions">
                <button class="add-to-cart-btn" data-id="${product._id}">Sepete Ekle</button>
                <button class="add-to-wishlist-btn" data-id="${product._id}"><i class="far fa-heart"></i></button>
            </div>
            <div class="product-meta">
                <p><strong>SKU:</strong> ${product.sku}</p>
                <p><strong>Kategori:</strong> ${product.category}</p>
                ${product.tags && product.tags.length > 0 ? `<p><strong>Etiketler:</strong> ${product.tags.join(', ')}</p>` : ''}
            </div>
        </div>
    `;
    
    // Update product container
    productContainer.innerHTML = productHtml;
    
    // Initialize product gallery
    initializeProductGallery();
    
    // Initialize quantity selector
    initializeQuantitySelector();
    
    // Initialize variant selection
    initializeVariantSelection();
}

// Initialize add to cart button
function initializeAddToCart(product) {
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (!addToCartBtn) return;
    
    addToCartBtn.addEventListener('click', function() {
        // Get selected quantity
        const quantity = parseInt(document.getElementById('product-quantity').value) || 1;
        
        // Get selected variants
        const selectedVariants = {};
        document.querySelectorAll('.variant-option.selected').forEach(option => {
            const variantName = option.dataset.variant;
            const variantValue = option.dataset.value;
            selectedVariants[variantName] = variantValue;
        });
        
        // Create cart item
        const cartItem = {
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.images && product.images.length > 0 ? getProductImage(product.images[0]) : '/img/no-image.jpg',
            quantity: quantity,
            variants: selectedVariants
        };
        
        // Add to cart
        addToCart(cartItem);
        
        // Show success message
        showNotification('Ürün sepete eklendi!', 'success');
    });
}

// Initialize quantity selector
function initializeQuantitySelector() {
    const decreaseBtn = document.querySelector('.quantity-decrease');
    const increaseBtn = document.querySelector('.quantity-increase');
    const quantityInput = document.getElementById('product-quantity');
    
    if (!decreaseBtn || !increaseBtn || !quantityInput) return;
    
    decreaseBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value) || 1;
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
        }
    });
    
    increaseBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value) || 1;
        const maxValue = parseInt(quantityInput.getAttribute('max')) || 100;
        if (currentValue < maxValue) {
            quantityInput.value = currentValue + 1;
        }
    });
    
    quantityInput.addEventListener('change', function() {
        const currentValue = parseInt(this.value) || 1;
        const maxValue = parseInt(this.getAttribute('max')) || 100;
        
        if (currentValue < 1) {
            this.value = 1;
        } else if (currentValue > maxValue) {
            this.value = maxValue;
        }
    });
}

// Initialize product gallery
function initializeProductGallery() {
    const mainImage = document.querySelector('.product-main-image img');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (!mainImage || thumbnails.length === 0) return;
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Update main image
            const imageUrl = this.querySelector('img').getAttribute('src');
            mainImage.setAttribute('src', imageUrl);
            
            // Update active thumbnail
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Initialize variant selection
function initializeVariantSelection() {
    const variantOptions = document.querySelectorAll('.variant-option');
    
    if (variantOptions.length === 0) return;
    
    variantOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Get variant name
            const variantName = this.dataset.variant;
            
            // Remove active class from all options in this variant
            document.querySelectorAll(`.variant-option[data-variant="${variantName}"]`).forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add active class to clicked option
            this.classList.add('selected');
        });
    });
}

// Initialize product tabs
function initializeProductTabs() {
    const tabButtons = document.querySelectorAll('.product-tab-button');
    const tabContents = document.querySelectorAll('.product-tab-content');
    
    if (tabButtons.length === 0 || tabContents.length === 0) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get tab ID
            const tabId = this.dataset.tab;
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Add to cart function
function addToCart(item) {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cart[existingItemIndex].quantity += item.quantity;
    } else {
        // Add new item to cart
        cart.push(item);
    }
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
}

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count in header
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        
        if (cartCount > 0) {
            cartCountElement.classList.add('active');
        } else {
            cartCountElement.classList.remove('active');
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', function() {
        notification.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// Initialize related products
async function initializeRelatedProducts() {
    const relatedProductsContainer = document.querySelector('.related-products-grid');
    if (!relatedProductsContainer) return;
    
    try {
        // Get current product category
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        // Fetch all products
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        
        if (!Array.isArray(products)) {
            console.error('Expected array of products but got:', products);
            return;
        }
        
        // Find current product
        const currentProduct = products.find(p => p._id === productId);
        if (!currentProduct) return;
        
        // Filter related products (same category, excluding current product)
        const relatedProducts = products
            .filter(p => p.category === currentProduct.category && p._id !== productId)
            .slice(0, 4); // Limit to 4 related products
        
        if (relatedProducts.length === 0) {
            relatedProductsContainer.innerHTML = '<p>No related products found.</p>';
            return;
        }
        
        // Create HTML for related products
        let html = '';
        relatedProducts.forEach(product => {
            // Format price
            const price = product.price.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            // Get product image
            const productImage = product.images && product.images.length > 0 
                ? getProductImage(product.images[0]) 
                : '/img/no-image.jpg';
            
            html += `
                <div class="product-card">
                    <a href="product.html?id=${product._id}" class="product-link">
                        <div class="product-image">
                            <img src="${productImage}" alt="${product.name}">
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <div class="product-price">₺${price}</div>
                        </div>
                    </a>
                    <button class="add-to-cart-btn" data-id="${product._id}">Sepete Ekle</button>
                </div>
            `;
        });
        
        // Update container
        relatedProductsContainer.innerHTML = html;
        
        // Add event listeners to add to cart buttons
        relatedProductsContainer.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.id;
                const product = relatedProducts.find(p => p._id === productId);
                
                if (product) {
                    // Create cart item
                    const cartItem = {
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image: product.images && product.images.length > 0 ? getProductImage(product.images[0]) : '/img/no-image.jpg',
                        quantity: 1
                    };
                    
                    // Add to cart
                    addToCart(cartItem);
                    
                    // Show success message
                    showNotification('Ürün sepete eklendi!', 'success');
                }
            });
        });
    } catch (error) {
        console.error('Error initializing related products:', error);
        relatedProductsContainer.innerHTML = '<p>Failed to load related products.</p>';
    }
} 
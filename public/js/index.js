/**
 * DnD Brand E-commerce - Homepage Functionality
 * Displays featured products from admin panel on the homepage
 */

// Get API URL from config if available
let indexApiUrl;
if (window.CONFIG && window.CONFIG.API_URL) {
    indexApiUrl = window.CONFIG.API_URL;
    console.log('Using API URL from config.js:', indexApiUrl);
} else {
    indexApiUrl = 'https://dndbrand-server.onrender.com/api';
    console.log('Config not found, using fallback API URL:', indexApiUrl);
}

document.addEventListener('DOMContentLoaded', function() {
    // Load featured products
    loadFeaturedProducts();
    
    // Initialize other homepage functionality
    initializeHomepage();
});

// Load featured products to the homepage
async function loadFeaturedProducts() {
    const featuredContainer = document.querySelector('.trending .product-grid');
    if (!featuredContainer) return;
    
    try {
        // Show loading state
        featuredContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Ürünler yükleniyor...</div>';
        
        // Fetch products from API using the new fetchAPI function
        let products = [];
        if (window.CONFIG && window.CONFIG.fetchAPI) {
            try {
                const data = await window.CONFIG.fetchAPI('products');
                console.log('API Response:', data);
                
                // Handle different response formats
                if (data && data.data && Array.isArray(data.data)) {
                    products = data.data;
                } else if (Array.isArray(data)) {
                    products = data;
                } else {
                    console.warn('Unexpected API response format:', data);
                    products = [];
                }
            } catch (apiError) {
                console.error('Error fetching products from API:', apiError);
                products = [];
            }
        } else {
            // Fallback to regular fetch if fetchAPI is not available
            try {
                const response = await fetch(`${indexApiUrl}/products`);
                const data = await response.json();
                if (data && data.data && Array.isArray(data.data)) {
                    products = data.data;
                } else if (Array.isArray(data)) {
                    products = data;
                }
            } catch (fetchError) {
                console.error('Fallback fetch error:', fetchError);
                products = [];
            }
        }
        
        // Clear container
        featuredContainer.innerHTML = '';
        
        // Check if there are products
        if (!products || products.length === 0) {
            featuredContainer.innerHTML = '<div class="no-products"><p>Henüz ürün bulunmamaktadır.</p></div>';
            return;
        }
        
        console.log('All products:', products);
        
        // Sort by featured first, then limit to 4 products
        const sortedProducts = [...products].sort((a, b) => {
            // Featured products first
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            
            // Then sort by newest
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            
            return 0;
        }).slice(0, 4);
        
        console.log('Featured products:', sortedProducts);
        
        // Add products to container
        sortedProducts.forEach(product => {
            const productCard = createProductCard(product);
            featuredContainer.appendChild(productCard);
        });
        
        // Initialize product card interactions
        initializeProductCards();
    } catch (error) {
        console.error('Error loading featured products:', error);
        featuredContainer.innerHTML = '<div class="no-products"><p>Ürünler yüklenirken bir hata oluştu.</p></div>';
    }
}

// Create a product card element
function createProductCard(product) {
    console.log('Creating card for product:', product);
    
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.setAttribute('data-id', product._id || product.id);
    
    // Format price
    let formattedPrice = '0,00';
    try {
        const priceValue = parseFloat(product.price);
        if (!isNaN(priceValue)) {
            formattedPrice = priceValue.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    } catch (error) {
        console.error(`Error formatting price for product ${product.name}:`, error);
    }
    
    // Format old price if exists
    let oldPriceHtml = '';
    try {
        if (product.comparePrice && parseFloat(product.comparePrice) > 0) {
            const oldPrice = parseFloat(product.comparePrice).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            oldPriceHtml = `<span class="old-price">${oldPrice} ₺</span>`;
        }
    } catch (error) {
        console.error(`Error formatting old price for product ${product.name}:`, error);
    }
    
    // Get product image
    let productImage = getProductImage(product);
    
    // Create badges
    let productBadges = '';
    
    // Add featured badge if product is featured
    if (product.featured) {
        productBadges += '<span class="product-badge featured">Öne Çıkan</span>';
    }
    
    // Add sale badge if product has a discount
    if (oldPriceHtml) {
        productBadges += '<span class="product-badge sale">İndirim</span>';
    }
    
    // Add new badge if product is new (added in the last 7 days)
    if (product.createdAt) {
        const createdDate = new Date(product.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (createdDate >= sevenDaysAgo) {
            productBadges += '<span class="product-badge new">Yeni</span>';
        }
    }
    
    card.innerHTML = `
        <div class="product-image">
            ${productBadges}
            <img src="${productImage}" alt="${product.name}">
            <div class="product-overlay">
                <a href="#" class="add-to-cart" data-id="${product._id || product.id}" title="Sepete Ekle">Sepete Ekle</a>
                <a href="./product.html?id=${product._id || product.id}" class="view-details" title="Detayları Gör">Detayları Gör</a>
            </div>
        </div>
        <div class="product-info">
            <div class="brand">DnD Brand</div>
            <h3>${product.name}</h3>
            <div class="price">${oldPriceHtml} ${formattedPrice} ₺</div>
        </div>
    `;
    
    return card;
}

// Get product image helper function
function getProductImage(product) {
    // Use the centralized ImageService if available
    if (window.ImageService && typeof window.ImageService.getProductImage === 'function') {
        return window.ImageService.getProductImage(product, { 
            category: product.category 
        });
    }
    
    // Fallback to original implementation if ImageService is not available
    let productImage = '/images/placeholder-product.jpg';
    
    try {
        // Check for images array
        if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
            productImage = product.images[0];
        } 
        // Check for single image string
        else if (typeof product.images === 'string' && product.images) {
            productImage = product.images;
        } 
        // Check for image property
        else if (product.image) {
            productImage = product.image;
        }
        
        // Check if image is a relative path and add API_URL if needed
        if (productImage && !productImage.startsWith('http') && !productImage.startsWith('/img/')) {
            // Make sure the path starts with a slash
            if (!productImage.startsWith('/')) {
                productImage = '/' + productImage;
            }
            productImage = `${indexApiUrl}${productImage}`;
        }
        
        // For demo/testing, use placeholder images if the image path doesn't exist
        if (productImage === '/img/no-image.jpg' || 
            productImage === `${indexApiUrl}/img/no-image.jpg` ||
            productImage === 'undefined' ||
            productImage === 'null') {
            // Use placeholder images based on product category
            const category = product.category ? product.category.toLowerCase() : '';
            if (category.includes('men') || category.includes('erkek')) {
                productImage = '/images/placeholder-men.jpg';
            } else if (category.includes('women') || category.includes('kadin') || category.includes('kadın')) {
                productImage = '/images/placeholder-women.jpg';
            } else if (category.includes('accessories') || category.includes('aksesuar')) {
                productImage = '/images/placeholder-accessories.jpg';
            } else {
                productImage = '/images/placeholder-product.jpg';
            }
        }
    } catch (error) {
        console.error(`Error processing image for product ${product.name}:`, error);
        productImage = '/images/placeholder-product.jpg';
    }
    
    return productImage;
}

// Initialize product card interactions
function initializeProductCards() {
    // Add to cart functionality
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    
    if (addToCartBtns.length > 0) {
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = this.getAttribute('data-id');
                addToCart(productId);
            });
        });
    }
    
    // Make entire card clickable
    const productCards = document.querySelectorAll('.product-card');
    
    if (productCards.length > 0) {
        productCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't trigger if clicking on a button or link
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                    return;
                }
                
                const productId = this.getAttribute('data-id');
                window.location.href = `./product.html?id=${productId}`;
            });
        });
    }
}

// Add to cart function
async function addToCart(productId) {
    try {
        // Get the button that triggered this to show loading state
        const addToCartBtn = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
        if (addToCartBtn) {
            addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            addToCartBtn.classList.add('loading');
            addToCartBtn.disabled = true;
        }
        
        // Validate product ID
        if (!productId) {
            showNotification('Geçersiz ürün bilgisi.', 'error');
            resetButton(addToCartBtn);
            return;
        }
        
        // Fetch product details from API
        const response = await fetch(`${indexApiUrl}/products/${productId}`);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        let product;
        
        if (data.success && data.data) {
            product = data.data;
        } else if (data && !data.success) {
            console.error('Error fetching product details:', data.message || 'Unknown error');
            showNotification('Ürün bilgileri alınamadı.', 'error');
            resetButton(addToCartBtn);
            return;
        } else if (data) {
            // Handle case where API returns product directly without success wrapper
            product = data;
        } else {
            console.error('Error fetching product details: Invalid response format');
            showNotification('Ürün bilgileri alınamadı.', 'error');
            resetButton(addToCartBtn);
            return;
        }
        
        // Check if product exists and has required properties
        if (!product || !product.name || !product.price) {
            showNotification('Ürün bilgileri eksik veya hatalı.', 'error');
            resetButton(addToCartBtn);
            return;
        }
        
        // If we have a global addToCart function in script.js, use that
        if (window.addToCart && typeof window.addToCart === 'function') {
            const result = await window.addToCart(product, 1);
            resetButton(addToCartBtn);
            return result;
        }
        
        // Otherwise, implement cart functionality here
        // Get cart from localStorage - use consistent key 'cart'
        let cart = localStorage.getItem('cart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            // Increase quantity
            existingItem.quantity += 1;
            showNotification(`${product.name} sepete eklendi! (${existingItem.quantity} adet)`, 'success');
        } else {
            // Add new item
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                quantity: 1
            });
            showNotification(`${product.name} sepete eklendi!`, 'success');
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Animation effect on cart icon
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.add('pulse');
            setTimeout(() => {
                cartIcon.classList.remove('pulse');
            }, 1000);
        }
        
        resetButton(addToCartBtn);
        return true;
    } catch (error) {
        console.error('Error adding product to cart:', error);
        showNotification('Ürün sepete eklenirken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        
        // Reset add to cart button
        const addToCartBtn = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
        resetButton(addToCartBtn);
        
        return false;
    }
}

// Helper function to reset button state
function resetButton(button) {
    if (button) {
        button.innerHTML = 'Sepete Ekle';
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Update cart count
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (!cartCountElement) return;
    
    // Get cart from localStorage
    let cart = localStorage.getItem('cart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Calculate total quantity
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update cart count
    cartCountElement.textContent = totalQuantity;
    
    // Show/hide cart count
    if (totalQuantity > 0) {
        cartCountElement.style.display = 'flex';
    } else {
        cartCountElement.style.display = 'none';
    }
}

// Extend the notification function to be more robust
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.shop-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `shop-notification ${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Initialize homepage
function initializeHomepage() {
    // Update cart count on page load
    updateCartCount();
    
    // Add event listeners for other homepage elements
    const heroButtons = document.querySelectorAll('.hero-content .btn');
    if (heroButtons.length > 0) {
        heroButtons.forEach(button => {
            button.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                if (target === 'shop') {
                    window.location.href = './shop.html';
                }
            });
        });
    }
    
    // Load featured products
    loadFeaturedProducts();
    
    // Initialize product cards
    initializeProductCards();
    
    // Apply global image error handler if available
    if (window.ImageService && typeof window.ImageService.applyImageErrorHandler === 'function') {
        window.ImageService.applyImageErrorHandler();
    }
} 
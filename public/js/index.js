/**
 * DnD Brand E-commerce - Homepage Functionality
 * Displays featured products from admin panel on the homepage
 */

// API URL
// const API_URL = 'http://localhost:8080/api';
const API_URL = window.CONFIG ? window.CONFIG.API_URL : 'http://localhost:8080/api';

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
                const response = await fetch(`${API_URL}/products`);
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
            <img src="${productImage}" alt="${product.name}" 
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';">
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
    let productImage = '../img/no-image.jpg';
    
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
            productImage = `${API_URL}${productImage}`;
        }
        
        // For demo/testing, use placeholder images if the image path doesn't exist
        if (productImage === '/img/no-image.jpg' || 
            productImage === `${API_URL}/img/no-image.jpg` ||
            productImage === 'undefined' ||
            productImage === 'null') {
            // Use placeholder images based on product category
            const category = product.category ? product.category.toLowerCase() : '';
            if (category.includes('men') || category.includes('erkek')) {
                productImage = 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
            } else if (category.includes('women') || category.includes('kadin') || category.includes('kadın')) {
                productImage = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
            } else if (category.includes('accessories') || category.includes('aksesuar')) {
                productImage = 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
            } else {
                productImage = 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
            }
        }
    } catch (error) {
        console.error(`Error processing image for product ${product.name}:`, error);
        productImage = 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
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
        // Fetch product details from API
        const response = await fetch(`${API_URL}/products/${productId}`);
        const data = await response.json();
        
        if (!data.success || !data.data) {
            console.error('Error fetching product details:', data.message || 'Unknown error');
            showNotification('Ürün bilgileri alınamadı.', 'error');
            return;
        }
        
        const product = data.data;
        
        // Get cart from localStorage
        let cart = localStorage.getItem('dndCart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            // Increase quantity
            existingItem.quantity += 1;
        } else {
            // Add new item
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                quantity: 1
            });
        }
        
        // Save cart to localStorage
        localStorage.setItem('dndCart', JSON.stringify(cart));
        
        // Show notification
        showNotification('Ürün sepete eklendi!', 'success');
        
        // Update cart count
        updateCartCount();
    } catch (error) {
        console.error('Error adding product to cart:', error);
        showNotification('Ürün sepete eklenirken bir hata oluştu.', 'error');
    }
}

// Update cart count
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (!cartCountElement) return;
    
    // Get cart from localStorage
    let cart = localStorage.getItem('dndCart');
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

// Show notification
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
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize other homepage functionality
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
} 
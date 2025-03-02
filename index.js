/**
 * DnD Brand E-commerce - Homepage Functionality
 * Displays featured products from admin panel on the homepage
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load featured products
    loadFeaturedProducts();
});

// Get products from localStorage
function getProducts() {
    return storageManager.getProducts();
}

// Load featured products to the homepage
function loadFeaturedProducts() {
    const featuredContainer = document.querySelector('.trending .product-grid');
    if (!featuredContainer) return;
    
    // Get products from localStorage via storageManager
    const products = getProducts();
    
    // Filter active products only
    const activeProducts = products.filter(product => product.status === 'active');
    
    // Clear container
    featuredContainer.innerHTML = '';
    
    // Check if there are products
    if (activeProducts.length === 0) {
        featuredContainer.innerHTML = '<div class="no-products"><p>Henüz ürün bulunmamaktadır.</p></div>';
        return;
    }
    
    // Sort by featured first, then limit to 4 products
    const sortedProducts = [...activeProducts].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
    }).slice(0, 4);
    
    // Add products to container
    sortedProducts.forEach(product => {
        const productCard = createProductCard(product);
        featuredContainer.appendChild(productCard);
    });
    
    // Initialize product card interactions
    initializeProductCards();
}

// Create a product card element
function createProductCard(product) {
    console.log('Creating card for product:', product);
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);
    
    // Format price
    const formattedPrice = product.price.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Get first image or placeholder
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZm9udC13ZWlnaHQ9IjUwMCI+VXJ1biBHb3JzZWxpPC90ZXh0Pjwvc3ZnPg==';
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${imageUrl}" alt="${product.name}">
            <div class="product-overlay">
                <a href="#" class="add-to-cart" data-id="${product.id}">Sepete Ekle</a>
                <a href="product.html?id=${product.id}" class="view-details">Detayları Gör</a>
            </div>
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">${formattedPrice} ₺</p>
        </div>
    `;
    
    return card;
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
                
                const productId = parseInt(this.getAttribute('data-id'));
                addToCart(productId);
            });
        });
    }
    
    // Make entire card clickable
    const productCards = document.querySelectorAll('.product-card');
    
    if (productCards.length > 0) {
        productCards.forEach(card => {
            card.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                window.location.href = `product.html?id=${productId}`;
            });
        });
    }
}

// Add to cart function
function addToCart(productId) {
    // Get product details
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
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
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0],
            quantity: 1
        });
    }
    
    // Save cart to localStorage
    localStorage.setItem('dndCart', JSON.stringify(cart));
    
    // Show notification
    showNotification('Ürün sepete eklendi!', 'success');
    
    // Update cart count
    updateCartCount();
} 
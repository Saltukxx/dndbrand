/**
 * DnD Brand E-commerce - Main Script
 * Handles common functionality across all pages
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Initialize newsletter form
    initializeNewsletterForm();
    
    // Update cart count
    updateCartCount();
    
    // Initialize product quick view
    initializeQuickView();
    
    // Update cart preview
    updateCartPreview();
    
    // Initialize hero animations
    initializeHeroAnimations();
});

// Initialize mobile menu
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('nav ul');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
            this.classList.toggle('active');
        });
    }
}

// Initialize newsletter form
function initializeNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email) {
                // In a real application, this would send the email to a server
                showNotification('Bültenimize başarıyla abone oldunuz!', 'success');
                emailInput.value = '';
            }
        });
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
    
    // Update cart preview
    updateCartPreview();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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

// Initialize product quick view
function initializeQuickView() {
    const quickViewBtns = document.querySelectorAll('.quick-view');
    
    if (quickViewBtns.length > 0) {
        quickViewBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = this.closest('.product-card').getAttribute('data-id');
                openQuickView(productId);
            });
        });
    }
}

// Open quick view modal
function openQuickView(productId) {
    // Get products from localStorage
    const products = getProducts();
    
    // Find product by ID
    const product = products.find(p => p.id === parseInt(productId));
    
    if (!product) return;
    
    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    
    // Format price
    const price = product.price.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    modal.innerHTML = `
        <div class="quick-view-content">
            <span class="close-quick-view">&times;</span>
            <div class="quick-view-image">
                <img src="${product.images[0]}" alt="${product.name}">
            </div>
            <div class="quick-view-details">
                <h2>${product.name}</h2>
                <p class="quick-view-price">₺${price}</p>
                <p class="quick-view-description">${product.description}</p>
                <div class="quick-view-colors">
                    <h3>Renkler:</h3>
                    <div class="color-options">
                        ${product.colors.map(color => `<div class="color-option" style="background-color: ${getColorCode(color)}" data-color="${color}"></div>`).join('')}
                    </div>
                </div>
                ${product.sizes.length > 0 ? `
                <div class="quick-view-sizes">
                    <h3>Bedenler:</h3>
                    <div class="size-options">
                        ${product.sizes.map(size => `<div class="size-option" data-size="${size}">${size.toUpperCase()}</div>`).join('')}
                    </div>
                </div>
                ` : ''}
                <div class="quick-view-actions">
                    <a href="product.html?id=${product.id}" class="btn view-details">Detayları Gör</a>
                    ${product.stock > 0 ? `<button class="btn add-to-cart-btn">Sepete Ekle</button>` : `<button class="btn add-to-cart-btn disabled" disabled>Tükendi</button>`}
                </div>
            </div>
        </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Close modal on click
    const closeBtn = modal.querySelector('.close-quick-view');
    closeBtn.addEventListener('click', function() {
        closeQuickView(modal);
    });
    
    // Close modal on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeQuickView(modal);
        }
    });
    
    // Add to cart functionality
    const addToCartBtn = modal.querySelector('.add-to-cart-btn');
    if (addToCartBtn && !addToCartBtn.disabled) {
        addToCartBtn.addEventListener('click', function() {
            addToCart(product);
            closeQuickView(modal);
        });
    }
    
    // Color selection
    const colorOptions = modal.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Size selection
    const sizeOptions = modal.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Close quick view modal
function closeQuickView(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 300);
}

// Get products from localStorage
function getProducts() {
    const products = localStorage.getItem('dndProducts');
    return products ? JSON.parse(products) : [];
}

// Add product to cart
function addToCart(product, quantity = 1, color = null, size = null) {
    // Get cart from localStorage
    let cart = localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Create cart item
    const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        quantity: quantity,
        color: color,
        size: size
    };
    
    // Check if product already in cart with same options
    const existingItemIndex = cart.findIndex(item => 
        item.id === product.id && 
        item.color === color && 
        item.size === size
    );
    
    if (existingItemIndex !== -1) {
        // Update quantity
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Add new item
        cart.push(cartItem);
    }
    
    // Save cart to localStorage
    localStorage.setItem('dndCart', JSON.stringify(cart));
    
    // Show notification
    showNotification('Ürün sepete eklendi!', 'success');
    
    // Update cart count
    updateCartCount();
}

// Helper function to get color code from color name
function getColorCode(colorName) {
    const colorMap = {
        'siyah': '#000000',
        'beyaz': '#ffffff',
        'kirmizi': '#ff0000',
        'mavi': '#0000ff',
        'yesil': '#008000',
        'kahverengi': '#8b4513',
        'gri': '#808080',
        'lacivert': '#000080',
        'pembe': '#ffc0cb',
        'mor': '#800080',
        'turuncu': '#ffa500',
        'sari': '#ffff00'
    };
    
    return colorMap[colorName] || '#cccccc';
}

// Add some additional CSS for animations
const style = document.createElement('style');
style.textContent = `
    .pulse {
        animation: pulse 0.3s ease-in-out;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.5); }
        100% { transform: scale(1); }
    }
    
    .collection-item, .product-card, .section-title {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .collection-item.animate, .product-card.animate, .section-title.animate {
        opacity: 1;
        transform: translateY(0);
    }
    
    nav ul.show {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background-color: var(--primary-color);
        padding: 20px;
        border-top: 1px solid var(--border-color);
        z-index: 1000;
    }
    
    .mobile-menu-toggle {
        display: none;
        cursor: pointer;
        font-size: 1.5rem;
    }
    
    @media (max-width: 768px) {
        .mobile-menu-toggle {
            display: block;
        }
        
        nav ul {
            display: none;
        }
        
        nav ul li {
            margin: 10px 0;
        }
    }
`;
document.head.appendChild(style);

// Update cart preview
function updateCartPreview() {
    const cartPreviewItems = document.querySelector('.cart-preview-items');
    const cartPreviewCount = document.querySelector('.cart-preview-count');
    const cartPreviewTotal = document.querySelector('.cart-preview-total-price');
    
    if (!cartPreviewItems || !cartPreviewCount || !cartPreviewTotal) return;
    
    // Get cart from localStorage
    let cart = localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Calculate total quantity and price
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Update cart preview count
    cartPreviewCount.textContent = `${totalQuantity} Ürün`;
    
    // Update cart preview total
    cartPreviewTotal.textContent = `₺${totalPrice.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    
    // Clear cart preview items
    cartPreviewItems.innerHTML = '';
    
    // Check if cart is empty
    if (cart.length === 0) {
        cartPreviewItems.innerHTML = '<div class="empty-cart-message">Sepetiniz boş</div>';
        return;
    }
    
    // Add cart items to preview
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-preview-item';
        
        cartItem.innerHTML = `
            <div class="cart-preview-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-preview-item-info">
                <h4 class="cart-preview-item-name">${item.name}</h4>
                <p class="cart-preview-item-price">₺${item.price.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}</p>
                <p class="cart-preview-item-quantity">Adet: ${item.quantity}</p>
            </div>
        `;
        
        cartPreviewItems.appendChild(cartItem);
    });
}

// Update the initializeHeroAnimations function
function initializeHeroAnimations() {
    // Scroll indicator functionality
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const featuredSection = document.querySelector('.featured-collections');
            if (featuredSection) {
                featuredSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Improved parallax effect on hero background
    const hero = document.querySelector('.hero');
    if (hero) {
        let initialBackgroundPosition = 'center';
        
        // Store the initial position
        if (hero.style.backgroundPosition) {
            initialBackgroundPosition = hero.style.backgroundPosition;
        }
        
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            const heroHeight = hero.offsetHeight;
            
            // Only apply parallax if we're within the hero section
            if (scrollPosition <= heroHeight) {
                // Calculate a smooth parallax effect (slower movement)
                const yPos = scrollPosition * 0.3; // Reduced speed for smoother effect
                hero.style.backgroundPosition = `center calc(${initialBackgroundPosition} + ${yPos}px)`;
            }
        });
    }
    
    // Animate elements when they come into view
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.collection-item, .product-card, .section-title');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.classList.add('animate');
            }
        });
    };
    
    // Run on load
    animateOnScroll();
    
    // Run on scroll
    window.addEventListener('scroll', animateOnScroll);
} 
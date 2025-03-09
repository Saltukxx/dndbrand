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
    
    // Initialize mobile navigation
    initializeMobileNavigation();
    
    // Add an image error handler to handle missing images
    const handleImageErrors = function() {
        // Get all images on the page
        const images = document.querySelectorAll('img');
        
        // Add error handler to each image
        images.forEach(img => {
            // Skip if already has an error handler
            if (img.hasAttribute('data-error-handled')) {
                return;
            }
            
            // Mark as handled
            img.setAttribute('data-error-handled', 'true');
            
            // Handle specific problematic image sources
            if (img.src.includes('no-image.jpg') || 
                img.src.includes('undefined') || 
                img.src.endsWith('undefined.jpg')) {
                // Replace immediately with fallback
                if (window.ImageService) {
                    img.src = window.ImageService.getFallbackImage();
                } else if (window.FALLBACK_PRODUCT_IMAGE) {
                    img.src = window.FALLBACK_PRODUCT_IMAGE;
                } else {
                    // Default base64 fallback if nothing else available
                    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAQlBMVEX///+qqqr09PT5+fnv7+/8/Pzr6+u0tLTc3NzR0dG5ubmurq7BwcHGxsbNzc3j4+Pn5+fZ2dnU1NT19fXw8PDg4OCF/xZ5AAADlklEQVR4nO2b2XLrIAyGwQtgvGHH7/+oJ03apGs6sRM4Z+bXRZvLfCBA6DJ1HYIgCIIgCIIgCIIgCIIgCIJ8G2JA3bYQ6Hdv5BPAH5R1MpvMZUwK30bTQB4XaXwhlzydE/guHsI8cQpAOKXGHn6CwJc9hVn8wewmywJwcx1/Y0D9JoLgcv5CVPQFAsdz+QvpYwxo3vOXDMQU3gKAuOCvXRDf4CAf6gsFB5A+4C8dkMfmQK4SejCgJg1YOZ+wDGx1Ae3i5TaEA/8mAZDLDdh4tQNzMUC6zQU0i1x3oF3kwq/47VD87oLcZcA4PuFA/MABcZcBwzqNHZ9MQBR3GTBuU49nHNCPhcgj5/NDDrCfOUb8hY8cA1UwPj73lW8dgQ8P0yLHkYm0k/tjhRj1F1swM5xBvKx3GXA9mPWrA+Jvs4ywunbgCQfESQZIqzWI4wg6bPkS7dK1Vy2gJ+ZJQK9BPDuFjAe3bHxEq3kSMOsM/HkbXodGTW+GYuRPt7ExYHgSUF8cOPV/Xdo/3/53B8ZdPwho9/kHhLTHP9+BuvpJELA0d3+AK67Z+gTCWzXMD/0ykBH3mEJQKbZT2+p+D5Q4S98C0K46OzE49YMDlhqm+ICBIG5zjUEHgLJCG/24LmRYXX/fBGjX3Y+SZ7dLaEDU0ypY+ftvR9h5sYK2sZ2kGdYpbPhqANKuc58Rqb9YqJ2RO2B2lgB5dh+9j5ER1H4RxEYA8Qbnn1Cnwk9h2LHtFATJ8Pf4CybWRd9vWQF4dDgYvZdQ+YkUyzfHsUg+53vkdKN9Xw5Qx9H9qQ5QJzL0XtZNgIHLlmPrVuAXCVDhLyCLu3qdSYCnDgGXQqSc87uXtARQt2xhsHPeApR4/PQp+uXC2QGQDpxVjFVcMvdEKIvEj+CcHPg4qTCEVl/Xzl5/jZt5yvqLHaLkotNsaJXrRmRQRaFSSYLjEsb7MVDPu1mUtpJGNbWdxlDkOJlVcK2t9wW9LCxBJQkBJAkMIZBfGw6RYJCgsCt3ASp3Acp3ATp3Acr3ATqfAOr3ARrfCOr3AWpfB6rfCKp9I2jhU7CJr8Em33ha+CRMJI+CIbCAMdCAkTDzYqQiICZfUEjQpnARCQlpZcRMQ0LCa2WU+CNSTkJDYgpmQzIqc4H/n5iOjpyQkJqQkpySlPFvJSYlJaWlpSb+B6jJiampyelJ/1Z6egRBEARBEAT5Jv4BRv9A0iXGr8MAAAAASUVORK5CYII=';
                }
            }
            
            // Add onerror handler for future errors
            img.onerror = function() {
                if (this.hasAttribute('data-tried-fallback')) {
                    // Already tried fallback, don't loop infinitely
                    return;
                }
                
                this.setAttribute('data-tried-fallback', 'true');
                
                // Try fallback with order: ImageService > FALLBACK_PRODUCT_IMAGE > base64
                if (window.ImageService) {
                    this.src = window.ImageService.getFallbackImage();
                } else if (window.FALLBACK_PRODUCT_IMAGE) {
                    this.src = window.FALLBACK_PRODUCT_IMAGE;
                } else {
                    // Default base64 fallback if nothing else available
                    this.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAQlBMVEX///+qqqr09PT5+fnv7+/8/Pzr6+u0tLTc3NzR0dG5ubmurq7BwcHGxsbNzc3j4+Pn5+fZ2dnU1NT19fXw8PDg4OCF/xZ5AAADlklEQVR4nO2b2XLrIAyGwQtgvGHH7/+oJ03apGs6sRM4Z+bXRZvLfCBA6DJ1HYIgCIIgCIIgCIIgCIIgCIJ8G2JA3bYQ6Hdv5BPAH5R1MpvMZUwK30bTQB4XaXwhlzydE/guHsI8cQpAOKXGHn6CwJc9hVn8wewmywJwcx1/Y0D9JoLgcv5CVPQFAsdz+QvpYwxo3vOXDMQU3gKAuOCvXRDf4CAf6gsFB5A+4C8dkMfmQK4SejCgJg1YOZ+wDGx1Ae3i5TaEA/8mAZDLDdh4tQNzMUC6zQU0i1x3oF3kwq/47VD87oLcZcA4PuFA/MABcZcBwzqNHZ9MQBR3GTBuU49nHNCPhcgj5/NDDrCfOUb8hY8cA1UwPj73lW8dgQ8P0yLHkYm0k/tjhRj1F1swM5xBvKx3GXA9mPWrA+Jvs4ywunbgCQfESQZIqzWI4wg6bPkS7dK1Vy2gJ+ZJQK9BPDuFjAe3bHxEq3kSMOsM/HkbXodGTW+GYuRPt7ExYHgSUF8cOPV/Xdo/3/53B8ZdPwho9/kHhLTHP9+BuvpJELA0d3+AK67Z+gTCWzXMD/0ykBH3mEJQKbZT2+p+D5Q4S98C0K46OzE49YMDlhqm+ICBIG5zjUEHgLJCG/24LmRYXX/fBGjX3Y+SZ7dLaEDU0ypY+ftvR9h5sYK2sZ2kGdYpbPhqANKuc58Rqb9YqJ2RO2B2lgB5dh+9j5ER1H4RxEYA8Qbnn1Cnwk9h2LHtFATJ8Pf4CybWRd9vWQF4dDgYvZdQ+YkUyzfHsUg+53vkdKN9Xw5Qx9H9qQ5QJzL0XtZNgIHLlmPrVuAXCVDhLyCLu3qdSYCnDgGXQqSc87uXtARQt2xhsHPeApR4/PQp+uXC2QGQDpxVjFVcMvdEKIvEj+CcHPg4qTCEVl/Xzl5/jZt5yvqLHaLkotNsaJXrRmRQRaFSSYLjEsb7MVDPu1mUtpJGNbWdxlDkOJlVcK2t9wW9LCxBJQkBJAkMIZBfGw6RYJCgsCt3ASp3Acp3ATp3Acr3ATqfAOr3ARrfCOr3AWpfB6rfCKp9I2jhU7CJr8Em33ha+CRMJI+CIbCAMdCAkTDzYqQiICZfUEjQpnARCQlpZcRMQ0LCa2WU+CNSTkJDYgpmQzIqc4H/n5iOjpyQkJqQkpySlPFvJSYlJaWlpSb+B6jJiampyelJ/1Z6egRBEARBEAT5Jv4BRv9A0iXGr8MAAAAASUVORK5CYII=';
                }
            };
        });
    };
    
    // Run immediately and periodically to catch dynamically added images
    handleImageErrors();
    
    // Run again after any AJAX content might have loaded
    setTimeout(handleImageErrors, 1000);
    setTimeout(handleImageErrors, 3000);
    
    // Also try to fix any existing no-image.jpg references in the DOM
    document.querySelectorAll('img[src*="no-image.jpg"]').forEach(img => {
        if (window.ImageService) {
            img.src = window.ImageService.getFallbackImage();
        } else if (window.FALLBACK_PRODUCT_IMAGE) {
            img.src = window.FALLBACK_PRODUCT_IMAGE;
        }
    });
});

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const closeMenuBtn = document.querySelector('.close-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Add animation to the button
            this.classList.add('active');
            
            // Animate the mobile menu opening
            mobileMenu.classList.add('active');
            mobileMenuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Animate menu items
            const menuItems = mobileMenu.querySelectorAll('ul li');
            menuItems.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('animate-in');
                }, 100 + (index * 50));
            });
        });
        
        if (closeMenuBtn) {
            closeMenuBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Reset button state
                if (mobileMenuBtn) {
                    mobileMenuBtn.classList.remove('active');
                }
                
                // Reset animation on menu items
                const menuItems = mobileMenu.querySelectorAll('ul li');
                menuItems.forEach(item => {
                    item.classList.remove('animate-in');
                });
                
                // Close the menu with animation
                mobileMenu.classList.remove('active');
                mobileMenuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Reset button state
                if (mobileMenuBtn) {
                    mobileMenuBtn.classList.remove('active');
                }
                
                // Reset animation on menu items
                const menuItems = mobileMenu.querySelectorAll('ul li');
                menuItems.forEach(item => {
                    item.classList.remove('animate-in');
                });
                
                // Close the menu with animation
                mobileMenu.classList.remove('active');
                mobileMenuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Close mobile menu when clicking on a link
        const mobileMenuLinks = mobileMenu.querySelectorAll('a');
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Reset button state
                if (mobileMenuBtn) {
                    mobileMenuBtn.classList.remove('active');
                }
                
                // Reset animation on menu items
                const menuItems = mobileMenu.querySelectorAll('ul li');
                menuItems.forEach(item => {
                    item.classList.remove('animate-in');
                });
                
                // Close the menu with animation
                mobileMenu.classList.remove('active');
                mobileMenuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Handle touch events for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        mobileMenu.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        mobileMenu.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            if (touchStartX - touchEndX > 50) {
                // Swipe left to close
                if (mobileMenuBtn) {
                    mobileMenuBtn.classList.remove('active');
                }
                
                // Reset animation on menu items
                const menuItems = mobileMenu.querySelectorAll('ul li');
                menuItems.forEach(item => {
                    item.classList.remove('animate-in');
                });
                
                mobileMenu.classList.remove('active');
                mobileMenuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }
    
    // Header scroll effect
    const header = document.querySelector('header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// Initialize newsletter form
function initializeNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const submitButton = this.querySelector('button[type="submit"]');
            const email = emailInput.value.trim();
            
            // Validate email
            if (!email) {
                showNotification('Lütfen e-posta adresinizi girin.', 'warning');
                emailInput.focus();
                return;
            }
            
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification('Lütfen geçerli bir e-posta adresi girin.', 'warning');
                emailInput.focus();
                return;
            }
            
            // Show loading state
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                submitButton.disabled = true;
            }
            
            try {
                // In a real app, this would send the email to a server
                // Simulate API call with a delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Store subscription in localStorage to persist it
                const subscriptions = JSON.parse(localStorage.getItem('newsletter_subscriptions') || '[]');
                if (!subscriptions.includes(email)) {
                    subscriptions.push(email);
                    localStorage.setItem('newsletter_subscriptions', JSON.stringify(subscriptions));
                }
                
                // Show success message
                showNotification('Bültenimize başarıyla abone oldunuz!', 'success');
                
                // Clear input
                emailInput.value = '';
                
                // Add successful animation to the form
                newsletterForm.classList.add('success');
                setTimeout(() => {
                    newsletterForm.classList.remove('success');
                }, 2000);
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                showNotification('Abonelik işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.', 'error');
            } finally {
                // Reset button
                if (submitButton) {
                    submitButton.innerHTML = 'Abone Ol';
                    submitButton.disabled = false;
                }
            }
        });
        
        // Add visual feedback when typing
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                const email = this.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (email && emailRegex.test(email)) {
                    this.classList.add('valid');
                    this.classList.remove('invalid');
                } else if (email) {
                    this.classList.add('invalid');
                    this.classList.remove('valid');
                } else {
                    this.classList.remove('valid', 'invalid');
                }
            });
        }
    }
}

// Update cart count
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    
    if (cartCountElements.length === 0) return;
    
    // Get cart from localStorage - use consistent key 'cart' instead of 'dndCart'
    let cart = localStorage.getItem('cart') || localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // If we found data in 'dndCart', migrate it to 'cart'
    if (localStorage.getItem('dndCart') && !localStorage.getItem('cart')) {
        localStorage.setItem('cart', localStorage.getItem('dndCart'));
    }
    
    // Calculate total quantity
    const totalQuantity = cart.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
    
    // Update cart count elements
    cartCountElements.forEach(element => {
        element.textContent = totalQuantity;
    });
    
    // Show/hide cart count
    if (totalQuantity > 0) {
        cartCountElements.forEach(element => {
            element.style.display = 'flex';
        });
    } else {
        cartCountElements.forEach(element => {
            element.style.display = 'none';
        });
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
                    <a href="./product.html?id=${product.id}" class="btn view-details">Detayları Gör</a>
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
    try {
        // Validate product
        if (!product) {
            console.error('Invalid product:', product);
            showNotification('Ürün bilgisi eksik veya hatalı.', 'error');
            return;
        }
        
        // Get cart from localStorage - use consistent key 'cart'
        let cart = localStorage.getItem('cart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Ensure product ID is consistent
        const productId = product._id || product.id || (typeof product === 'string' ? product : null);
        
        if (!productId) {
            console.error('Invalid product ID:', product);
            showNotification('Ürün ID bilgisi eksik veya hatalı.', 'error');
            return;
        }
        
        // Get product image
        let productImage = null;
        if (product.images && product.images.length > 0) {
            productImage = product.images[0];
        } else if (product.image) {
            productImage = product.image;
        }
        
        // Create cart item
        const cartItem = {
            id: productId,
            name: product.name || 'Ürün',
            price: product.price || 0,
            image: productImage,
            quantity: parseInt(quantity) || 1,
            color: color,
            size: size
        };
        
        // Check if product already in cart with same options
        const existingItemIndex = cart.findIndex(item => {
            const itemId = item.id;
            const sameId = itemId === productId || itemId === productId.toString();
            const sameOptions = item.color === color && item.size === size;
            return sameId && sameOptions;
        });
        
        if (existingItemIndex !== -1) {
            // Update quantity
            cart[existingItemIndex].quantity += parseInt(quantity) || 1;
        } else {
            // Add new item
            cart.push(cartItem);
        }
        
        // Save cart to localStorage with consistent key
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Show notification
        showNotification(`${cartItem.name} sepete eklendi!`, 'success');
        
        // Update cart count
        updateCartCount();
        
        // Update cart preview if it exists
        if (typeof updateCartPreview === 'function') {
            updateCartPreview();
        }
        
        console.log('Product added to cart:', cartItem);
        return true;
    } catch (error) {
        console.error('Error adding product to cart:', error);
        showNotification('Ürün sepete eklenirken bir hata oluştu.', 'error');
        return false;
    }
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
    const cartPreview = document.querySelector('.cart-preview');
    if (!cartPreview) return;
    
    const cartPreviewItems = cartPreview.querySelector('.cart-preview-items');
    const cartPreviewCount = cartPreview.querySelector('.cart-preview-count');
    const cartPreviewTotal = cartPreview.querySelector('.cart-preview-total-price');
    const emptyCartMessage = cartPreview.querySelector('.empty-cart-message');
    
    // Get cart from localStorage
    let cart = localStorage.getItem('cart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Update cart count
    if (cartPreviewCount) {
        cartPreviewCount.textContent = `${cart.length} Ürün`;
    }
    
    // Check if cart is empty
    if (cart.length === 0) {
        if (cartPreviewItems) {
            // Show empty cart message
            cartPreviewItems.innerHTML = '<div class="empty-cart-message">Sepetiniz boş</div>';
        }
        
        if (cartPreviewTotal) {
            cartPreviewTotal.textContent = '₺0.00';
        }
        
        return;
    }
    
    // Hide empty cart message if it exists
    if (emptyCartMessage) {
        emptyCartMessage.style.display = 'none';
    }
    
    // Clear cart preview items
    if (cartPreviewItems) {
        cartPreviewItems.innerHTML = '';
        
        // Add cart items to preview
        cart.forEach(item => {
            // Format price
            const formattedPrice = typeof item.price === 'number' ? 
                item.price.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }) : '0.00';
            
            // Get image URL with proper handling
            let imageUrl;
            if (window.ImageService && typeof window.ImageService.getProductImage === 'function') {
                imageUrl = window.ImageService.getProductImage(item.image);
            } else {
                imageUrl = item.image || '../images/no-image.jpg';
            }
            
            // Create cart preview item
            const cartPreviewItem = document.createElement('div');
            cartPreviewItem.className = 'cart-preview-item';
            
            cartPreviewItem.innerHTML = `
                <div class="cart-preview-item-image">
                    <img src="${imageUrl}" alt="${item.name}" onerror="this.src='../images/no-image.jpg';">
                </div>
                <div class="cart-preview-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-preview-item-price">
                        <span class="quantity">${item.quantity}x</span>
                        <span class="price">₺${formattedPrice}</span>
                    </div>
                </div>
                <div class="cart-preview-item-remove" data-id="${item.id}">
                    <i class="fas fa-times"></i>
                </div>
            `;
            
            cartPreviewItems.appendChild(cartPreviewItem);
        });
        
        // Add event listeners to remove buttons
        const removeButtons = cartPreviewItems.querySelectorAll('.cart-preview-item-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = this.getAttribute('data-id');
                removeCartItem(productId);
            });
        });
    }
    
    // Update cart total
    if (cartPreviewTotal) {
        // Calculate total
        const total = cart.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        // Format total
        const formattedTotal = total.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        cartPreviewTotal.textContent = `₺${formattedTotal}`;
    }
}

// Remove item from cart
function removeCartItem(productId) {
    try {
        // Get cart from localStorage
        let cart = localStorage.getItem('cart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Find item in cart
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) {
            console.warn('Product not found in cart:', productId);
            return false;
        }
        
        // Get item name for notification
        const itemName = cart[itemIndex].name;
        
        // Remove item from cart
        cart.splice(itemIndex, 1);
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Show notification
        showNotification(`${itemName} sepetten çıkarıldı.`, 'info');
        
        // Update cart count
        updateCartCount();
        
        // Update cart preview
        updateCartPreview();
        
        return true;
    } catch (error) {
        console.error('Error removing item from cart:', error);
        showNotification('Ürün sepetten çıkarılırken bir hata oluştu.', 'error');
        return false;
    }
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
    
    // Advanced parallax effect on hero backgrounds
    const heroBackgrounds = document.querySelectorAll('.hero-background');
    if (heroBackgrounds.length > 0) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.scrollY;
            
            heroBackgrounds.forEach(background => {
                const heroSection = background.closest('.hero');
                const heroRect = heroSection.getBoundingClientRect();
                const heroTop = heroRect.top + scrollPosition;
                const heroBottom = heroTop + heroRect.height;
                
                // Only apply parallax if the hero section is in view
                if (scrollPosition + window.innerHeight > heroTop && scrollPosition < heroBottom) {
                    const relativeScroll = scrollPosition - heroTop;
                    const speed = 0.5; // Adjust this value to control the parallax speed
                    
                    // Calculate the new position
                    const yPos = relativeScroll * speed;
                    
                    // Apply the transform with a 3D effect for better performance
                    background.style.transform = `translate3d(0, ${yPos}px, 0)`;
                }
            });
        });
    }
    
    // Animate hero content elements
    const animateHeroElements = () => {
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroButtons = document.querySelector('.hero-buttons');
        const heroFeatures = document.querySelectorAll('.hero-feature');
        
        if (heroTitle && heroSubtitle && heroButtons) {
            setTimeout(() => {
                heroTitle.classList.add('animate-text');
                
                setTimeout(() => {
                    heroSubtitle.classList.add('animate-text');
                    
                    setTimeout(() => {
                        heroButtons.classList.add('animate-text');
                        
                        // Animate features with staggered delay
                        heroFeatures.forEach((feature, index) => {
                            setTimeout(() => {
                                feature.classList.add('animate-up');
                            }, 200 * (index + 1));
                        });
                    }, 200);
                }, 200);
            }, 300);
        }
    };
    
    // Run hero animations on page load
    animateHeroElements();
    
    // Animate banner hero sections when they come into view
    const animateBannerHeroes = () => {
        const bannerHeroes = document.querySelectorAll('.banner-hero');
        
        bannerHeroes.forEach(banner => {
            const bannerRect = banner.getBoundingClientRect();
            const screenPosition = window.innerHeight * 0.8;
            
            if (bannerRect.top < screenPosition) {
                banner.classList.add('animate');
                
                // Add animation classes to banner content
                const title = banner.querySelector('.banner-hero-title');
                const subtitle = banner.querySelector('.banner-hero-subtitle');
                const button = banner.querySelector('.banner-hero-button');
                
                if (title && subtitle && button) {
                    title.classList.add('animate-text');
                    subtitle.classList.add('animate-text');
                    button.classList.add('animate-text');
                }
            }
        });
    };
    
    // Run on load
    animateBannerHeroes();
    
    // Run on scroll
    window.addEventListener('scroll', animateBannerHeroes);
    
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

// Initialize mobile navigation for shop filters
function initializeMobileFilters() {
    const filterToggle = document.querySelector('.mobile-filter-toggle');
    const filterClose = document.querySelector('.filter-close');
    const shopFilters = document.querySelector('.shop-sidebar');
    const filterOverlay = document.querySelector('.filter-overlay');
    
    if (filterToggle && shopFilters) {
        filterToggle.addEventListener('click', function(e) {
            e.preventDefault();
            shopFilters.classList.add('active');
            filterOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        if (filterClose) {
            filterClose.addEventListener('click', function(e) {
                e.preventDefault();
                shopFilters.classList.remove('active');
                filterOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        if (filterOverlay) {
            filterOverlay.addEventListener('click', function(e) {
                shopFilters.classList.remove('active');
                filterOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Handle touch events for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        shopFilters.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        shopFilters.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            if (touchEndX - touchStartX > 50) {
                // Swipe right to close
                shopFilters.classList.remove('active');
                filterOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }
}

// Initialize mobile navigation
function initializeMobileNavigation() {
    // Initialize mobile filters if on shop page
    if (document.querySelector('.shop-sidebar')) {
        initializeMobileFilters();
    }
    
    // Make dropdowns touch-friendly
    const dropdowns = document.querySelectorAll('.dropdown');
    
    if (dropdowns.length > 0) {
        dropdowns.forEach(dropdown => {
            const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            
            if (dropdownToggle && dropdownMenu) {
                dropdownToggle.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Close all other dropdowns
                    dropdowns.forEach(otherDropdown => {
                        if (otherDropdown !== dropdown) {
                            otherDropdown.querySelector('.dropdown-menu').classList.remove('show');
                        }
                    });
                    
                    // Toggle current dropdown
                    dropdownMenu.classList.toggle('show');
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', function(e) {
                    if (!dropdown.contains(e.target)) {
                        dropdownMenu.classList.remove('show');
                    }
                });
            }
        });
    }
    
    // Improve tab navigation for mobile
    const tabHeaders = document.querySelectorAll('.tab-header');
    
    if (tabHeaders.length > 0) {
        tabHeaders.forEach(tabHeader => {
            const tabs = tabHeader.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-pane');
            
            if (tabs.length > 0 && tabContents.length > 0) {
                // Make tabs scrollable on mobile
                if (window.innerWidth < 768) {
                    tabHeader.style.overflowX = 'auto';
                    tabHeader.style.whiteSpace = 'nowrap';
                    tabHeader.style.WebkitOverflowScrolling = 'touch';
                    tabHeader.style.scrollBehavior = 'smooth';
                }
                
                // Ensure tab functionality works
                tabs.forEach((tab, index) => {
                    tab.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Remove active class from all tabs and tab panes
                        tabs.forEach(t => t.classList.remove('active'));
                        tabContents.forEach(tc => tc.classList.remove('active'));
                        
                        // Add active class to current tab and tab pane
                        tab.classList.add('active');
                        tabContents[index].classList.add('active');
                        
                        // Scroll tab into view on mobile
                        if (window.innerWidth < 768) {
                            tab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                        }
                    });
                });
            }
        });
    }
}

// Initialize cart preview
function initializeCartPreview() {
    const cartIcon = document.querySelector('.cart-icon');
    
    if (cartIcon) {
        cartIcon.addEventListener('mouseenter', function() {
            const cartPreview = this.querySelector('.cart-preview');
            if (cartPreview) {
                cartPreview.classList.add('active');
            }
        });
        
        cartIcon.addEventListener('mouseleave', function() {
            const cartPreview = this.querySelector('.cart-preview');
            if (cartPreview) {
                cartPreview.classList.remove('active');
            }
        });
    }
} 
/**
 * DnD Brand E-commerce - Cart Page Functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart
    initializeCart();
    
    // Initialize coupon form
    initializeCouponForm();
    
    // Initialize checkout button
    initializeCheckoutButton();
});

// Initialize cart
function initializeCart() {
    // Get cart from localStorage
    let cart = localStorage.getItem('cart') || localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // If we found data in 'dndCart', migrate it to 'cart'
    if (localStorage.getItem('dndCart') && !localStorage.getItem('cart')) {
        localStorage.setItem('cart', localStorage.getItem('dndCart'));
    }
    
    // Get cart container
    const cartItemsContainer = document.querySelector('.cart-items');
    if (!cartItemsContainer) return;
    
    // Clear cart container
    const cartHeader = cartItemsContainer.querySelector('.cart-header');
    cartItemsContainer.innerHTML = '';
    
    // Add cart header back
    if (cartHeader) {
        cartItemsContainer.appendChild(cartHeader);
    }
    
    // Check if cart is empty
    if (cart.length === 0) {
        const emptyCartMessage = document.createElement('div');
        emptyCartMessage.className = 'empty-cart-message';
        emptyCartMessage.innerHTML = `
            <div class="empty-cart-icon">
                <i class="fas fa-shopping-bag"></i>
            </div>
            <h3>Sepetiniz Boş</h3>
            <p>Sepetinizde ürün bulunmamaktadır.</p>
            <a href="shop.html" class="btn">Alışverişe Başla</a>
        `;
        cartItemsContainer.appendChild(emptyCartMessage);
        
        // Hide cart summary
        const cartSummary = document.querySelector('.cart-summary');
        if (cartSummary) {
            cartSummary.style.display = 'none';
        }
        
        return;
    }
    
    // Show cart summary
    const cartSummary = document.querySelector('.cart-summary');
    if (cartSummary) {
        cartSummary.style.display = 'block';
    }
    
    // Add cart items
    cart.forEach(item => {
        const cartItem = createCartItem(item);
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Add cart item event listeners
    addCartItemEventListeners();
    
    // Update cart summary
    updateCartSummary();
}

// Create cart item element
function createCartItem(item) {
    // Create cart item element
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.setAttribute('data-id', item.id);
    
    // Format price
    const formattedPrice = typeof item.price === 'number' ? 
        item.price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) : '0.00';
    
    // Calculate item total
    const itemTotal = item.price * item.quantity;
    
    // Format total
    const formattedTotal = typeof itemTotal === 'number' ? 
        itemTotal.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) : '0.00';
    
    // Get image URL with fallback
    let imageUrl;
    if (window.ImageService && typeof window.ImageService.getProductImage === 'function') {
        imageUrl = window.ImageService.getProductImage(item.image);
    } else {
        imageUrl = item.image || '../images/no-image.jpg';
    }
    
    // Create variant text if color or size exists
    let variantText = '';
    if (item.color || item.size) {
        variantText = `<p class="cart-item-variant">`;
        if (item.color) variantText += `Renk: ${item.color}`;
        if (item.color && item.size) variantText += ` | `;
        if (item.size) variantText += `Beden: ${item.size}`;
        variantText += `</p>`;
    }
    
    cartItem.innerHTML = `
        <div class="cart-item-product">
            <div class="cart-item-image">
                <img src="${imageUrl}" alt="${item.name}" onerror="this.src='../images/no-image.jpg';">
            </div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                ${variantText}
            </div>
        </div>
        <div class="cart-item-price" data-label="Fiyat">₺${formattedPrice}</div>
        <div class="cart-item-quantity" data-label="Adet">
            <div class="quantity-selector">
                <button class="decrease-quantity">-</button>
                <input type="number" value="${item.quantity}" min="1" max="10" readonly>
                <button class="increase-quantity">+</button>
            </div>
        </div>
        <div class="cart-item-total" data-label="Toplam">₺${formattedTotal}</div>
        <div class="cart-item-remove">
            <button class="remove-button" title="Ürünü Kaldır"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    return cartItem;
}

// Add event listeners to cart item buttons
function addCartItemEventListeners() {
    // Quantity decrease buttons
    const decreaseButtons = document.querySelectorAll('.decrease-quantity');
    decreaseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.getAttribute('data-id');
            const quantityInput = cartItem.querySelector('input[type="number"]');
            let quantity = parseInt(quantityInput.value);
            
            if (quantity > 1) {
                quantity--;
                quantityInput.value = quantity;
                updateCartItemQuantity(productId, quantity);
            }
        });
    });
    
    // Quantity increase buttons
    const increaseButtons = document.querySelectorAll('.increase-quantity');
    increaseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.getAttribute('data-id');
            const quantityInput = cartItem.querySelector('input[type="number"]');
            let quantity = parseInt(quantityInput.value);
            
            if (quantity < 10) {
                quantity++;
                quantityInput.value = quantity;
                updateCartItemQuantity(productId, quantity);
            }
        });
    });
    
    // Remove buttons
    const removeButtons = document.querySelectorAll('.remove-button');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.getAttribute('data-id');
            removeCartItem(productId);
        });
    });
}

// Update cart item quantity
function updateCartItemQuantity(itemId, quantity, options = {}) {
    try {
        // Get cart from localStorage
        let cart = localStorage.getItem('cart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Find item in cart
        const itemIndex = cart.findIndex(item => {
            if (item.id !== itemId) return false;
            
            // Check if options match
            if (options.color && item.color !== options.color) return false;
            if (options.size && item.size !== options.size) return false;
            
            return true;
        });
        
        if (itemIndex === -1) return;
        
        // Update quantity
        cart[itemIndex].quantity = parseInt(quantity);
        
        // Remove item if quantity is 0
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Update cart summary
        updateCartSummary();
        
        return true;
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        return false;
    }
}

// Remove cart item
function removeCartItem(itemId, options = {}) {
    try {
        // Get cart from localStorage
        let cart = localStorage.getItem('cart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Find item in cart
        const itemIndex = cart.findIndex(item => {
            if (item.id !== itemId) return false;
            
            // Check if options match
            if (options.color && item.color !== options.color) return false;
            if (options.size && item.size !== options.size) return false;
            
            return true;
        });
        
        if (itemIndex === -1) return;
        
        // Remove item from cart
        cart.splice(itemIndex, 1);
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Reinitialize cart
        initializeCart();
        
        // Show notification
        showNotification('Ürün sepetten çıkarıldı.', 'success');
        
        return true;
    } catch (error) {
        console.error('Error removing cart item:', error);
        return false;
    }
}

// Update cart summary
function updateCartSummary() {
    // Get cart from localStorage
    let cart = localStorage.getItem('cart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    // Get summary elements
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const totalElement = document.getElementById('total');
    
    if (!subtotalElement || !shippingElement || !totalElement) return;
    
    // Format subtotal
    const formattedSubtotal = subtotal.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Calculate shipping cost (free if subtotal > 500)
    const shippingCost = subtotal > 500 ? 0 : 25;
    
    // Format shipping cost
    const formattedShipping = shippingCost.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Calculate total
    const total = subtotal + shippingCost;
    
    // Format total
    const formattedTotal = total.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Update summary elements
    subtotalElement.textContent = `₺${formattedSubtotal}`;
    shippingElement.textContent = shippingCost === 0 ? 'Ücretsiz' : `₺${formattedShipping}`;
    totalElement.textContent = `₺${formattedTotal}`;
    
    // Update checkout button
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        if (cart.length === 0) {
            checkoutButton.disabled = true;
            checkoutButton.classList.add('disabled');
        } else {
            checkoutButton.disabled = false;
            checkoutButton.classList.remove('disabled');
        }
    }
}

// Initialize coupon form
function initializeCouponForm() {
    const couponForm = document.querySelector('.coupon-form');
    const applyButton = document.getElementById('apply-coupon');
    
    if (couponForm && applyButton) {
        applyButton.addEventListener('click', function() {
            const couponCode = document.getElementById('coupon-code').value.trim();
            
            if (couponCode) {
                // In a real application, this would validate the coupon code with a server
                // For this example, we'll just check if the code is "DND20" for a 20% discount
                
                if (couponCode.toUpperCase() === 'DND20') {
                    // Get subtotal
                    const subtotalElement = document.getElementById('subtotal');
                    const subtotalText = subtotalElement.textContent.replace('₺', '').replace('.', '').replace(',', '.');
                    const subtotal = parseFloat(subtotalText);
                    
                    // Calculate discount
                    const discount = subtotal * 0.2;
                    
                    // Format discount
                    const formattedDiscount = discount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    // Show discount
                    const discountContainer = document.getElementById('discount-container');
                    const discountElement = document.getElementById('discount');
                    
                    discountContainer.style.display = 'flex';
                    discountElement.textContent = `-₺${formattedDiscount}`;
                    
                    // Recalculate total
                    const shippingElement = document.getElementById('shipping');
                    const shippingText = shippingElement.textContent === 'Ücretsiz' ? '0' : shippingElement.textContent.replace('₺', '').replace('.', '').replace(',', '.');
                    const shipping = parseFloat(shippingText);
                    
                    const total = subtotal - discount + shipping;
                    
                    // Format total
                    const formattedTotal = total.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    
                    // Update total
                    document.getElementById('total').textContent = `₺${formattedTotal}`;
                    
                    // Show notification
                    showNotification('Kupon kodu uygulandı: %20 indirim', 'success');
                    
                    // Disable coupon form
                    document.getElementById('coupon-code').disabled = true;
                    applyButton.disabled = true;
                    applyButton.textContent = 'Uygulandı';
                } else {
                    // Show notification
                    showNotification('Geçersiz kupon kodu', 'error');
                }
            } else {
                // Show notification
                showNotification('Lütfen bir kupon kodu girin', 'error');
            }
        });
    }
}

// Initialize checkout button
function initializeCheckoutButton() {
    const checkoutButton = document.getElementById('checkout-button');
    
    if (checkoutButton) {
        checkoutButton.addEventListener('click', function() {
            // In a real application, this would redirect to the checkout page
            window.location.href = './checkout.html';
        });
    }
}

// Show notification
function showNotification(message, type) {
    // Check if notification function exists in script.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add notification to body
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            
            // Remove notification after animation
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
} 
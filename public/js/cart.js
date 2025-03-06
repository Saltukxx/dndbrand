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
    // Get cart items container
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (!cartItemsContainer) return;
    
    // Get cart from localStorage
    let cart = localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Log cart contents for debugging
    console.log('Cart contents:', cart);
    
    // Update cart count
    updateCartCount();
    
    // Check if cart is empty
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag"></i>
                <h2>Sepetiniz Boş</h2>
                <p>Sepetinizde henüz ürün bulunmamaktadır.</p>
                <a href="./shop.html" class="btn btn-primary">Alışverişe Başla</a>
            </div>
        `;
        
        // Hide summary items
        document.getElementById('subtotal').textContent = '₺0.00';
        document.getElementById('shipping').textContent = '₺0.00';
        document.getElementById('total').textContent = '₺0.00';
        
        // Disable checkout button
        const checkoutButton = document.getElementById('checkout-button');
        if (checkoutButton) {
            checkoutButton.disabled = true;
            checkoutButton.classList.add('disabled');
        }
        
        return;
    }
    
    // Clear container
    cartItemsContainer.innerHTML = '';
    
    // Add cart items
    let subtotal = 0;
    
    cart.forEach(item => {
        // Calculate item total
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        // Format prices
        const formattedPrice = item.price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        const formattedTotal = itemTotal.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Create cart item element
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.setAttribute('data-id', item.id);
        
        cartItem.innerHTML = `
            <div class="cart-item-product">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="cart-item-variant">${item.variant || ''}</p>
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
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Add event listeners to quantity buttons and remove buttons
    addCartItemEventListeners();
    
    // Update summary
    updateCartSummary(subtotal);
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
function updateCartItemQuantity(productId, quantity) {
    // Get cart from localStorage
    let cart = localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Find item in cart - handle different ID formats
    const itemIndex = cart.findIndex(item => {
        const itemId = item.id;
        return itemId === productId || itemId === productId.toString() || (parseInt(itemId) === parseInt(productId));
    });
    
    if (itemIndex !== -1) {
        // Update quantity
        cart[itemIndex].quantity = quantity;
        
        // Save cart to localStorage
        localStorage.setItem('dndCart', JSON.stringify(cart));
        
        // Update cart item total
        const cartItem = document.querySelector(`.cart-item[data-id="${productId}"]`);
        const itemTotal = cart[itemIndex].price * quantity;
        
        const formattedTotal = itemTotal.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        cartItem.querySelector('.cart-item-total').textContent = `₺${formattedTotal}`;
        
        // Update cart summary
        updateCartSummaryFromCart();
        
        // Show notification
        showNotification('Sepet güncellendi', 'success');
    }
}

// Remove cart item
function removeCartItem(productId) {
    // Get cart from localStorage
    let cart = localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Find item in cart - handle different ID formats
    const itemIndex = cart.findIndex(item => {
        const itemId = item.id;
        return itemId === productId || itemId === productId.toString() || (parseInt(itemId) === parseInt(productId));
    });
    
    if (itemIndex !== -1) {
        // Get item name for notification
        const itemName = cart[itemIndex].name;
        
        // Remove item from cart
        cart.splice(itemIndex, 1);
        
        // Save cart to localStorage
        localStorage.setItem('dndCart', JSON.stringify(cart));
        
        // Remove cart item element
        const cartItem = document.querySelector(`.cart-item[data-id="${productId}"]`);
        cartItem.remove();
        
        // Update cart count
        updateCartCount();
        
        // Update cart summary
        updateCartSummaryFromCart();
        
        // Show notification
        showNotification(`"${itemName}" sepetten çıkarıldı`, 'info');
        
        // Check if cart is empty
        if (cart.length === 0) {
            // Reload page to show empty cart message
            location.reload();
        }
    }
}

// Update cart summary from cart items
function updateCartSummaryFromCart() {
    // Get cart from localStorage
    let cart = localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Calculate subtotal
    let subtotal = 0;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    // Update summary
    updateCartSummary(subtotal);
}

// Update cart summary
function updateCartSummary(subtotal) {
    // Format subtotal
    const formattedSubtotal = subtotal.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Update subtotal
    document.getElementById('subtotal').textContent = `₺${formattedSubtotal}`;
    
    // Calculate shipping
    let shipping = 0;
    
    if (subtotal > 0 && subtotal < 500) {
        shipping = 29.99;
    }
    
    // Format shipping
    const formattedShipping = shipping.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Update shipping
    document.getElementById('shipping').textContent = shipping > 0 ? `₺${formattedShipping}` : 'Ücretsiz';
    
    // Calculate total
    const total = subtotal + shipping;
    
    // Format total
    const formattedTotal = total.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Update total
    document.getElementById('total').textContent = `₺${formattedTotal}`;
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
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
    
    // Apply global image error handler if available
    if (window.ImageService && typeof window.ImageService.applyImageErrorHandler === 'function') {
        window.ImageService.applyImageErrorHandler();
    }
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
        imageUrl = item.image || '/images/placeholder-product.jpg';
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
                <img src="${imageUrl}" alt="${item.name}">
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
            
            // Get color and size options if they exist
            const colorElement = cartItem.querySelector('.cart-item-variant');
            let color = null;
            let size = null;
            
            if (colorElement) {
                const variantText = colorElement.textContent;
                
                // Extract color if it exists
                const colorMatch = variantText.match(/Renk: ([^|]+)/);
                if (colorMatch && colorMatch[1]) {
                    color = colorMatch[1].trim();
                }
                
                // Extract size if it exists
                const sizeMatch = variantText.match(/Beden: ([^|]+)/);
                if (sizeMatch && sizeMatch[1]) {
                    size = sizeMatch[1].trim();
                }
            }
            
            // Get the product name as fallback identifier
            const nameElement = cartItem.querySelector('.cart-item-details h3');
            const name = nameElement ? nameElement.textContent.trim() : null;
            
            // Show confirmation dialog
            if (confirm('Bu ürünü sepetten çıkarmak istediğinize emin misiniz?')) {
                // Remove the item with all available identifiers
                removeCartItem(productId, { 
                    color, 
                    size, 
                    name,
                    element: cartItem // Pass the DOM element as a fallback
                });
            }
        });
    });
}

// Update cart item quantity with improved validation and feedback
function updateCartItemQuantity(itemId, quantity, options = {}) {
    try {
        // Validate quantity input
        const parsedQuantity = parseInt(quantity);
        
        if (isNaN(parsedQuantity)) {
            showNotification('Lütfen geçerli bir miktar girin.', 'error');
            // Reset the input to the current quantity
            const cartItem = document.querySelector(`.cart-item[data-id="${itemId}"]`);
            if (cartItem) {
                const quantityInput = cartItem.querySelector('.quantity-input');
                if (quantityInput) {
                    // Find the current quantity from cart
                    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                    const item = cart.find(i => {
                        if (i.id !== itemId) return false;
                        if (options.color && i.color !== options.color) return false;
                        if (options.size && i.size !== options.size) return false;
                        return true;
                    });
                    
                    if (item) {
                        quantityInput.value = item.quantity;
                    }
                }
            }
            return;
        }
        
        if (parsedQuantity < 0) {
            showNotification('Miktar 0\'dan az olamaz.', 'error');
            return;
        }
        
        // Show updating feedback
        const cartItem = document.querySelector(`.cart-item[data-id="${itemId}"]`);
        if (cartItem) {
            cartItem.classList.add('updating');
        }
        
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
        
        if (itemIndex === -1) {
            showNotification('Ürün sepette bulunamadı.', 'error');
            return;
        }
        
        // Store old quantity for undo functionality
        const oldQuantity = cart[itemIndex].quantity;
        
        // Update quantity
        cart[itemIndex].quantity = parsedQuantity;
        
        // Remove item if quantity is 0
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
            
            // Remove item from DOM if it exists
            if (cartItem) {
                cartItem.classList.add('removing');
                setTimeout(() => {
                    cartItem.remove();
                    
                    // Check if cart is empty
                    if (cart.length === 0) {
                        const cartItemsContainer = document.querySelector('.cart-items');
                        if (cartItemsContainer) {
                            cartItemsContainer.innerHTML = '<div class="empty-cart">Sepetiniz boş</div>';
                        }
                    }
                }, 300);
            }
        } else {
            // Update the subtotal in the DOM
            if (cartItem) {
                const subtotalElement = cartItem.querySelector('.cart-item-subtotal');
                if (subtotalElement) {
                    const price = cart[itemIndex].price;
                    const subtotal = price * parsedQuantity;
                    subtotalElement.textContent = `₺${subtotal.toFixed(2)}`;
                }
                
                // Remove updating class
                setTimeout(() => {
                    cartItem.classList.remove('updating');
                }, 300);
            }
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Update cart summary
        updateCartSummary();
        
        // Show success notification
        showNotification('Sepet güncellendi.', 'success');
        
    } catch (error) {
        console.error('Error updating cart item quantity:', error);
        showNotification('Sepet güncellenirken bir hata oluştu.', 'error');
        
        // Remove updating class if it exists
        const cartItem = document.querySelector(`.cart-item[data-id="${itemId}"]`);
        if (cartItem) {
            cartItem.classList.remove('updating');
        }
    }
}

// Remove cart item with improved functionality and user feedback
function removeCartItem(itemId, options = {}) {
    try {
        console.log(`Removing item ${itemId} from cart with options:`, options);
        
        // Get cart from localStorage - check both possible locations
        let cart = localStorage.getItem('cart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Log initial cart state for debugging
        console.log('Initial cart state:', JSON.stringify(cart));
        
        // Debug output DOM element if provided
        if (options.element) {
            console.log('Element to remove:', options.element);
            console.log('Element data-id:', options.element.getAttribute('data-id'));
        }
        
        // Handle case when itemId is undefined but we're trying to remove by index
        if (itemId === undefined && options.index !== undefined) {
            // Remove by index
            if (options.index >= 0 && options.index < cart.length) {
                const removedItem = cart[options.index];
                cart.splice(options.index, 1);
                
                // Save updated cart
                localStorage.setItem('cart', JSON.stringify(cart));
                if (localStorage.getItem('dndCart')) {
                    localStorage.setItem('dndCart', JSON.stringify(cart));
                }
                
                // Update UI
                updateCartAfterRemoval(cart, removedItem);
                
                return true;
            } else {
                console.error(`Invalid index: ${options.index}`);
                displayNotification('Geçersiz ürün indeksi.', 'error');
                return false;
            }
        }
        
        // If no ID provided, try to find by name or other properties
        let itemIndex = -1;
        
        if (itemId === undefined) {
            // Try to identify the item by other means
            if (options.element) {
                // Get the index from the DOM element
                const element = options.element;
                if (element.getAttribute('data-id')) {
                    // Try to find by data-id attribute
                    const elementId = element.getAttribute('data-id');
                    console.log(`Trying to find item by data-id: ${elementId}`);
                    itemId = elementId; // Use the element's ID to find the item
                } else {
                    // Get the index from the DOM element
                    itemIndex = Array.from(element.parentNode.children).indexOf(element);
                    console.log(`Item DOM index: ${itemIndex}`);
                    
                    if (itemIndex >= 0 && itemIndex < cart.length) {
                        // Found by DOM element position
                        const removedItem = cart[itemIndex];
                        cart.splice(itemIndex, 1);
                        
                        // Save updated cart
                        localStorage.setItem('cart', JSON.stringify(cart));
                        if (localStorage.getItem('dndCart')) {
                            localStorage.setItem('dndCart', JSON.stringify(cart));
                        }
                        
                        // Update UI
                        updateCartAfterRemoval(cart, removedItem);
                        
                        return true;
                    }
                }
            } 
            
            // If still not found and we have a name or other identifiers
            if (options.name) {
                itemIndex = cart.findIndex(item => item.name === options.name);
            }
        }
        
        // If itemId is now defined, find by ID with improved matching
        if (itemId !== undefined) {
            console.log(`Searching for item with ID: ${itemId}`);
            
            // Find by ID with improved matching
            itemIndex = cart.findIndex(item => {
                // Convert both IDs to strings for comparison to handle both string and number IDs
                const cartItemId = String(item.id || '');
                const targetItemId = String(itemId || '');
                
                console.log(`Comparing ${cartItemId} === ${targetItemId}`);
                
                if (cartItemId !== targetItemId) return false;
                
                // Check if options match if provided
                if (options.color && item.color && item.color !== options.color) return false;
                if (options.size && item.size && item.size !== options.size) return false;
                
                return true;
            });
        }
        
        console.log(`Item index found: ${itemIndex}`);
        
        if (itemIndex === -1) {
            console.error(`Item with ID ${itemId} not found in cart`);
            
            // Fallback: Try a less strict matching
            console.log('Trying less strict matching...');
            itemIndex = cart.findIndex(item => {
                // Convert IDs to strings and use includes for partial matching
                const cartItemId = String(item.id || '');
                const targetItemId = String(itemId || '');
                
                if (cartItemId.includes(targetItemId) || targetItemId.includes(cartItemId)) {
                    return true;
                }
                
                // Try matching by name if available
                if (options.name && item.name && item.name === options.name) {
                    return true;
                }
                
                return false;
            });
            
            if (itemIndex === -1) {
                // Still not found, fallback to removing the first item
                if (cart.length > 0) {
                    console.log('Fallback: removing first item in cart');
                    itemIndex = 0;
                } else {
                    displayNotification('Ürün sepette bulunamadı.', 'error');
                    return false;
                }
            }
        }
        
        // Get item details before removing for notification
        const removedItem = cart[itemIndex];
        console.log('Found item to remove:', removedItem);
        
        // Remove item from cart
        cart.splice(itemIndex, 1);
        
        // Log updated cart for debugging
        console.log('Updated cart state:', JSON.stringify(cart));
        
        // Save cart to localStorage - both locations for compatibility
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // If old storage key is being used, update it too
        if (localStorage.getItem('dndCart')) {
            localStorage.setItem('dndCart', JSON.stringify(cart));
        }
        
        // Update UI
        updateCartAfterRemoval(cart, removedItem);
        
        return true;
    } catch (error) {
        console.error('Error removing cart item:', error);
        displayNotification(`Ürün silinirken bir hata oluştu: ${error.message}`, 'error');
        return false;
    }
}

// Helper function to update UI after cart item removal
function updateCartAfterRemoval(cart, removedItem) {
    // Log the removal attempt
    console.log('Updating cart UI after removing item:', removedItem);
    
    // Remove the cart item from DOM directly for immediate feedback
    const cartItems = document.querySelectorAll('.cart-item');
    console.log(`Found ${cartItems.length} cart items in DOM`);
    
    if (cartItems.length > 0) {
        // Find all potential matching elements (might be multiple with same ID/properties)
        let removedFromDOM = false;
        
        // First try to remove by data-id
        if (removedItem && removedItem.id) {
            console.log(`Looking for cart item with data-id="${removedItem.id}"`);
            const matchingItem = document.querySelector(`.cart-item[data-id="${removedItem.id}"]`);
            if (matchingItem) {
                console.log('Found matching item by ID, removing from DOM');
                animateAndRemoveElement(matchingItem);
                removedFromDOM = true;
            }
        }
        
        // If not found by ID, try by name
        if (!removedFromDOM && removedItem && removedItem.name) {
            console.log(`Looking for cart item with name "${removedItem.name}"`);
            const matchingItems = document.querySelectorAll('.cart-item');
            
            for (const item of matchingItems) {
                const nameElement = item.querySelector('.cart-item-details h3');
                if (nameElement && nameElement.textContent.trim() === removedItem.name) {
                    console.log('Found matching item by name, removing from DOM');
                    animateAndRemoveElement(item);
                    removedFromDOM = true;
                    break;
                }
            }
        }
        
        // If still not found, just remove the first one as fallback
        if (!removedFromDOM && cartItems.length > 0) {
            console.log('No exact match found, removing first cart item as fallback');
            animateAndRemoveElement(cartItems[0]);
        }
    }
    
    // Check if cart is now empty
    updateEmptyCartState(cart);
    
    // Update cart count in header
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    } else {
        console.log('updateCartCount function not available');
        // Simple fallback for updating cart count
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cart.length;
        }
    }
    
    // Update cart summary
    updateCartSummary();
    
    // Show success notification
    displayNotification(`${removedItem && removedItem.name ? removedItem.name : 'Ürün'} sepetten çıkarıldı.`, 'success');
}

// Helper to animate and remove an element
function animateAndRemoveElement(element) {
    if (!element) {
        console.error('Tried to animate and remove a null element');
        return;
    }
    
    console.log('Animating removal of element:', element);
    
    // Add the removing class for animation
    element.classList.add('removing');
    
    // Make sure the element gets the style instantly
    element.style.opacity = '0';
    element.style.transform = 'translateX(20px)';
    element.style.transition = 'all 300ms ease-out';
    
    // Force a reflow to ensure animation starts
    void element.offsetWidth;
    
    // Remove after animation completes
    setTimeout(() => {
        console.log('Animation timeout completed, removing element');
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        } else {
            console.log('Element was already removed or has no parent');
        }
    }, 350); // Slightly longer than transition to ensure it completes
}

// Helper to update cart state when empty
function updateEmptyCartState(cart) {
    if (cart.length === 0) {
        const cartItemsContainer = document.querySelector('.cart-items');
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = '';
            
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
        }
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

// Show notification - renamed to displayNotification to avoid conflicts with window.showNotification
function displayNotification(message, type) {
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

// Keep the original function name for backwards compatibility but make it call the new function
function showNotification(message, type) {
    displayNotification(message, type);
} 
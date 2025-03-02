/**
 * DnD Brand E-commerce - Product Detail Page Functionality
 * Displays product details from admin panel
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        // Load product details
        loadProductDetails(parseInt(productId));
    } else {
        // Redirect to shop page if no product ID
        window.location.href = 'shop.html';
    }
    
    // Initialize cart count
    updateCartCount();
});

// Get products from localStorage
function getProducts() {
    return storageManager.getProducts();
}

// Load product details
function loadProductDetails(productId) {
    // Get products from localStorage
    const products = getProducts();
    
    // Find product by ID
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        // Product not found, redirect to shop page
        window.location.href = 'shop.html';
        return;
    }
    
    // Update page title
    document.title = `${product.name} | DnD Brand`;
    
    // Update product details
    updateProductDetails(product);
    
    // Initialize product functionality
    initializeProductFunctionality(product);
}

// Update product details in the DOM
function updateProductDetails(product) {
    // Product title
    const productTitle = document.querySelector('.product-title');
    if (productTitle) {
        productTitle.textContent = product.name;
    }
    
    // Product price
    const productPrice = document.querySelector('.product-price');
    if (productPrice) {
        productPrice.textContent = `₺${product.price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
    
    // Product description
    const productDescription = document.querySelector('.product-description');
    if (productDescription) {
        productDescription.textContent = product.description;
    }
    
    // Product SKU
    const productSku = document.querySelector('.product-sku');
    if (productSku) {
        productSku.textContent = product.sku;
    }
    
    // Product category
    const productCategory = document.querySelector('.product-category');
    if (productCategory) {
        const categoryMap = {
            'erkek': 'Erkek',
            'kadin': 'Kadın',
            'aksesuar': 'Aksesuar',
            'ayakkabi': 'Ayakkabı',
            'canta': 'Çanta'
        };
        productCategory.textContent = categoryMap[product.category] || product.category;
    }
    
    // Product availability
    const productAvailability = document.querySelector('.product-availability');
    if (productAvailability) {
        if (product.stock > 0) {
            productAvailability.textContent = 'Stokta';
            productAvailability.classList.add('in-stock');
            productAvailability.classList.remove('out-of-stock');
        } else {
            productAvailability.textContent = 'Tükendi';
            productAvailability.classList.add('out-of-stock');
            productAvailability.classList.remove('in-stock');
        }
    }
    
    // Product colors
    const colorOptions = document.querySelector('.color-options');
    if (colorOptions && product.colors && product.colors.length > 0) {
        colorOptions.innerHTML = '';
        product.colors.forEach(color => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.setAttribute('data-color', color);
            colorOption.style.backgroundColor = getColorCode(color);
            colorOptions.appendChild(colorOption);
        });
    }
    
    // Product sizes
    const sizeOptions = document.querySelector('.size-options');
    if (sizeOptions && product.sizes && product.sizes.length > 0) {
        sizeOptions.innerHTML = '';
        product.sizes.forEach(size => {
            const sizeOption = document.createElement('div');
            sizeOption.className = 'size-option';
            sizeOption.setAttribute('data-size', size);
            sizeOption.textContent = size.toUpperCase();
            sizeOptions.appendChild(sizeOption);
        });
    }
    
    // Product images
    const mainImage = document.querySelector('.main-image img');
    if (mainImage) {
        mainImage.src = product.images[0];
        mainImage.alt = product.name;
    }
    
    // Thumbnails
    const thumbnailsContainer = document.querySelector('.thumbnails');
    if (thumbnailsContainer && product.images && product.images.length > 0) {
        thumbnailsContainer.innerHTML = '';
        product.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            if (index === 0) {
                thumbnail.classList.add('active');
            }
            thumbnail.innerHTML = `<img src="${image}" alt="${product.name} - Görsel ${index + 1}">`;
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    // Add to cart button
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        if (product.stock > 0) {
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = 'Sepete Ekle';
        } else {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Tükendi';
        }
    }
}

// Initialize product functionality
function initializeProductFunctionality(product) {
    // Color options
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            colorOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
        });
    });
    
    // Size options
    const sizeOptions = document.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
        });
    });
    
    // Thumbnails
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.main-image img');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Remove active class from all thumbnails
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            this.classList.add('active');
            
            // Update main image
            const thumbnailImg = this.querySelector('img');
            mainImage.src = thumbnailImg.src;
        });
    });
    
    // Quantity controls
    const quantityInput = document.querySelector('.quantity-input');
    const increaseBtn = document.querySelector('.increase-quantity');
    const decreaseBtn = document.querySelector('.decrease-quantity');
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            if (quantityInput) {
                quantityInput.value = parseInt(quantityInput.value) + 1;
            }
        });
    }
    
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            if (quantityInput && parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        });
    }
    
    // Add to cart button
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn && !addToCartBtn.disabled) {
        addToCartBtn.addEventListener('click', function() {
            // Get selected color
            const selectedColor = document.querySelector('.color-option.active');
            const color = selectedColor ? selectedColor.getAttribute('data-color') : null;
            
            // Get selected size
            const selectedSize = document.querySelector('.size-option.active');
            const size = selectedSize ? selectedSize.getAttribute('data-size') : null;
            
            // Get quantity
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
            
            // Validate selections if product has options
            if (product.colors && product.colors.length > 0 && !color) {
                showNotification('Lütfen bir renk seçin', 'error');
                return;
            }
            
            if (product.sizes && product.sizes.length > 0 && !size) {
                showNotification('Lütfen bir beden seçin', 'error');
                return;
            }
            
            // Add to cart
            addToCart(product, quantity, color, size);
        });
    }
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

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `product-notification ${type}`;
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
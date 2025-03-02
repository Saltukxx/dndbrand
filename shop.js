/**
 * DnD Brand E-commerce - Shop Page Functionality
 * Displays products from admin panel on the shop page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load products from localStorage
    loadProducts();
    
    // Initialize filters
    initializeFilters();
    
    // Initialize mobile filter toggle
    initializeMobileFilters();
    
    // Initialize price slider
    initializePriceSlider();
});

// Get products from localStorage
function getProducts() {
    return storageManager.getProducts();
}

// Load products to the shop page
function loadProducts() {
    debugProducts();
    
    // Add temporary styles to make products visible
    const style = document.createElement('style');
    style.textContent = `
        .products-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 30px !important;
            margin-top: 30px !important;
        }
        
        .product-card {
            background-color: #1a1a1a !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: 400px !important;
        }
        
        .product-image {
            height: 280px !important;
            background-color: #222 !important;
        }
        
        .product-info {
            padding: 15px !important;
        }
        
        .product-actions {
            padding: 0 15px 15px !important;
        }
    `;
    document.head.appendChild(style);
    
    const productsContainer = document.querySelector('.products-grid');
    if (!productsContainer) return;
    
    // Get products from localStorage
    const products = getProducts();
    
    // Filter active products only
    const activeProducts = products.filter(product => product.status === 'active');
    
    // Clear container
    productsContainer.innerHTML = '';
    
    // Update product count
    const productCountElement = document.getElementById('productCount');
    if (productCountElement) {
        productCountElement.textContent = activeProducts.length;
    }
    
    // Check if there are products
    if (activeProducts.length === 0) {
        productsContainer.innerHTML = '<div class="no-products"><p>Henüz ürün bulunmamaktadır.</p><p>Yakında yeni ürünlerimiz eklenecektir.</p></div>';
        return;
    }
    
    // Add products to container
    activeProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
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
    const price = product.price.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Ensure product has images
    const productImage = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZm9udC13ZWlnaHQ9IjUwMCI+VXJ1biBHb3JzZWxpPC90ZXh0Pjwvc3ZnPg==';
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${productImage}" alt="${product.name}">
            ${product.featured ? '<span class="featured-badge">Öne Çıkan</span>' : ''}
            ${product.stock === 0 ? '<span class="out-of-stock-badge">Tükendi</span>' : ''}
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">₺${price}</p>
            <div class="product-colors">
                ${product.colors && product.colors.map ? product.colors.map(color => `<span class="color-dot ${color}" title="${color}"></span>`).join('') : ''}
            </div>
        </div>
        <div class="product-actions">
            <a href="product.html?id=${product.id}" class="view-product">Ürünü İncele</a>
            ${product.stock > 0 ? '<button class="add-to-cart">Sepete Ekle</button>' : '<button class="add-to-cart disabled" disabled>Tükendi</button>'}
        </div>
    `;
    
    // Add event listener for add to cart button
    const addToCartBtn = card.querySelector('.add-to-cart');
    if (addToCartBtn && !addToCartBtn.disabled) {
        addToCartBtn.addEventListener('click', function() {
            addToCart(product);
        });
    }
    
    return card;
}

// Initialize filters
function initializeFilters() {
    // Filter titles toggle
    const filterTitles = document.querySelectorAll('.filter-title');
    
    filterTitles.forEach(title => {
        title.addEventListener('click', function() {
            const content = this.nextElementSibling;
            
            this.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
    });
    
    // Category filters
    const categoryFilters = document.querySelectorAll('.category-filter');
    
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            const checkbox = this.querySelector('input[type="checkbox"]');
            
            // Toggle checkbox
            checkbox.checked = !checkbox.checked;
            
            // If "All Products" is checked, uncheck others
            if (checkbox.id === 'category-all' && checkbox.checked) {
                categoryFilters.forEach(f => {
                    if (f.querySelector('input').id !== 'category-all') {
                        f.querySelector('input').checked = false;
                        f.classList.remove('active');
                    }
                });
            }
            
            // If any other category is checked, uncheck "All Products"
            if (checkbox.id !== 'category-all' && checkbox.checked) {
                document.getElementById('category-all').checked = false;
                document.querySelector('.category-filter.active').classList.remove('active');
            }
            
            // Toggle active class
            this.classList.toggle('active', checkbox.checked);
            
            // Apply filters
            applyFilters();
        });
    });
    
    // Color filters
    const colorFilters = document.querySelectorAll('.color-filter');
    
    colorFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Apply filters
            applyFilters();
        });
    });
    
    // Apply filters button
    const applyButton = document.querySelector('.apply-filters');
    
    if (applyButton) {
        applyButton.addEventListener('click', function() {
            applyFilters();
            
            // Close mobile filters
            document.querySelector('.shop-filters').classList.remove('active');
            document.querySelector('.filter-overlay').classList.remove('active');
        });
    }
    
    // Reset filters button
    const resetButton = document.querySelector('.reset-filters');
    
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            // Reset category filters
            categoryFilters.forEach(filter => {
                const checkbox = filter.querySelector('input[type="checkbox"]');
                
                if (checkbox.id === 'category-all') {
                    checkbox.checked = true;
                    filter.classList.add('active');
                } else {
                    checkbox.checked = false;
                    filter.classList.remove('active');
                }
            });
            
            // Reset color filters
            colorFilters.forEach(filter => {
                filter.classList.remove('active');
            });
            
            // Reset price slider
            const slider = document.getElementById('price-slider');
            if (slider && slider.noUiSlider) {
                slider.noUiSlider.set([0, 5000]);
            }
            
            // Apply filters
            applyFilters();
        });
    }
}

// Initialize mobile filters
function initializeMobileFilters() {
    const mobileToggle = document.querySelector('.mobile-filter-toggle');
    const filterClose = document.querySelector('.filter-close');
    const filterOverlay = document.querySelector('.filter-overlay');
    const shopFilters = document.querySelector('.shop-filters');
    
    if (mobileToggle && filterClose && filterOverlay && shopFilters) {
        mobileToggle.addEventListener('click', function() {
            shopFilters.classList.add('active');
            filterOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        filterClose.addEventListener('click', function() {
            shopFilters.classList.remove('active');
            filterOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        filterOverlay.addEventListener('click', function() {
            shopFilters.classList.remove('active');
            filterOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

// Initialize price slider
function initializePriceSlider() {
    const slider = document.getElementById('price-slider');
    
    if (slider && typeof noUiSlider !== 'undefined') {
        noUiSlider.create(slider, {
            start: [0, 5000],
            connect: true,
            step: 100,
            range: {
                'min': 0,
                'max': 5000
            },
            format: {
                to: function (value) {
                    return Math.round(value);
                },
                from: function (value) {
                    return Number(value);
                }
            }
        });
        
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        
        slider.noUiSlider.on('update', function (values, handle) {
            if (handle === 0) {
                minPriceInput.value = values[0];
            } else {
                maxPriceInput.value = values[1];
            }
        });
        
        minPriceInput.addEventListener('change', function () {
            slider.noUiSlider.set([this.value, null]);
        });
        
        maxPriceInput.addEventListener('change', function () {
            slider.noUiSlider.set([null, this.value]);
        });
    }
}

// Apply filters
function applyFilters() {
    // In a real application, this would filter the products based on the selected filters
    // For this example, we'll just log the selected filters
    
    // Get selected categories
    const selectedCategories = [];
    document.querySelectorAll('.category-filter input:checked').forEach(checkbox => {
        selectedCategories.push(checkbox.id.replace('category-', ''));
    });
    
    // Get selected colors
    const selectedColors = [];
    document.querySelectorAll('.color-filter.active').forEach(color => {
        selectedColors.push(color.getAttribute('title'));
    });
    
    // Get price range
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    
    console.log('Selected Categories:', selectedCategories);
    console.log('Selected Colors:', selectedColors);
    console.log('Price Range:', minPrice, '-', maxPrice);
    
    // Show notification
    showNotification('Filtreler uygulandı', 'success');
}

// Sort products
function sortProducts(products, sortBy) {
    return [...products].sort((a, b) => {
        switch (sortBy) {
            case 'price-asc':
                return a.price - b.price;
            case 'price-desc':
                return b.price - a.price;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'featured':
            default:
                // Featured products first, then by id (newest first)
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return b.id - a.id; // Newer products first
        }
    });
}

// Display filtered products
function displayFilteredProducts(products) {
    const productsContainer = document.querySelector('.products-grid');
    if (!productsContainer) return;
    
    // Clear container
    productsContainer.innerHTML = '';
    
    // Update product count
    const productCountElement = document.getElementById('productCount');
    if (productCountElement) {
        productCountElement.textContent = products.length;
    }
    
    // Check if there are products
    if (products.length === 0) {
        productsContainer.innerHTML = '<div class="no-products"><p>Aradığınız kriterlere uygun ürün bulunamadı.</p><p>Lütfen filtrelerinizi değiştirin.</p></div>';
        return;
    }
    
    // Add products to container
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
    
    // Initialize product card interactions
    initializeProductCards();
}

// Add product to cart
function addToCart(product) {
    // Get cart from localStorage
    let cart = localStorage.getItem('dndCart');
    cart = cart ? JSON.parse(cart) : [];
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === product.id);
    
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

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `shop-notification ${type}`;
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

// Initialize product card interactions
function initializeProductCards() {
    // Add hover effects
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // Add to cart button
        const addToCartBtn = card.querySelector('.add-to-cart');
        if (addToCartBtn && !addToCartBtn.classList.contains('disabled')) {
            addToCartBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = parseInt(card.getAttribute('data-id'));
                const products = getProducts();
                const product = products.find(p => p.id === productId);
                
                if (product) {
                    addToCart(product);
                }
            });
        }
        
        // Make entire card clickable
        card.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            window.location.href = `product.html?id=${productId}`;
        });
    });
}

// Add this debugging function to shop.js
function debugProducts() {
    console.log('Debugging products...');
    
    // Get products from localStorage
    const products = getProducts();
    console.log('All products:', products);
    
    // Filter active products
    const activeProducts = products.filter(product => product.status === 'active');
    console.log('Active products:', activeProducts);
    
    // Check if products container exists
    const productsContainer = document.querySelector('.products-grid');
    console.log('Products container:', productsContainer);
    
    // Debug CSS
    console.log('Products grid CSS:', window.getComputedStyle(productsContainer));
    
    // Check if product cards are being added
    const productCards = productsContainer.querySelectorAll('.product-card');
    console.log('Product cards:', productCards);
    
    if (productCards.length > 0) {
        console.log('First product card CSS:', window.getComputedStyle(productCards[0]));
    }
}

// Add this function to handle sorting
function applySorting(sortType) {
    const productsContainer = document.querySelector('.products-grid');
    if (!productsContainer) return;
    
    // Get all product cards
    const productCards = Array.from(productsContainer.querySelectorAll('.product-card'));
    if (productCards.length === 0) return;
    
    // Get products data
    const products = getProducts();
    
    // Sort product cards
    productCards.sort((a, b) => {
        const aId = parseInt(a.getAttribute('data-id'));
        const bId = parseInt(b.getAttribute('data-id'));
        
        const aProduct = products.find(p => p.id === aId);
        const bProduct = products.find(p => p.id === bId);
        
        if (!aProduct || !bProduct) return 0;
        
        switch (sortType) {
            case 'price-asc':
                return aProduct.price - bProduct.price;
            case 'price-desc':
                return bProduct.price - aProduct.price;
            case 'name-asc':
                return aProduct.name.localeCompare(bProduct.name);
            case 'name-desc':
                return bProduct.name.localeCompare(aProduct.name);
            case 'featured':
                return (bProduct.featured ? 1 : 0) - (aProduct.featured ? 1 : 0);
            default:
                return 0;
        }
    });
    
    // Reorder product cards in the DOM
    productCards.forEach(card => {
        productsContainer.appendChild(card);
    });
}

// Initialize product grid
function initializeProductGrid() {
    // This would load products from the server or localStorage
    // For this example, we'll just add event listeners to the existing products
    
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productCard = this.closest('.product-card');
            const productId = productCard.getAttribute('data-id');
            const productName = productCard.querySelector('h3').textContent;
            
            // Add to cart
            addToCart(productId);
            
            // Show notification
            showNotification(`"${productName}" sepete eklendi`, 'success');
        });
    });
} 
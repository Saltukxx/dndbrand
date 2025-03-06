/**
 * DnD Brand E-commerce - Product Detail Page Functionality
 * Displays product details from backend API
 */

// API URL from config
const API_URL = window.CONFIG && window.CONFIG.API_URL 
    ? window.CONFIG.API_URL 
    : 'https://dndbrand-server.onrender.com/api';

document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        // Load product details
        loadProductDetails(productId);
    } else {
        // Show error message
        const productDetailContainer = document.getElementById('product-detail');
        if (productDetailContainer) {
            productDetailContainer.innerHTML = `
                <div class="error-message">
                    <h2>Ürün bulunamadı</h2>
                    <p>Lütfen geçerli bir ürün seçin.</p>
                    <a href="shop.html" class="btn">Mağazaya Dön</a>
                </div>
            `;
        }
    }
    
    // Ensure cart icon navigates to cart page
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            // Only navigate if clicking on the icon or "Sepet" text, not the preview
            if (e.target.classList.contains('fa-shopping-bag') || 
                (e.target.tagName === 'SPAN' && e.target.textContent === 'Sepet')) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'cart.html';
            }
        });
    }
    
    // Make sure "Sepeti Görüntüle" link works
    const viewCartLink = document.querySelector('.view-cart');
    if (viewCartLink) {
        viewCartLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'cart.html';
        });
    }
    
    // Make sure "Ödeme" link works
    const checkoutLink = document.querySelector('.checkout');
    if (checkoutLink) {
        checkoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'checkout.html';
        });
    }
    
    // Initialize cart preview
    updateCartCount();
    updateCartPreview();
    
    // Add event listeners for cart preview item removal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cart-preview-item-remove')) {
            const itemId = e.target.dataset.id;
            if (itemId) {
                removeFromCart(itemId);
            }
        }
    });
});

// Helper function to get the correct image path
function getProductImage(imagePath, useOriginal = false) {
    if (!imagePath) {
        return '/img/no-image.jpg';
    }
    
    // If it's already a full URL, return it as is
    if (typeof imagePath === 'string' && (imagePath.startsWith('http') || imagePath.startsWith('https'))) {
        return imagePath;
    }
    
    // If it's an object with thumbnail and original properties (new format)
    if (typeof imagePath === 'object') {
        if (useOriginal && imagePath.original) {
            imagePath = imagePath.original;
        } else if (imagePath.thumbnail) {
            imagePath = imagePath.thumbnail;
        } else if (imagePath.original) {
            imagePath = imagePath.original;
        } else if (imagePath.url) {
            imagePath = imagePath.url;
        } else {
            return '/img/no-image.jpg';
        }
    }
    
    // If it's an upload path, use it directly from the server root
    if (typeof imagePath === 'string' && imagePath.includes('/uploads/')) {
        // Make sure we don't duplicate the /uploads/ part
        if (imagePath.startsWith('/api/uploads/')) {
            return imagePath.replace('/api/uploads/', '/uploads/');
        }
        // Make sure the path starts with a slash
        if (!imagePath.startsWith('/')) {
            return '/' + imagePath;
        }
        return imagePath;
    } 
    
    // For other API paths, add the API_URL
    if (typeof imagePath === 'string') {
    if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
    }
    return `${API_URL}${imagePath}`;
    }
    
    return '/img/no-image.jpg';
}

// Fetch product details from API
async function fetchProductDetails(productId) {
    try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${API_URL}/products/${productId}?_=${timestamp}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for different response formats
        if (data.success && data.data) {
            return data.data;
        } else if (!data.success && data.error) {
            // Format: { success: false, error: '...' }
            console.error('API error:', data.error);
            return null;
        } else if (data._id) {
            return data;
        } else if (data.product) {
            return data.product;
        } else if (Array.isArray(data)) {
            // Format: Array of products, find by ID
            return data.find(product => product._id === productId || product.id === productId);
        } else {
            console.error('Unknown API response format:', data);
            
            // Try fallback approach - fetch all products and find by ID
            return await fetchAllProductsAndFindById(productId);
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        
        // Try fallback approach - fetch all products and find by ID
        return await fetchAllProductsAndFindById(productId);
    }
}

// Fallback function to fetch all products and find by ID
async function fetchAllProductsAndFindById(productId) {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        let products = [];
        if (data.success && Array.isArray(data.data)) {
            products = data.data;
        } else if (Array.isArray(data)) {
            products = data;
        }
        
        return products.find(product => product._id === productId || product.id === productId);
    } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
        return null;
    }
}

// Load product details
async function loadProductDetails(productId) {
    // Show loading
    const productDetailElement = document.getElementById('product-detail');
    productDetailElement.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Ürün yükleniyor...</p>
        </div>
    `;
    
    try {
        // Fetch product details
    const product = await fetchProductDetails(productId);
    
    if (!product) {
            productDetailElement.innerHTML = `
                <div class="error-message">
                    <p>Ürün bulunamadı.</p>
                    <a href="shop.html" class="btn">Mağazaya Dön</a>
                </div>
            `;
        return;
    }
    
    // Update page title
        document.title = `${product.name} - DnD Brand`;
        
        // Update breadcrumb
        const breadcrumbProductName = document.querySelector('.breadcrumb-item.active');
        if (breadcrumbProductName) {
            breadcrumbProductName.textContent = product.name;
        }
        
        // Get product template
        const template = document.getElementById('product-template');
        const productContent = template.content.cloneNode(true);
        
        // Update product details
        updateProductDetails(productContent, product);
        
        // Clear loading and append product content
        productDetailElement.innerHTML = '';
        productDetailElement.appendChild(productContent);
        
        // Initialize product functionality
        initializeProductFunctionality(product);
        
        // Load related products
        loadRelatedProducts(product.category);
        
    } catch (error) {
        console.error('Error loading product details:', error);
        productDetailElement.innerHTML = `
            <div class="error-message">
                <p>Ürün yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>
                <a href="shop.html" class="btn">Mağazaya Dön</a>
            </div>
        `;
    }
}

// Update product details in template
function updateProductDetails(template, product) {
    // Update product title
    const titleElement = template.querySelector('.product-title');
    if (titleElement) titleElement.textContent = product.name;
    
    // Update product price
    const priceElement = template.querySelector('.product-price');
    if (priceElement) {
        const formattedPrice = product.price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        priceElement.textContent = `₺${formattedPrice}`;
    }
    
    // Update product description
    const descriptionElement = template.querySelector('.product-description');
    if (descriptionElement) descriptionElement.textContent = product.description;
    
    // Update product images
    updateProductImages(template, product);
    
    // Update product variants
    updateProductVariants(template, product);
    
    // Update additional info
    updateProductAdditionalInfo(template, product);
}

// Update product images
function updateProductImages(template, product) {
    const mainImageElement = template.querySelector('.main-image img');
    const thumbnailContainer = template.querySelector('.thumbnail-container');
    
    if (!mainImageElement || !thumbnailContainer) return;
    
    // Set main image
    const mainImageSrc = getProductImage(product);
    mainImageElement.src = mainImageSrc;
    mainImageElement.alt = product.name;
    
    // Clear thumbnails
    thumbnailContainer.innerHTML = '';
    
    // Add main image as first thumbnail
    const mainThumbnail = document.createElement('div');
    mainThumbnail.className = 'thumbnail active';
    mainThumbnail.innerHTML = `<img src="${mainImageSrc}" alt="${product.name}">`;
    thumbnailContainer.appendChild(mainThumbnail);
    
    // Add additional images as thumbnails
    if (product.additionalImages && Array.isArray(product.additionalImages)) {
        product.additionalImages.forEach((imagePath, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            
            // Get full image path
            const fullImagePath = imagePath.startsWith('http') ? 
                imagePath : 
                `../images/products/${imagePath}`;
            
            thumbnail.innerHTML = `<img src="${fullImagePath}" alt="${product.name} - Image ${index + 2}">`;
            thumbnailContainer.appendChild(thumbnail);
        });
    }
    
    // Add click event to thumbnails
    const thumbnails = thumbnailContainer.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Update active class
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update main image
            const thumbImg = this.querySelector('img');
            mainImageElement.src = thumbImg.src;
        });
    });
}

// Update product variants
function updateProductVariants(template, product) {
    const variantsContainer = template.querySelector('.product-variants');
    
    if (!variantsContainer) return;
    
    // Clear variants
    variantsContainer.innerHTML = '';
    
    // Check if product has variants
    if (!product.variants || Object.keys(product.variants).length === 0) {
        variantsContainer.style.display = 'none';
        return;
    }
    
    // Show variants container
    variantsContainer.style.display = 'block';
    
    // Add each variant group
    Object.entries(product.variants).forEach(([variantName, options]) => {
        const variantGroup = document.createElement('div');
        variantGroup.className = 'variant-group';
        variantGroup.dataset.variantName = variantName;
        
        // Add variant title
        const variantTitle = document.createElement('span');
        variantTitle.className = 'variant-title';
        variantTitle.textContent = variantName;
        variantGroup.appendChild(variantTitle);
        
        // Add variant options
        const variantOptions = document.createElement('div');
        variantOptions.className = 'variant-options';
        
        // Add options
        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'variant-option';
            optionElement.textContent = option;
            optionElement.dataset.value = option;
            
            // Add click event
            optionElement.addEventListener('click', function() {
                // Update selected class
                variantOptions.querySelectorAll('.variant-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
            });
            
            variantOptions.appendChild(optionElement);
        });
        
        // Select first option by default
        const firstOption = variantOptions.querySelector('.variant-option');
        if (firstOption) firstOption.classList.add('selected');
        
        variantGroup.appendChild(variantOptions);
        variantsContainer.appendChild(variantGroup);
    });
}

// Update product additional info
function updateProductAdditionalInfo(template, product) {
    // Description tab
    const descriptionTab = template.querySelector('#tab-description');
    if (descriptionTab) {
        if (product.description) {
            // Format description with paragraphs
            const formattedDescription = product.description
                .split('\n')
                .filter(paragraph => paragraph.trim() !== '')
                .map(paragraph => `<p>${paragraph}</p>`)
                .join('');
                
            descriptionTab.innerHTML = `
                <div class="enhanced-description">
                    ${formattedDescription}
                </div>
            `;
        } else {
            descriptionTab.innerHTML = '<p>Bu ürün için açıklama bulunmamaktadır.</p>';
        }
    }
    
    // Additional info tab
    const additionalInfoTab = template.querySelector('#tab-additional-info');
    if (additionalInfoTab) {
        let additionalInfoHtml = '';
        
        // Add SKU if available
        if (product.sku) {
            additionalInfoHtml += `
                <div class="info-item">
                    <span class="info-label">SKU:</span>
                    <span class="info-value">${product.sku}</span>
                </div>
            `;
        }
        
        // Add category if available
        if (product.category) {
            additionalInfoHtml += `
                <div class="info-item">
                    <span class="info-label">Kategori:</span>
                    <span class="info-value">${product.category}</span>
                </div>
            `;
        }
        
        // Add brand if available
        if (product.brand) {
            additionalInfoHtml += `
                <div class="info-item">
                    <span class="info-label">Marka:</span>
                    <span class="info-value">${product.brand}</span>
                </div>
            `;
        }
        
        // Add weight if available
        if (product.weight) {
            additionalInfoHtml += `
                <div class="info-item">
                    <span class="info-label">Ağırlık:</span>
                    <span class="info-value">${product.weight} kg</span>
                </div>
            `;
        }
        
        // Add dimensions if available
        if (product.dimensions) {
            additionalInfoHtml += `
                <div class="info-item">
                    <span class="info-label">Boyutlar:</span>
                    <span class="info-value">${product.dimensions}</span>
                </div>
            `;
        }
        
        // Add any other additional info
        if (product.additionalInfo && typeof product.additionalInfo === 'object') {
            Object.entries(product.additionalInfo).forEach(([key, value]) => {
                additionalInfoHtml += `
                    <div class="info-item">
                        <span class="info-label">${key}:</span>
                        <span class="info-value">${value}</span>
                    </div>
                `;
            });
        }
        
        if (additionalInfoHtml) {
            additionalInfoTab.innerHTML = `
                <div class="additional-info-container">
                    ${additionalInfoHtml}
                </div>
            `;
        } else {
            additionalInfoTab.innerHTML = '<p>Bu ürün için ek bilgi bulunmamaktadır.</p>';
        }
    }
    
    // Reviews tab
    const reviewsTab = template.querySelector('#tab-reviews');
    if (reviewsTab) {
        if (product.reviews && product.reviews.length > 0) {
            let reviewsHtml = '';
            
            product.reviews.forEach(review => {
                // Format date
                const reviewDate = new Date(review.date);
                const formattedDate = reviewDate.toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                // Generate stars
                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    if (i <= review.rating) {
                        stars += '<i class="fas fa-star"></i>';
                    } else {
                        stars += '<i class="far fa-star"></i>';
                    }
                }
                
                reviewsHtml += `
                    <div class="review">
                        <div class="review-header">
                            <div class="reviewer-info">
                                <h4>${review.name}</h4>
                                <span class="review-date">${formattedDate}</span>
                            </div>
                            <div class="review-rating">
                                ${stars}
                            </div>
                        </div>
                        <div class="review-content">
                            <p>${review.content}</p>
                        </div>
                    </div>
                `;
            });
            
            reviewsTab.innerHTML = reviewsHtml;
        } else {
            reviewsTab.innerHTML = '<p>Bu ürün için henüz yorum bulunmamaktadır.</p>';
        }
    }
}

// Initialize product functionality
function initializeProductFunctionality(product) {
    // Initialize quantity selector
    const quantityInput = document.querySelector('.quantity-input');
    const increaseBtn = document.querySelector('.quantity-increase');
    const decreaseBtn = document.querySelector('.quantity-decrease');
    
    if (quantityInput && increaseBtn && decreaseBtn) {
        // Set initial value
        quantityInput.value = 1;
        
        // Add event listeners
        increaseBtn.addEventListener('click', () => {
            quantityInput.value = parseInt(quantityInput.value) + 1;
        });
        
        decreaseBtn.addEventListener('click', () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        });
        
        // Prevent non-numeric input
        quantityInput.addEventListener('input', () => {
            const value = quantityInput.value.replace(/[^0-9]/g, '');
            quantityInput.value = value || 1;
        });
    }
    
    // Initialize add to cart button
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        // Update button text to "Sepete Ekle"
        addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Sepete Ekle';
        
        addToCartBtn.addEventListener('click', () => {
            // Get quantity
            const quantity = parseInt(quantityInput.value) || 1;
            
            // Get selected variants
            const selectedVariants = {};
            document.querySelectorAll('.variant-group').forEach(group => {
                const variantName = group.dataset.variantName;
                const selectedOption = group.querySelector('.variant-option.selected');
                if (variantName && selectedOption) {
                    selectedVariants[variantName] = selectedOption.dataset.value;
                }
            });
            
            // Add to cart
            addToCart(product, quantity, selectedVariants);
        });
    }
    
    // Remove wishlist button functionality
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.style.display = 'none';
    }
    
    // Initialize tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabs.length && tabContents.length) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Hide all tab contents
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // Show selected tab content
                const tabId = tab.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
        
        // Enhance the Açıklama tab content
        const descriptionTab = document.getElementById('tab-description');
        if (descriptionTab && product.description) {
            // Add more styling to the description content
            descriptionTab.innerHTML = `
                <div class="enhanced-description">
                    ${product.description}
                </div>
            `;
        }
    }
}

// Add to cart function
function addToCart(product, quantity, selectedVariants = {}) {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already exists in cart with same variants
    const existingProductIndex = cart.findIndex(item => {
        // Check if product ID matches
        if (item.id !== product.id) return false;
        
        // Check if variants match
        if (Object.keys(selectedVariants).length === 0 && Object.keys(item.variants || {}).length === 0) {
            return true;
        }
        
        // Compare variants
        const itemVariants = item.variants || {};
        return Object.keys(selectedVariants).every(key => 
            itemVariants[key] === selectedVariants[key]
        );
    });
    
    // If product exists, update quantity
    if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += quantity;
    } else {
        // Add new product to cart
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: getProductImage(product),
            quantity: quantity,
            variants: selectedVariants
        });
    }
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Update cart preview
    updateCartPreview();
    
    // Show notification
    showNotification(`${product.name} sepete eklendi!`, 'success');
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // Set notification type
    notification.className = `notification ${type}`;
    
    // Create notification content
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✓' : '✗'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">×</button>
        </div>
    `;
    
    // Add event listener to close button
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
    });
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Load related products
async function loadRelatedProducts(category) {
    const relatedProductsGrid = document.querySelector('.related-products-grid');
    if (!relatedProductsGrid) return;
    
    // Show loading
    relatedProductsGrid.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
        </div>
    `;
    
    try {
        // Fetch all products
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        
        let products = [];
        if (data.success && data.data) {
            products = data.data;
        } else if (Array.isArray(data)) {
            products = data;
        }
        
        if (!products.length) {
            relatedProductsGrid.innerHTML = '<p>İlgili ürün bulunamadı.</p>';
            return;
        }
        
        // Get current product ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        // Filter related products (same category, excluding current product)
        const relatedProducts = products
            .filter(p => p.category === category && p._id !== productId)
            .slice(0, 4); // Limit to 4 related products
        
        if (relatedProducts.length === 0) {
            // If no products in same category, just show random products
            const randomProducts = products
                .filter(p => p._id !== productId)
                .sort(() => 0.5 - Math.random())
                .slice(0, 4);
            
            displayRelatedProducts(randomProducts);
        } else {
            displayRelatedProducts(relatedProducts);
        }
    } catch (error) {
        console.error('Error loading related products:', error);
        relatedProductsGrid.innerHTML = '<p>İlgili ürünler yüklenirken bir hata oluştu.</p>';
    }
}

// Display related products
function displayRelatedProducts(products) {
    const relatedProductsGrid = document.querySelector('.related-products-grid');
    if (!relatedProductsGrid || !products || products.length === 0) return;
    
    // Clear existing content
    relatedProductsGrid.innerHTML = '';
    
    // Display up to 4 related products
    const displayProducts = products.slice(0, 4);
    
    // Create HTML for each product
    displayProducts.forEach(product => {
        // Format price
        const price = product.price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Create product card
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        productCard.innerHTML = `
            <div class="product-card-image">
                <img src="${getProductImage(product)}" alt="${product.name}">
            </div>
            <div class="product-card-info">
                <h3 class="product-card-title">${product.name}</h3>
                <div class="product-card-price">₺${price}</div>
                <div class="product-card-actions">
                    <button class="quick-view-btn" data-id="${product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="add-to-cart-quick-btn" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add to grid
        relatedProductsGrid.appendChild(productCard);
    });
    
    // Add event listeners for quick view buttons
    document.querySelectorAll('.quick-view-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            if (productId) {
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
    
    // Add event listeners for add to cart buttons
    document.querySelectorAll('.add-to-cart-quick-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const productId = e.currentTarget.dataset.id;
            if (productId) {
                try {
                    // Show loading state
                    const originalContent = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    button.disabled = true;
                    
                    // Fetch product details
                    const product = await fetchProductDetails(productId);
                    if (product) {
                        // Add to cart with default quantity of 1
                        addToCart(product, 1);
                        
                        // Reset button with success indicator
                        button.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            button.innerHTML = originalContent;
                            button.disabled = false;
                        }, 1500);
                    } else {
                        throw new Error('Product not found');
                    }
                } catch (error) {
                    console.error('Error adding product to cart:', error);
                    
                    // Reset button
                    button.innerHTML = '<i class="fas fa-shopping-cart"></i>';
                    button.disabled = false;
                    
                    // Show error notification
                    showNotification('Ürün sepete eklenirken bir hata oluştu.', 'error');
                }
            }
        });
    });
}

// Function to handle product navigation with debouncing
function navigateToProduct(productId) {
    // Store the last click timestamp to prevent double clicks
    const now = Date.now();
    const lastClick = parseInt(sessionStorage.getItem('lastProductClick') || '0');
    
    // If less than 500ms since last click, ignore this click (debounce)
    if (now - lastClick < 500) {
        console.log('Ignoring rapid product navigation');
        return;
    }
    
    // Store current timestamp
    sessionStorage.setItem('lastProductClick', now.toString());
    
    // Navigate to product page
    window.location.href = `product.html?id=${productId}`;
}

// Update the openQuickView function to use the debounced navigation
function openQuickView(productId) {
    navigateToProduct(productId);
}

// Get color code from color name
function getColorCode(colorName) {
    const colorMap = {
        'siyah': '#000000',
        'beyaz': '#FFFFFF',
        'kırmızı': '#FF0000',
        'mavi': '#0000FF',
        'yeşil': '#008000',
        'sarı': '#FFFF00',
        'turuncu': '#FFA500',
        'mor': '#800080',
        'pembe': '#FFC0CB',
        'gri': '#808080',
        'kahverengi': '#8B4513',
        'lacivert': '#000080',
        'bej': '#F5F5DC',
        'bordo': '#800000',
        'turkuaz': '#40E0D0',
        'lila': '#C8A2C8',
        'haki': '#806B2A',
        'gümüş': '#C0C0C0',
        'altın': '#FFD700',
        'bronz': '#CD7F32'
    };
    
    // Convert to lowercase and remove accents
    const normalizedColor = colorName.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    
    return colorMap[normalizedColor] || '#CCCCCC';
}

// Update cart count
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count');
    if (!cartCountElements.length) return;
    
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Calculate total quantity
    const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Update all cart count elements
    cartCountElements.forEach(element => {
        element.textContent = totalQuantity;
        
        // Show/hide based on count
        if (totalQuantity > 0) {
            element.style.display = 'flex';
        } else {
            element.style.display = 'none';
        }
    });
}

// Update cart preview
function updateCartPreview() {
    const cartPreviewItems = document.querySelector('.cart-preview-items');
    const cartPreviewCount = document.querySelector('.cart-preview-count');
    const cartPreviewTotal = document.querySelector('.cart-preview-total-price');
    const emptyCartMessage = document.querySelector('.empty-cart-message');
    
    if (!cartPreviewItems || !cartPreviewCount || !cartPreviewTotal) return;
    
    // Get cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Update cart count
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartPreviewCount.textContent = cartCount;
    
    // Update cart preview count text
    const cartPreviewCountText = document.querySelector('.cart-preview-count');
    if (cartPreviewCountText) {
        cartPreviewCountText.textContent = `${cartCount} Ürün`;
    }
    
    // Show/hide empty cart message
    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartPreviewItems.innerHTML = '';
        cartPreviewTotal.textContent = '₺0.00';
        return;
    }
    
    // Hide empty cart message
    emptyCartMessage.style.display = 'none';
    
    // Calculate total price
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Format total price
    const formattedTotal = totalPrice.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    // Update total price
    cartPreviewTotal.textContent = `₺${formattedTotal}`;
    
    // Create HTML for cart items
    let cartItemsHtml = '';
    
    // Show only the first 3 items in preview
    const previewItems = cart.slice(0, 3);
    
    previewItems.forEach(item => {
        // Format price
        const price = item.price.toLocaleString('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Create variants text
        let variantsText = '';
        if (item.variants && Object.keys(item.variants).length > 0) {
            variantsText = Object.entries(item.variants)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
        }
        
        cartItemsHtml += `
            <div class="cart-preview-item">
                <div class="cart-preview-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-preview-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} x ₺${price}</p>
                    ${variantsText ? `<p class="cart-preview-item-variants">${variantsText}</p>` : ''}
                </div>
                <button class="cart-preview-item-remove" data-id="${item.id}">×</button>
            </div>
        `;
    });
    
    // Add "more items" message if there are more than 3 items
    if (cart.length > 3) {
        const moreItemsCount = cart.length - 3;
        cartItemsHtml += `
            <div class="cart-preview-more-items">
                <p>+ ${moreItemsCount} daha ürün</p>
            </div>
        `;
    }
    
    // Update cart items
    cartPreviewItems.innerHTML = cartItemsHtml;
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.cart-preview-item-remove').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const itemId = this.dataset.id;
            if (itemId) {
                removeFromCart(itemId);
            }
        });
    });
}

// Remove from cart function
function removeFromCart(itemId) {
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Remove item from cart
    cart = cart.filter(item => item.id !== itemId);
    
    // Save cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Update cart preview
    updateCartPreview();
} 
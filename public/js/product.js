/**
 * DnD Brand E-commerce - Product Detail Page Functionality
 * Displays product details from backend API
 */

// Get API URL from config if available
let productApiUrl;

try {
    productApiUrl = window.CONFIG.API_URL;
    console.log('Using API URL from config.js:', productApiUrl);
} catch (e) {
    productApiUrl = 'https://dndbrand-server.onrender.com/api';
    console.log('Config not found, using fallback API URL:', productApiUrl);
}

// Server-side placeholder URL (production)
const SERVER_PLACEHOLDER_URL = `https://dndbrand-server.onrender.com/api/uploads/image/placeholder-product.jpg`;

// Local server placeholder URL
const LOCAL_PLACEHOLDER_URL = '/api/images/placeholder-product.jpg';

// Default fallback image path (local file)
const FALLBACK_PRODUCT_IMAGE = '/images/placeholder-product.jpg';

// Make fallback available globally for other scripts
window.FALLBACK_PRODUCT_IMAGE = FALLBACK_PRODUCT_IMAGE;

// Set fallback product image with ImageService or direct fallback
const DEFAULT_PRODUCT_IMAGE = window.ImageService ? 
    window.ImageService.getBestPlaceholder ? window.ImageService.getBestPlaceholder() : 
    window.ImageService.getProductImage('placeholder-product.jpg') : 
    LOCAL_PLACEHOLDER_URL;

// Track if placeholder images are available
let isServerPlaceholderAvailable = false;
let isLocalPlaceholderAvailable = false;

// Preload local placeholder image first
function preloadLocalPlaceholder() {
    const img = new Image();
    img.onload = function() {
        isLocalPlaceholderAvailable = true;
        console.log('Local placeholder image loaded successfully for product page');
    };
    img.onerror = function() {
        isLocalPlaceholderAvailable = false;
        console.warn('Local placeholder not available for product page, trying server');
        
        // Try server placeholder as fallback
        preloadServerPlaceholder();
    };
    img.src = LOCAL_PLACEHOLDER_URL;
}

// Preload server placeholder image as backup
function preloadServerPlaceholder() {
    const img = new Image();
    img.onload = function() {
        isServerPlaceholderAvailable = true;
        console.log('Server placeholder image loaded successfully for product page');
    };
    img.onerror = function() {
        isServerPlaceholderAvailable = false;
        console.warn('Server placeholder not available, using local file fallback for product page');
    };
    img.src = SERVER_PLACEHOLDER_URL;
}

// Try to preload the placeholders
preloadLocalPlaceholder();

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
                    <a href="./shop.html" class="btn">Mağazaya Dön</a>
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
                window.location.href = './cart.html';
            }
        });
    }
    
    // Make sure "Sepeti Görüntüle" link works
    const viewCartLink = document.querySelector('.view-cart');
    if (viewCartLink) {
        viewCartLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = './cart.html';
        });
    }
    
    // Make sure "Ödeme" link works
    const checkoutLink = document.querySelector('.checkout');
    if (checkoutLink) {
        checkoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = './checkout.html';
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

// Custom product image handler with built-in fallback
function getProductImage(imagePath, useOriginal = false) {
    // Use the centralized ImageService if available
    if (window.ImageService && typeof window.ImageService.getProductImage === 'function') {
        return window.ImageService.getProductImage(imagePath, { 
            fullSize: useOriginal 
        });
    }
    
    // Fallback to original implementation if ImageService is not available
    // Handle null, undefined, or non-string values
    if (!imagePath) {
        return getBestPlaceholder();
    }
    
    // If imagePath is an array, use the first item
    if (Array.isArray(imagePath)) {
        if (imagePath.length === 0) {
            return getBestPlaceholder();
        }
        imagePath = imagePath[0];
    }
    
    // If imagePath is an object, try to extract the URL
    if (typeof imagePath === 'object' && imagePath !== null) {
        if (imagePath.url) {
            imagePath = imagePath.url;
        } else if (imagePath.src) {
            imagePath = imagePath.src;
        } else if (imagePath.path) {
            imagePath = imagePath.path;
        } else if (imagePath.original) {
            imagePath = imagePath.original;
        } else if (imagePath.thumbnail) {
            imagePath = imagePath.thumbnail;
        } else {
            // Can't extract a string URL from the object
            return getBestPlaceholder();
        }
    }
    
    // Ensure imagePath is a string at this point
    imagePath = String(imagePath);
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // If it's a data URL, return it
    if (imagePath.startsWith('data:')) {
        return imagePath;
    }
    
    // Check for placeholder or default image references
    if (imagePath.includes('placeholder-product.jpg')) {
        return getBestPlaceholder();
    }
    
    // Check for problematic patterns and return the fallback
    if (imagePath.includes('no-image.jpg') || 
        imagePath.includes('undefined') || 
        imagePath.includes('null') ||
        imagePath.includes('default-product.jpg')) {
        return getBestPlaceholder();
    }
    
    // If it's a relative path, check if it's a path to our images folder
    if (imagePath.includes('/images/')) {
        return imagePath;
    }
    
    // If it's just a filename, add the API URL path
    if (!imagePath.includes('/')) {
        return `${productApiUrl}/images/${imagePath}`;
    }
    
    // Default to API URL
    return `${productApiUrl}${imagePath}`;
}

/**
 * Get the best available placeholder image
 * @returns {string} The placeholder image URL
 */
function getBestPlaceholder() {
    // If local placeholder is available, use it (fastest)
    if (isLocalPlaceholderAvailable) {
        return LOCAL_PLACEHOLDER_URL;
    }
    
    // If server placeholder is available, use it (reliable)
    if (isServerPlaceholderAvailable) {
        return SERVER_PLACEHOLDER_URL;
    }
    
    // Otherwise fall back to local file
    return FALLBACK_PRODUCT_IMAGE;
}

// Fetch product details from API
async function fetchProductDetails(productId) {
    try {
        console.log(`Fetching product details for ID: ${productId}`);
        
        // Use CONFIG.fetchAPI if available
        if (window.CONFIG && window.CONFIG.fetchAPI) {
            console.log('Using CONFIG.fetchAPI for product details');
            const data = await CONFIG.fetchAPI(`products/${productId}`);
            
            // Check for different response formats
            if (data && data._id) {
                return data;
            } else if (data && data.product) {
                return data.product;
            } else if (data && data.data) {
                return data.data;
            } else if (Array.isArray(data)) {
                return data.find(product => product._id === productId || product.id === productId);
            } else {
                console.warn('Unexpected data format from API:', data);
                throw new Error('API returned data in an unexpected format');
            }
        }
        
        // Fallback to original implementation if CONFIG.fetchAPI is not available
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const apiUrl = productApiUrl || 'https://dndbrand-server.onrender.com/api';
        const url = `${apiUrl}/products/${productId}?_=${timestamp}`;
        
        console.log('Fallback: Fetching product from:', url);
        
        // Try the local proxy first
        const localProxy = window.location.origin + '/api-proxy/';
        try {
            console.log('Trying local CORS proxy:', localProxy);
            const proxyUrl = `${localProxy}${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'omit',
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Local proxy request successful:', data);
                
                // Check for different response formats
                if (data && data._id) {
                    return data;
                } else if (data && data.product) {
                    return data.product;
                } else if (data && data.data) {
                    return data.data;
                } else if (Array.isArray(data)) {
                    return data.find(product => product._id === productId || product.id === productId);
                }
            }
        } catch (localProxyError) {
            console.warn(`Local proxy request failed: ${localProxyError.message}`);
        }
        
        // Fallback to all products approach
        return await fetchAllProductsAndFindById(productId);
        
    } catch (error) {
        console.error('Error fetching product details:', error);
        
        // Try fallback approach - fetch all products and find by ID
        return await fetchAllProductsAndFindById(productId);
    }
}

// Fallback function to fetch all products and find by ID
async function fetchAllProductsAndFindById(productId) {
    try {
        console.log('Fetching all products as fallback to find product by ID');
        
        // Use CONFIG.fetchAPI if available
        if (window.CONFIG && window.CONFIG.fetchAPI) {
            console.log('Using CONFIG.fetchAPI for fetching all products');
            try {
                const data = await CONFIG.fetchAPI('products');
                
                let products = [];
                if (Array.isArray(data)) {
                    products = data;
                } else if (data && Array.isArray(data.data)) {
                    products = data.data;
                } else if (data && Array.isArray(data.products)) {
                    products = data.products;
                } else if (data && Array.isArray(data.results)) {
                    products = data.results;
                }
                
                console.log(`Found ${products.length} products, searching for ID: ${productId}`);
                const product = products.find(p => p._id === productId || p.id === productId);
                
                if (product) {
                    console.log('Product found in all products response');
                    return product;
                } else {
                    console.warn('Product not found in all products response');
                    throw new Error('Product not found');
                }
            } catch (error) {
                console.error('Error using CONFIG.fetchAPI:', error);
                throw error;
            }
        }
        
        // Fallback to local proxy if CONFIG.fetchAPI is not available
        const apiUrl = productApiUrl || 'https://dndbrand-server.onrender.com/api';
        const url = `${apiUrl}/products`;
        const localProxy = window.location.origin + '/api-proxy/';
        
        console.log('Using local proxy for all products:', localProxy);
        try {
            const proxyUrl = `${localProxy}${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'omit',
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Local proxy request for all products successful');
                
                let products = [];
                if (Array.isArray(data)) {
                    products = data;
                } else if (data && Array.isArray(data.data)) {
                    products = data.data;
                } else if (data && Array.isArray(data.products)) {
                    products = data.products;
                } else if (data && Array.isArray(data.results)) {
                    products = data.results;
                }
                
                console.log(`Found ${products.length} products, searching for ID: ${productId}`);
                const product = products.find(p => p._id === productId || p.id === productId);
                
                if (product) {
                    console.log('Product found in all products response');
                    return product;
                } else {
                    console.warn('Product not found in all products response');
                    throw new Error('Product not found');
                }
            } else {
                console.warn(`Local proxy request failed with status: ${response.status}`);
                throw new Error(`Failed to fetch all products: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching all products:', error);
            throw error;
        }
    } catch (error) {
        console.error('All fallback approaches failed:', error);
        // Return empty product with error message for UI handling
        return {
            _id: productId,
            id: productId,
            name: 'Ürün Bulunamadı',
            price: 0,
            description: 'Bu ürün bilgilerine erişilemedi. Lütfen daha sonra tekrar deneyin.',
            error: true,
            errorMessage: error.message
        };
    }
}

// Load product details
async function loadProductDetails(productId) {
    // Show loading spinner
    const productDetailContainer = document.getElementById('product-detail');
    productDetailContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Ürün yükleniyor...</p>
        </div>
    `;
    
    try {
        // Fetch product details
        const product = await fetchProductDetails(productId);
        
        if (!product) {
            // Product not found, show error message
            productDetailContainer.innerHTML = `
                <div class="product-not-found">
                    <h2>Ürün Bulunamadı</h2>
                    <p>Aradığınız ürün bulunamadı veya kaldırılmış olabilir.</p>
                    <a href="./shop.html" class="btn">Mağazaya Dön</a>
                </div>
            `;
            return;
        }
        
        // Update page title
        document.title = `${product.name} | DnD Brand`;
        
        // Create product detail HTML
        const productHTML = `
            <div class="product-detail-container">
                <div class="product-images">
                    ${product.isNew || product.isFeatured ? `<div class="premium-badge">${product.isNew ? 'Yeni' : 'Premium'}</div>` : ''}
                    <div class="main-image">
                        <img src="${getProductImage(product)}" alt="${product.name}">
                    </div>
                    <div class="thumbnail-container">
                        <div class="thumbnail active">
                            <img src="${getProductImage(product)}" alt="${product.name}">
                        </div>
                        ${product.images && Array.isArray(product.images) && product.images.slice(1).map((img, index) => `
                            <div class="thumbnail">
                                <img src="${getProductImage(img)}" alt="${product.name} - ${index + 2}">
                            </div>
                        `).join('') || ''}
                    </div>
                </div>
                
                <div class="product-info">
                    <h1 class="product-title">${product.name}</h1>
                    
                    <div class="product-price">
                        ${product.discount ? `
                            <span class="old-price">₺${product.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                            <span>₺${(product.price * (1 - product.discount / 100)).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                            <span class="discount-badge">%${product.discount} İndirim</span>
                        ` : `₺${product.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`}
                    </div>
                    
                    <p class="product-description">${product.description || 'Bu ürün hakkında detaylı bilgi yakında eklenecektir.'}</p>
                    
                    <div class="product-features">
                        <ul class="feature-list">
                            <li class="feature-item"><i class="fas fa-check"></i> Premium kalite</li>
                            <li class="feature-item"><i class="fas fa-check"></i> Özel tasarım</li>
                            <li class="feature-item"><i class="fas fa-check"></i> Dayanıklı malzeme</li>
                            ${product.brand ? `<li class="feature-item"><i class="fas fa-check"></i> ${product.brand} markası</li>` : ''}
                        </ul>
                    </div>
                    
                    <div class="product-variants">
                        ${product.colors && product.colors.length > 0 ? `
                            <div class="variant-group">
                                <span class="variant-title">Renk</span>
                                <div class="variant-options">
                                    ${product.colors.map(color => `
                                        <div class="variant-option color-option" 
                                             data-value="${color}" 
                                             style="background-color: ${getColorCode(color)}" 
                                             title="${color}"></div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${product.sizes && product.sizes.length > 0 ? `
                            <div class="variant-group">
                                <span class="variant-title">Beden</span>
                                <div class="variant-options">
                                    ${product.sizes.map(size => `
                                        <div class="variant-option size-option" data-value="${size}">${size}</div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn quantity-decrease">-</button>
                            <input type="text" class="quantity-input" value="1" min="1">
                            <button class="quantity-btn quantity-increase">+</button>
                        </div>
                        
                        <button class="add-to-cart-btn">
                            <i class="fas fa-shopping-cart"></i> Sepete Ekle
                        </button>
                        
                        <button class="wishlist-btn">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                    
                    <div class="product-guarantee">
                        <div class="guarantee-item">
                            <i class="fas fa-truck"></i>
                            <span>Hızlı Teslimat</span>
                        </div>
                        <div class="guarantee-item">
                            <i class="fas fa-undo"></i>
                            <span>30 Gün İade</span>
                        </div>
                        <div class="guarantee-item">
                            <i class="fas fa-shield-alt"></i>
                            <span>Güvenli Ödeme</span>
                        </div>
                        <div class="guarantee-item">
                            <i class="fas fa-headset"></i>
                            <span>7/24 Destek</span>
                        </div>
                    </div>
                    
                    <div class="product-share">
                        <span class="share-label">Paylaş:</span>
                        <div class="share-buttons">
                            <a href="#" class="share-button"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" class="share-button"><i class="fab fa-twitter"></i></a>
                            <a href="#" class="share-button"><i class="fab fa-instagram"></i></a>
                            <a href="#" class="share-button"><i class="fab fa-pinterest-p"></i></a>
                        </div>
                    </div>
                    
                    <div class="product-additional-info">
                        <div class="tabs">
                            <div class="tab active" data-tab="tab-description">Açıklama</div>
                            <div class="tab" data-tab="tab-additional-info">Ek Bilgiler</div>
                            <div class="tab" data-tab="tab-reviews">Yorumlar</div>
                        </div>
                        
                        <div class="tab-content active" id="tab-description">
                            <p>${product.description || 'Bu ürün hakkında detaylı bilgi yakında eklenecektir.'}</p>
                        </div>
                        
                        <div class="tab-content" id="tab-additional-info">
                            <ul>
                                ${product.brand ? `<li><strong>Marka:</strong> ${product.brand}</li>` : ''}
                                ${product.material ? `<li><strong>Malzeme:</strong> ${product.material}</li>` : ''}
                                ${product.category ? `<li><strong>Kategori:</strong> ${product.category}</li>` : ''}
                                ${product.colors ? `<li><strong>Renkler:</strong> ${product.colors.join(', ')}</li>` : ''}
                                ${product.sizes ? `<li><strong>Bedenler:</strong> ${product.sizes.join(', ')}</li>` : ''}
                            </ul>
                        </div>
                        
                        <div class="tab-content" id="tab-reviews">
                            <p>Bu ürün için henüz yorum bulunmamaktadır.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Update the container with the product HTML
        productDetailContainer.innerHTML = productHTML;
        
        // Initialize product functionality
        initializeProductFunctionality(product);
        
        // Load related products
        loadRelatedProducts(product.category);
        
        // Apply global image error handler if available
        if (window.ImageService && typeof window.ImageService.applyImageErrorHandler === 'function') {
            window.ImageService.applyImageErrorHandler();
        }
        
    } catch (error) {
        console.error('Error loading product details:', error);
        
        // Show error message with retry button
        productDetailContainer.innerHTML = `
            <div class="product-error">
                <h2>Bağlantı Hatası</h2>
                <p>Ürün bilgileri yüklenirken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.</p>
                <div class="error-details">
                    <p>Hata: ${error.message}</p>
                    <p>Ürün ID: ${productId}</p>
                </div>
                <div class="error-actions">
                    <button class="btn retry-button">Tekrar Dene</button>
                    <a href="./shop.html" class="btn btn-secondary">Mağazaya Dön</a>
                </div>
                
                <div class="basic-product-info">
                    <h3>Temel Ürün Bilgileri</h3>
                    <p>API bağlantısı kurulamadığı için temel ürün bilgileri gösteriliyor.</p>
                    
                    <div class="basic-product-details">
                        <div class="basic-product-image">
                            <img src="/images/placeholder-product.jpg" alt="Ürün Görseli">
                        </div>
                        <div class="basic-product-content">
                            <h2>Ürün #${productId}</h2>
                            <p class="basic-product-price">₺XXX.XX</p>
                            <p class="basic-product-description">Bu ürün hakkında detaylı bilgi için lütfen daha sonra tekrar deneyin veya müşteri hizmetleriyle iletişime geçin.</p>
                            
                            <div class="basic-product-actions">
                                <a href="./shop.html" class="btn">Diğer Ürünleri Gör</a>
                                <a href="./contact.html" class="btn btn-secondary">İletişime Geç</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listener to retry button
        const retryButton = productDetailContainer.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                loadProductDetails(productId);
            });
        }
        
        // Apply global image error handler to error page images if available
        if (window.ImageService && typeof window.ImageService.applyImageErrorHandler === 'function') {
            window.ImageService.applyImageErrorHandler();
        }
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
    
    // Get product images
    let images = [];
    
    // Handle different image formats
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        // Format: product.images = ['image1.jpg', 'image2.jpg']
        images = product.images;
    } else if (product.image) {
        // Format: product.image = 'image.jpg'
        images = [product.image];
    } else if (product.additionalImages && Array.isArray(product.additionalImages)) {
        // Format: product.additionalImages = ['image1.jpg', 'image2.jpg']
        images = product.additionalImages;
    } else if (product.imageUrl) {
        // Format: product.imageUrl = 'image.jpg'
        images = [product.imageUrl];
    } else {
        // No images found, use server placeholder if available
        images = [getBestPlaceholder()];
    }
    
    // Set main image
    const mainImageSrc = getProductImage(images[0]);
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
    if (images.length > 1) {
        for (let i = 1; i < images.length; i++) {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            
            // Get full image path
            const fullImagePath = getProductImage(images[i]);
            
            thumbnail.innerHTML = `<img src="${fullImagePath}" alt="${product.name} - Image ${i + 1}">`;
            
            thumbnailContainer.appendChild(thumbnail);
        }
    }
    
    // Add click event listeners to thumbnails
    const thumbnails = template.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Update active class
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update main image
            const thumbImg = this.querySelector('img');
            if (thumbImg && mainImageElement) {
                mainImageElement.src = thumbImg.src;
                mainImageElement.alt = thumbImg.alt;
            }
        });
    });
}

// Update product variants (colors, sizes)
function updateProductVariants(template, product) {
    const variantsContainer = template.querySelector('.product-variants');
    if (!variantsContainer) return;
    
    // Clear existing variants
    variantsContainer.innerHTML = '';
    
    // Check if product has variants
    if (!product.variants) {
        // Try to use colors and sizes instead
        if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
            addColorVariants(variantsContainer, product.colors);
        }
        
        if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
            addSizeVariants(variantsContainer, product.sizes);
        }
        
        // If no variants, colors, or sizes, hide the container
        if (!product.colors && !product.sizes) {
            variantsContainer.style.display = 'none';
        } else {
            variantsContainer.style.display = 'block';
        }
        
        return;
    }
    
    // Show variants container
    variantsContainer.style.display = 'block';
    
    // Add each variant group
    Object.entries(product.variants).forEach(([variantName, options]) => {
        // Skip if options is not an array
        if (!Array.isArray(options)) {
            console.warn(`Variant ${variantName} options is not an array:`, options);
            return;
        }
        
        const variantGroup = document.createElement('div');
        variantGroup.className = 'variant-group';
        variantGroup.dataset.variantName = variantName;
        
        // Add variant title
        const variantTitle = document.createElement('span');
        variantTitle.className = 'variant-title';
        variantTitle.textContent = variantName.charAt(0).toUpperCase() + variantName.slice(1);
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

// Helper function to add color variants
function addColorVariants(container, colors) {
    const variantGroup = document.createElement('div');
    variantGroup.className = 'variant-group';
    variantGroup.dataset.variantName = 'color';
    
    // Add variant title
    const variantTitle = document.createElement('span');
    variantTitle.className = 'variant-title';
    variantTitle.textContent = 'Renk';
    variantGroup.appendChild(variantTitle);
    
    // Add variant options
    const variantOptions = document.createElement('div');
    variantOptions.className = 'variant-options';
    
    // Add options
    colors.forEach(color => {
        const optionElement = document.createElement('div');
        optionElement.className = 'variant-option color-option';
        optionElement.dataset.value = color;
        
        // Add color swatch
        const colorCode = getColorCode(color);
        optionElement.style.backgroundColor = colorCode;
        optionElement.title = color;
        
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
    container.appendChild(variantGroup);
}

// Helper function to add size variants
function addSizeVariants(container, sizes) {
    const variantGroup = document.createElement('div');
    variantGroup.className = 'variant-group';
    variantGroup.dataset.variantName = 'size';
    
    // Add variant title
    const variantTitle = document.createElement('span');
    variantTitle.className = 'variant-title';
    variantTitle.textContent = 'Beden';
    variantGroup.appendChild(variantTitle);
    
    // Add variant options
    const variantOptions = document.createElement('div');
    variantOptions.className = 'variant-options';
    
    // Add options
    sizes.forEach(size => {
        const optionElement = document.createElement('div');
        optionElement.className = 'variant-option size-option';
        optionElement.textContent = size;
        optionElement.dataset.value = size;
        
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
    container.appendChild(variantGroup);
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
    const quantityDecrease = document.querySelector('.quantity-decrease');
    const quantityIncrease = document.querySelector('.quantity-increase');
    const quantityInput = document.querySelector('.quantity-input');
    
    if (quantityDecrease && quantityIncrease && quantityInput) {
        // Decrease quantity
        quantityDecrease.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value);
            if (quantity > 1) {
                quantityInput.value = quantity - 1;
            }
        });
        
        // Increase quantity
        quantityIncrease.addEventListener('click', () => {
            let quantity = parseInt(quantityInput.value);
            quantityInput.value = quantity + 1;
        });
        
        // Validate input
        quantityInput.addEventListener('change', () => {
            let quantity = parseInt(quantityInput.value);
            if (isNaN(quantity) || quantity < 1) {
                quantityInput.value = 1;
            }
        });
    }
    
    // Initialize add to cart button
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            // Get selected quantity
            const quantity = parseInt(quantityInput.value) || 1;
            
            // Get selected variants
            const selectedVariants = {};
            
            // Get selected color
            const selectedColor = document.querySelector('.color-option.selected');
            if (selectedColor) {
                selectedVariants.color = selectedColor.getAttribute('data-value');
            } else if (document.querySelector('.color-option')) {
                // Select first color if none selected
                const firstColor = document.querySelector('.color-option');
                firstColor.classList.add('selected');
                selectedVariants.color = firstColor.getAttribute('data-value');
            }
            
            // Get selected size
            const selectedSize = document.querySelector('.size-option.selected');
            if (selectedSize) {
                selectedVariants.size = selectedSize.getAttribute('data-value');
            } else if (document.querySelector('.size-option')) {
                // Select first size if none selected
                const firstSize = document.querySelector('.size-option');
                firstSize.classList.add('selected');
                selectedVariants.size = firstSize.getAttribute('data-value');
            }
            
            // Add to cart
            addToCart(product, quantity, selectedVariants);
            
            // Show success animation
            addToCartBtn.classList.add('added');
            setTimeout(() => {
                addToCartBtn.classList.remove('added');
            }, 1500);
        });
    }
    
    // Initialize wishlist button
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (wishlistBtn) {
        // Check if product is in wishlist
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const isInWishlist = wishlist.some(item => item.id === product.id || item.id === product._id);
        
        if (isInWishlist) {
            wishlistBtn.classList.add('active');
            wishlistBtn.querySelector('i').classList.remove('far');
            wishlistBtn.querySelector('i').classList.add('fas');
        }
        
        wishlistBtn.addEventListener('click', () => {
            const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
            const productId = product.id || product._id;
            
            // Check if product is already in wishlist
            const existingIndex = wishlist.findIndex(item => item.id === productId);
            
            if (existingIndex !== -1) {
                // Remove from wishlist
                wishlist.splice(existingIndex, 1);
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                
                // Update button
                wishlistBtn.classList.remove('active');
                wishlistBtn.querySelector('i').classList.remove('fas');
                wishlistBtn.querySelector('i').classList.add('far');
                
                showNotification('Ürün favorilerden çıkarıldı', 'info');
            } else {
                // Add to wishlist
                wishlist.push({
                    id: productId,
                    name: product.name,
                    price: product.price,
                    image: getProductImage(product)
                });
                localStorage.setItem('wishlist', JSON.stringify(wishlist));
                
                // Update button
                wishlistBtn.classList.add('active');
                wishlistBtn.querySelector('i').classList.remove('far');
                wishlistBtn.querySelector('i').classList.add('fas');
                
                showNotification('Ürün favorilere eklendi', 'success');
            }
        });
    }
    
    // Initialize variant selectors
    const variantOptions = document.querySelectorAll('.variant-option');
    variantOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Get all options in the same group
            const group = this.closest('.variant-options');
            const options = group.querySelectorAll('.variant-option');
            
            // Remove selected class from all options
            options.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            this.classList.add('selected');
        });
    });
    
    // Select first option in each variant group by default
    document.querySelectorAll('.variant-options').forEach(group => {
        const firstOption = group.querySelector('.variant-option');
        if (firstOption) {
            firstOption.classList.add('selected');
        }
    });
    
    // Initialize thumbnail images
    const thumbnails = document.querySelectorAll('.thumbnail');
    const mainImage = document.querySelector('.main-image img');
    
    if (thumbnails.length && mainImage) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                // Remove active class from all thumbnails
                thumbnails.forEach(thumb => thumb.classList.remove('active'));
                
                // Add active class to clicked thumbnail
                this.classList.add('active');
                
                // Update main image
                const thumbnailImg = this.querySelector('img');
                if (thumbnailImg) {
                    mainImage.src = thumbnailImg.src;
                    mainImage.alt = thumbnailImg.alt;
                }
            });
        });
    }
    
    // Initialize tabs
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabs.length && tabContents.length) {
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                this.classList.add('active');
                
                // Hide all tab contents
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Show corresponding tab content
                const tabId = this.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
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
        const apiUrl = 'https://dndbrand-server.onrender.com/api';
        const url = `${apiUrl}/products`;
        
        console.log('Fetching related products from:', url);
        
        // Try multiple CORS proxies with different timeouts
        const corsProxies = [
            'https://api.cors.sh/',
            'https://corsproxy.io/?',
            'https://cors-proxy.htmldriven.com/?url=',
            'https://api.allorigins.win/raw?url=',
            'https://crossorigin.me/'
        ];
        
        // Create a timeout promise
        const timeout = (ms) => new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
        );
        
        let products = [];
        let fetchSuccess = false;
        
        // Try each CORS proxy with a timeout
        for (const proxy of corsProxies) {
            if (fetchSuccess) break;
            
            try {
                console.log('Trying CORS proxy for related products:', proxy);
                const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
                
                // Race between fetch and timeout
                const response = await Promise.race([
                    fetch(proxyUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        },
                        credentials: 'omit'
                    }),
                    timeout(5000) // 5 second timeout
                ]);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Proxy request for related products successful');
                    
                    if (data.success && Array.isArray(data.data)) {
                        products = data.data;
                        fetchSuccess = true;
                        break;
                    } else if (Array.isArray(data)) {
                        products = data;
                        fetchSuccess = true;
                        break;
                    }
                }
                console.warn(`Proxy request for related products failed with status: ${response.status} for proxy: ${proxy}`);
            } catch (proxyError) {
                console.warn(`Proxy request for related products failed: ${proxyError.message} for proxy: ${proxy}`);
            }
        }
        
        if (!products.length) {
            relatedProductsGrid.innerHTML = '<p>İlgili ürün bulunamadı.</p>';
            return;
        }
        
        // Filter products by category and exclude current product
        const currentProductId = new URLSearchParams(window.location.search).get('id');
        const relatedProducts = products
            .filter(product => product.category === category && (product._id !== currentProductId && product.id !== currentProductId))
            .slice(0, 4); // Limit to 4 related products
        
        if (!relatedProducts.length) {
            // If no products in the same category, just show any other products
            const otherProducts = products
                .filter(product => product._id !== currentProductId && product.id !== currentProductId)
                .slice(0, 4);
            
            displayRelatedProducts(otherProducts);
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
        
        // Get product image
        let productImage;
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            productImage = getProductImage(product.images[0]);
        } else if (product.image) {
            productImage = getProductImage(product.image);
        } else if (product.imageUrl) {
            productImage = getProductImage(product.imageUrl);
        } else {
            productImage = DEFAULT_PRODUCT_IMAGE;
        }
        
        // Create product card HTML
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-card-image">
                ${product.isNew || product.isFeatured ? `<div class="premium-badge">${product.isNew ? 'Yeni' : 'Premium'}</div>` : ''}
                <img src="${productImage}" alt="${product.name}" onerror="this.src='${DEFAULT_PRODUCT_IMAGE}'; this.onerror=null;">
                <div class="product-card-overlay">
                    <a href="product.html?id=${product._id || product.id}" class="view-details">Detayları Gör</a>
                    <button class="add-to-cart-quick" data-id="${product._id || product.id}">Sepete Ekle</button>
                </div>
            </div>
            <div class="product-card-info">
                <h3 class="product-card-title">${product.name}</h3>
                <div class="product-card-price">
                    ${product.discount ? `
                        <span class="old-price">₺${product.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                        <span>₺${(product.price * (1 - product.discount / 100)).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                    ` : `₺${price}`}
                </div>
                <div class="product-card-actions">
                    <button class="quick-view-btn" data-id="${product._id || product.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="add-to-cart-quick-btn" data-id="${product._id || product.id}">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add to grid
        relatedProductsGrid.appendChild(productCard);
        
        // Add click event to the entire card
        productCard.addEventListener('click', (e) => {
            // Don't trigger if clicking on a button
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            // Navigate to product page
            navigateToProduct(product._id || product.id);
        });
    });
    
    // Add event listeners for quick view buttons
    document.querySelectorAll('.quick-view-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = button.getAttribute('data-id');
            openQuickView(productId);
        });
    });
    
    // Add event listeners for add to cart buttons
    document.querySelectorAll('.add-to-cart-quick-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = button.getAttribute('data-id');
            
            // Show loading state
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            button.disabled = true;
            
            // Add to cart
            addToCart(productId, 1);
            
            // Show success state
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-check"></i>';
                
                // Reset after a delay
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }, 1000);
            }, 500);
        });
    });
}

// Navigate to product page
function navigateToProduct(productId) {
    if (!productId) return;
    
    // Navigate to product page
    window.location.href = `./product.html?id=${productId}`;
}

// Open quick view modal
function openQuickView(productId) {
    if (!productId) return;
    
    // For now, just navigate to the product page
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
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'block';
        }
        cartPreviewItems.innerHTML = '';
        cartPreviewTotal.textContent = '₺0.00';
        return;
    }
    
    // Hide empty cart message
    if (emptyCartMessage) {
        emptyCartMessage.style.display = 'none';
    }
    
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
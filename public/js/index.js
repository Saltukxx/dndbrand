/**
 * D&D Brand E-commerce - Homepage Functionality
 * Displays featured products from admin panel on the homepage
 */

// Get API URL from config if available
let indexApiUrl;
if (window.CONFIG && window.CONFIG.API_URL) {
    indexApiUrl = window.CONFIG.API_URL;
    console.log('Using API URL from config.js:', indexApiUrl);
} else {
    indexApiUrl = 'https://dndbrand-server.onrender.com/api';
    console.log('Config not found, using fallback API URL:', indexApiUrl);
}

document.addEventListener('DOMContentLoaded', function() {
    // Load featured products
    loadFeaturedProducts();
    
    // Initialize other homepage functionality
    initializeHomepage();
    
    // Ensure banners are initialized properly with a slight delay
    setTimeout(function() {
        console.log('Running delayed banner initialization');
        initializeBannerSlider();
    }, 300);
    
    // Optimize banners for mobile
    optimizeBannersForMobile();
    
    // Optimize single banner for all devices
    optimizeSingleBanner();
    
    // Re-optimize on resize
    window.addEventListener('resize', function() {
        optimizeBannersForMobile();
        optimizeSingleBanner();
    });
});

// Load featured products to the homepage
async function loadFeaturedProducts() {
    const featuredContainer = document.querySelector('.trending .product-grid');
    if (!featuredContainer) return;
    
    try {
        // Show loading state
        featuredContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Ürünler yükleniyor...</div>';
        
        // Fetch products from API using the new fetchAPI function
        let products = [];
        if (window.CONFIG && window.CONFIG.fetchAPI) {
            try {
                const data = await window.CONFIG.fetchAPI('products');
                console.log('API Response:', data);
                
                // Handle different response formats
                if (data && data.data && Array.isArray(data.data)) {
                    products = data.data;
                } else if (Array.isArray(data)) {
                    products = data;
                } else {
                    console.warn('Unexpected API response format:', data);
                    products = [];
                }
            } catch (apiError) {
                console.error('Error fetching products from API:', apiError);
                products = [];
            }
        } else {
            // Fallback to regular fetch if fetchAPI is not available
            try {
                const response = await fetch(`${indexApiUrl}/products`);
                const data = await response.json();
                if (data && data.data && Array.isArray(data.data)) {
                    products = data.data;
                } else if (Array.isArray(data)) {
                    products = data;
                }
            } catch (fetchError) {
                console.error('Fallback fetch error:', fetchError);
                products = [];
            }
        }
        
        // Clear container
        featuredContainer.innerHTML = '';
        
        // Check if there are products
        if (!products || products.length === 0) {
            featuredContainer.innerHTML = '<div class="no-products"><p>Henüz ürün bulunmamaktadır.</p></div>';
            return;
        }
        
        console.log('All products:', products);
        
        // Sort by featured first, then limit to 4 products
        const sortedProducts = [...products].sort((a, b) => {
            // Featured products first
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            
            // Then sort by newest
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            
            return 0;
        }).slice(0, 4);
        
        console.log('Featured products:', sortedProducts);
        
        // Add products to container
        sortedProducts.forEach(product => {
            const productCard = createProductCard(product);
            featuredContainer.appendChild(productCard);
        });
        
        // Initialize product card interactions
        initializeProductCards();
    } catch (error) {
        console.error('Error loading featured products:', error);
        featuredContainer.innerHTML = '<div class="no-products"><p>Ürünler yüklenirken bir hata oluştu.</p></div>';
    }
}

// Create a product card element
function createProductCard(product) {
    console.log('Creating card for product:', product);
    
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.setAttribute('data-id', product._id || product.id);
    
    // Format price
    let formattedPrice = '0,00';
    try {
        const priceValue = parseFloat(product.price);
        if (!isNaN(priceValue)) {
            formattedPrice = priceValue.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    } catch (error) {
        console.error(`Error formatting price for product ${product.name}:`, error);
    }
    
    // Format old price if exists
    let oldPriceHtml = '';
    try {
        if (product.comparePrice && parseFloat(product.comparePrice) > 0) {
            const oldPrice = parseFloat(product.comparePrice).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            oldPriceHtml = `<span class="old-price">${oldPrice} ₺</span>`;
        }
    } catch (error) {
        console.error(`Error formatting old price for product ${product.name}:`, error);
    }
    
    // Get product image
    let productImage = getProductImage(product);
    
    // Create badges
    let productBadges = '';
    
    // Add featured badge if product is featured
    if (product.featured) {
        productBadges += '<span class="product-badge featured">Öne Çıkan</span>';
    }
    
    // Add sale badge if product has a discount
    if (oldPriceHtml) {
        productBadges += '<span class="product-badge sale">İndirim</span>';
    }
    
    // Add new badge if product is new (added in the last 7 days)
    if (product.createdAt) {
        const createdDate = new Date(product.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (createdDate >= sevenDaysAgo) {
            productBadges += '<span class="product-badge new">Yeni</span>';
        }
    }
    
    card.innerHTML = `
        <div class="product-image">
            ${productBadges}
            <img src="${productImage}" alt="${product.name}">
            <div class="product-overlay">
                <a href="#" class="add-to-cart" data-id="${product._id || product.id}" title="Sepete Ekle">Sepete Ekle</a>
                <a href="./product.html?id=${product._id || product.id}" class="view-details" title="Detayları Gör">Detayları Gör</a>
            </div>
        </div>
        <div class="product-info">
            <div class="brand">D&D Brand</div>
            <h3>${product.name}</h3>
            <div class="price">${oldPriceHtml} ${formattedPrice} ₺</div>
        </div>
    `;
    
    return card;
}

// Get product image helper function
function getProductImage(product) {
    // Use the centralized ImageService if available
    if (window.ImageService && typeof window.ImageService.getProductImage === 'function') {
        return window.ImageService.getProductImage(product, { 
            category: product.category 
        });
    }
    
    // Fallback to original implementation if ImageService is not available
    let productImage = '/images/placeholder-product.jpg';
    
    try {
        // Check for images array
        if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
            productImage = product.images[0];
        } 
        // Check for single image string
        else if (typeof product.images === 'string' && product.images) {
            productImage = product.images;
        } 
        // Check for image property
        else if (product.image) {
            productImage = product.image;
        }
        
        // Check if image is a relative path and add API_URL if needed
        if (productImage && !productImage.startsWith('http') && !productImage.startsWith('/img/')) {
            // Make sure the path starts with a slash
            if (!productImage.startsWith('/')) {
                productImage = '/' + productImage;
            }
            productImage = `${indexApiUrl}${productImage}`;
        }
        
        // For demo/testing, use placeholder images if the image path doesn't exist
        if (productImage === '/img/no-image.jpg' || 
            productImage === `${indexApiUrl}/img/no-image.jpg` ||
            productImage === 'undefined' ||
            productImage === 'null') {
            // Use placeholder images based on product category
            const category = product.category ? product.category.toLowerCase() : '';
            if (category.includes('men') || category.includes('erkek')) {
                productImage = '/images/placeholder-men.jpg';
            } else if (category.includes('women') || category.includes('kadin') || category.includes('kadın')) {
                productImage = '/images/placeholder-women.jpg';
            } else if (category.includes('accessories') || category.includes('aksesuar')) {
                productImage = '/images/placeholder-accessories.jpg';
            } else {
                productImage = '/images/placeholder-product.jpg';
            }
        }
    } catch (error) {
        console.error(`Error processing image for product ${product.name}:`, error);
        productImage = '/images/placeholder-product.jpg';
    }
    
    return productImage;
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
                
                const productId = this.getAttribute('data-id');
                addToCart(productId);
            });
        });
    }
    
    // Make entire card clickable
    const productCards = document.querySelectorAll('.product-card');
    
    if (productCards.length > 0) {
        productCards.forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't trigger if clicking on a button or link
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                    return;
                }
                
                const productId = this.getAttribute('data-id');
                window.location.href = `./product.html?id=${productId}`;
            });
        });
    }
}

// Add to cart function
async function addToCart(productId) {
    try {
        // Get the button that triggered this to show loading state
        const addToCartBtn = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
        if (addToCartBtn) {
            addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            addToCartBtn.classList.add('loading');
            addToCartBtn.disabled = true;
        }
        
        // Validate product ID
        if (!productId) {
            showNotification('Geçersiz ürün bilgisi.', 'error');
            resetButton(addToCartBtn);
            return;
        }
        
        // Fetch product details from API
        const response = await fetch(`${indexApiUrl}/products/${productId}`);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        let product;
        
        if (data.success && data.data) {
            product = data.data;
        } else if (data && !data.success) {
            console.error('Error fetching product details:', data.message || 'Unknown error');
            showNotification('Ürün bilgileri alınamadı.', 'error');
            resetButton(addToCartBtn);
            return;
        } else if (data) {
            // Handle case where API returns product directly without success wrapper
            product = data;
        } else {
            console.error('Error fetching product details: Invalid response format');
            showNotification('Ürün bilgileri alınamadı.', 'error');
            resetButton(addToCartBtn);
            return;
        }
        
        // Check if product exists and has required properties
        if (!product || !product.name || !product.price) {
            showNotification('Ürün bilgileri eksik veya hatalı.', 'error');
            resetButton(addToCartBtn);
            return;
        }
        
        // If we have a global addToCart function in script.js, use that
        if (window.addToCart && typeof window.addToCart === 'function') {
            const result = await window.addToCart(product, 1);
            resetButton(addToCartBtn);
            return result;
        }
        
        // Otherwise, implement cart functionality here
        // Get cart from localStorage - use consistent key 'cart'
        let cart = localStorage.getItem('cart');
        cart = cart ? JSON.parse(cart) : [];
        
        // Check if product already in cart
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            // Increase quantity
            existingItem.quantity += 1;
            showNotification(`${product.name} sepete eklendi! (${existingItem.quantity} adet)`, 'success');
        } else {
            // Add new item
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                quantity: 1
            });
            showNotification(`${product.name} sepete eklendi!`, 'success');
        }
        
        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Update cart count
        updateCartCount();
        
        // Animation effect on cart icon
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.add('pulse');
            setTimeout(() => {
                cartIcon.classList.remove('pulse');
            }, 1000);
        }
        
        resetButton(addToCartBtn);
        return true;
    } catch (error) {
        console.error('Error adding product to cart:', error);
        showNotification('Ürün sepete eklenirken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        
        // Reset add to cart button
        const addToCartBtn = document.querySelector(`.add-to-cart[data-id="${productId}"]`);
        resetButton(addToCartBtn);
        
        return false;
    }
}

// Helper function to reset button state
function resetButton(button) {
    if (button) {
        button.innerHTML = 'Sepete Ekle';
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Update cart count
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (!cartCountElement) return;
    
    // Get cart from localStorage
    let cart = localStorage.getItem('cart');
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

// Extend the notification function to be more robust
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.shop-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `shop-notification ${type}`;
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="close-notification">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Initialize homepage functionality
function initializeHomepage() {
    // Activate animations
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => {
        el.classList.add('active');
    });
    
    // Add event listeners to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-id');
            addToCart(productId);
        });
    });
    
    // Initialize mobile product slider
    initializeMobileProductSlider();
    
    // Initialize banner slider
    initializeBannerSlider();
    
    // Optimize banners for mobile
    optimizeBannersForMobile();
    
    // Optimize single banner
    optimizeSingleBanner();
    
    // Add resize listener to re-optimize banners when window is resized
    window.addEventListener('resize', function() {
        optimizeBannersForMobile();
        optimizeSingleBanner();
    });
    
    // Add click handler to cart preview
    const cartPreview = document.querySelector('.cart-preview');
    if (cartPreview) {
        cartPreview.addEventListener('click', function(e) {
            // Prevent closing when clicking inside the preview
            e.stopPropagation();
        });
    }
    
    // Initialize cart count
    updateCartCount();
}

// Initialize the horizontal scroll behavior for product grid on mobile
function initializeMobileProductSlider() {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    // Only initialize slider on mobile devices
    if (window.innerWidth <= 576) {
        let startX;
        let startY;
        let scrollLeft;
        let isScrolling;
        
        // Calculate initial scroll position to center the first two items
        function centerInitialView() {
            // Wait for layout to be complete
            setTimeout(() => {
                // Reset scroll position to 0 to ensure we start at the beginning
                productGrid.scrollLeft = 0;
            }, 100);
        }
        
        // Run centering on load
        centerInitialView();
        
        // Add a class to indicate this is a slider
        productGrid.classList.add('mobile-slider');
        
        // Handle touch events for mobile swipe
        productGrid.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX;
            startY = e.touches[0].pageY;
            scrollLeft = productGrid.scrollLeft;
            isScrolling = undefined; // Reset direction detection
        }, { passive: true });
        
        productGrid.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const x = e.touches[0].pageX;
            const y = e.touches[0].pageY;
            const diffX = startX - x;
            const diffY = startY - y;
            
            // Determine direction on first move
            if (isScrolling === undefined) {
                isScrolling = Math.abs(diffY) > Math.abs(diffX);
            }
            
            // If scrolling horizontally, prevent default to avoid page scrolling
            if (!isScrolling) {
                if (e.cancelable) e.preventDefault();
                productGrid.scrollLeft = scrollLeft + diffX;
            }
        }, { passive: false });
        
        productGrid.addEventListener('touchend', () => {
            // After scrolling ends, check if we need to add has-scrolled class
            if (productGrid.scrollLeft > 20) {
                const trendingSection = document.querySelector('.trending');
                if (trendingSection && !trendingSection.classList.contains('has-scrolled')) {
                    trendingSection.classList.add('has-scrolled');
                }
            }
            
            // Reset variables
            startX = null;
            startY = null;
            isScrolling = undefined;
        });
        
        // Detect scroll event to update UI feedback
        productGrid.addEventListener('scroll', () => {
            const trendingSection = document.querySelector('.trending');
            if (trendingSection && productGrid.scrollLeft > 20 && !trendingSection.classList.contains('has-scrolled')) {
                trendingSection.classList.add('has-scrolled');
            }
        });
        
        // Ensure snap points are respected after scroll momentum ends
        productGrid.addEventListener('scrollend', () => {
            // Get the current scroll position
            const scrollLeft = productGrid.scrollLeft;
            
            // Fixed item width (card width + gap)
            const itemWidth = 144 + 16; // 144px card width + 16px gap
            
            // Calculate nearest snap point
            const snapPoint = Math.round(scrollLeft / itemWidth) * itemWidth;
            
            // Scroll to the nearest snap point with smooth behavior
            if (Math.abs(scrollLeft - snapPoint) > 5) {
                productGrid.scrollTo({
                    left: snapPoint,
                    behavior: 'smooth'
                });
            }
        });
        
        // Handle resize to maintain centering
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 576) {
                centerInitialView();
            }
        });
    }
}

// Fix banner image paths if needed
function fixBannerImagePaths() {
    console.log('Checking banner image paths');
    
    const bannerImages = document.querySelectorAll('.banner-slide img');
    bannerImages.forEach((img, index) => {
        // Add error handler
        img.onerror = function() {
            console.log(`Error loading banner image at: ${img.src}`);
            
            // Try alternative paths
            const filename = img.src.split('/').pop();
            const possiblePaths = [
                `/public/images/${filename}`,
                `public/images/${filename}`,
                `./public/images/${filename}`,
                `../public/images/${filename}`
            ];
            
            console.log(`Trying alternative paths for ${filename}`);
            
            // Try each path until one works
            let pathIndex = 0;
            const tryNextPath = () => {
                if (pathIndex < possiblePaths.length) {
                    const newPath = possiblePaths[pathIndex];
                    console.log(`Trying path: ${newPath}`);
                    
                    // Create a test image to see if the path works
                    const testImg = new Image();
                    testImg.onload = function() {
                        console.log(`Path works: ${newPath}`);
                        img.src = newPath; // Set the working path
                    };
                    testImg.onerror = function() {
                        pathIndex++;
                        tryNextPath(); // Try next path
                    };
                    testImg.src = newPath;
                } else {
                    // If all paths fail, use a default image
                    console.log('All paths failed, using default');
                    img.src = 'public/images/placeholder-product.jpg';
                }
            };
            
            tryNextPath();
        };
        
        // Force reload of the image
        const currentSrc = img.src;
        img.src = '';
        img.src = currentSrc;
    });
}

// Initialize the banner slider
function initializeBannerSlider() {
    console.log('Initializing banner slider');
    
    // Fix any image path issues
    fixBannerImagePaths();
    
    const bannerSlider = document.querySelector('.banner-slider');
    if (!bannerSlider) {
        console.error('Banner slider element not found');
        return;
    }
    
    const bannerSlides = bannerSlider.querySelectorAll('.banner-slide');
    const bannerDots = bannerSlider.querySelectorAll('.banner-dot');
    
    console.log(`Found ${bannerSlides.length} banner slides`);
    console.log(`Found ${bannerDots.length} banner dots`);
    
    if (bannerSlides.length <= 0) return;
    
    let currentIndex = 0;
    let autoSlideInterval;
    
    // Set initial active slide
    function setInitialSlide() {
        console.log('Setting initial slide');
        bannerSlides.forEach((slide, i) => {
            if (i === 0) {
                slide.classList.add('active');
                slide.style.display = 'block';
                slide.style.opacity = '1';
            } else {
                slide.classList.remove('active');
                slide.style.display = 'none';
                slide.style.opacity = '0';
            }
        });
        
        if (bannerDots.length > 0) {
            bannerDots[0].classList.add('active');
        }
    }
    
    // Call immediately to set up the first slide
    setInitialSlide();
    
    // Handle dot navigation clicks
    bannerDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'));
            navigateToSlide(index);
        });
    });
    
    // Desktop functionality - auto slide
    if (window.innerWidth > 576) {
        console.log('Starting desktop banner slideshow');
        startAutoSlide();
        
        // Pause auto-slide on hover
        bannerSlider.addEventListener('mouseenter', () => {
            clearInterval(autoSlideInterval);
        });
        
        // Resume auto-slide on mouse leave
        bannerSlider.addEventListener('mouseleave', () => {
            startAutoSlide();
        });
    } else {
        // Mobile functionality
        console.log('Setting up mobile banner slider');
        setupMobileSlider();
    }
    
    // Setup mobile slider
    function setupMobileSlider() {
        // Make all slides visible for mobile scrolling
        bannerSlides.forEach(slide => {
            slide.style.position = 'relative';
            slide.style.opacity = '1';
            slide.style.display = 'block';
        });
        
        // Add mobile-slider class if it's not already added through CSS
        bannerSlider.classList.add('mobile-slider');
        
        let startX;
        let startY;
        let scrollLeft;
        let isScrolling;
        
        // Handle touch events for swipe
        bannerSlider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX;
            startY = e.touches[0].pageY;
            scrollLeft = bannerSlider.scrollLeft;
            isScrolling = undefined;
        }, { passive: true });
        
        bannerSlider.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const x = e.touches[0].pageX;
            const y = e.touches[0].pageY;
            const diffX = startX - x;
            const diffY = startY - y;
            
            // Determine direction on first move
            if (isScrolling === undefined) {
                isScrolling = Math.abs(diffY) > Math.abs(diffX);
            }
            
            // If scrolling horizontally, prevent default to avoid page scrolling
            if (!isScrolling) {
                if (e.cancelable) e.preventDefault();
                bannerSlider.scrollLeft = scrollLeft + diffX;
            }
        }, { passive: false });
        
        bannerSlider.addEventListener('touchend', () => {
            // Determine which slide to navigate to based on scroll position
            const slideWidth = bannerSlides[0].offsetWidth;
            const scrollPosition = bannerSlider.scrollLeft;
            let newIndex = Math.round(scrollPosition / slideWidth);
            
            // Prevent out of bounds
            if (newIndex < 0) newIndex = 0;
            if (newIndex >= bannerSlides.length) newIndex = bannerSlides.length - 1;
            
            // Update current index and dots
            currentIndex = newIndex;
            updateActiveDot(currentIndex);
            
            // Smooth scroll to the selected slide
            bannerSlider.scrollTo({
                left: newIndex * slideWidth,
                behavior: 'smooth'
            });
            
            // Reset variables
            startX = null;
            startY = null;
            isScrolling = undefined;
        });
        
        // Update dots on scroll
        bannerSlider.addEventListener('scroll', () => {
            const slideWidth = bannerSlides[0].offsetWidth;
            const scrollPosition = bannerSlider.scrollLeft;
            const index = Math.round(scrollPosition / slideWidth);
            
            if (index !== currentIndex && index >= 0 && index < bannerSlides.length) {
                currentIndex = index;
                updateActiveDot(currentIndex);
            }
        });
    }
    
    // Start auto-slide functionality
    function startAutoSlide() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % bannerSlides.length;
            navigateToSlide(nextIndex);
        }, 5000); // Change slide every 5 seconds
    }
    
    // Navigate to a specific slide
    function navigateToSlide(index) {
        if (index === currentIndex) return;
        
        currentIndex = index;
        updateActiveDot(currentIndex);
        
        if (window.innerWidth <= 576) {
            // Mobile - scroll to slide
            const slideWidth = bannerSlides[0].offsetWidth;
            bannerSlider.scrollTo({
                left: index * slideWidth,
                behavior: 'smooth'
            });
        } else {
            // Desktop - update active class
            bannerSlides.forEach((slide, i) => {
                if (i === currentIndex) {
                    slide.style.display = 'block';
                    slide.classList.add('active');
                    // Fade in
                    setTimeout(() => {
                        slide.style.opacity = '1';
                    }, 50);
                } else {
                    slide.classList.remove('active');
                    // Fade out
                    slide.style.opacity = '0';
                    // Hide after transition
                    setTimeout(() => {
                        slide.style.display = 'none';
                    }, 600);
                }
            });
        }
    }
    
    // Update active dot
    function updateActiveDot(index) {
        bannerDots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }
}

// Add mobile-specific banner optimizations
function optimizeBannersForMobile() {
    const isMobile = window.innerWidth <= 576;
    
    if (isMobile) {
        console.log('Optimizing banners for mobile');
        
        // Get all banner slides and images
        const bannerSlides = document.querySelectorAll('.banner-slide');
        const bannerImages = document.querySelectorAll('.banner-slide img');
        const bannerSlider = document.querySelector('.banner-slider');
        
        // Add the mobile-banner-slider class if not already present
        if (bannerSlider && !bannerSlider.classList.contains('mobile-banner-slider')) {
            bannerSlider.classList.add('mobile-banner-slider');
        }
        
        // Ensure all slides are visible and properly positioned for the swiper
        bannerSlides.forEach(slide => {
            slide.style.height = 'auto';
            slide.style.position = 'relative';
            slide.style.opacity = '1';
            slide.style.display = 'block';
            
            // Ensure the slide has a direct link to shop page
            if (!slide.querySelector('a[href="/shop"]')) {
                // If the slide doesn't already have a direct link, wrap the image in one
                const img = slide.querySelector('img');
                if (img && !img.parentElement.tagName === 'A') {
                    const wrap = document.createElement('a');
                    wrap.href = '/shop';
                    img.parentNode.insertBefore(wrap, img);
                    wrap.appendChild(img);
                }
            }
            
            // Hide any buttons inside the slide
            const buttons = slide.querySelectorAll('.btn, .banner-content .btn');
            buttons.forEach(btn => {
                btn.style.display = 'none';
            });
        });
        
        // Ensure images are properly sized for mobile
        bannerImages.forEach(img => {
            img.style.height = 'auto';
            img.style.maxHeight = '70vh';
            img.style.objectFit = 'cover';
            
            // Force image to reload for proper sizing
            const currentSrc = img.src;
            if (currentSrc.includes('?')) {
                img.src = currentSrc;
            } else {
                img.src = currentSrc + '?t=' + new Date().getTime();
            }
            
            // Listen for image load to ensure it displays properly
            img.onload = function() {
                this.style.display = 'block';
            };
        });
        
        // Adjust container to full width on mobile
        const bannerContainer = document.querySelector('.promo-banners .container');
        if (bannerContainer) {
            bannerContainer.style.maxWidth = '100%';
            bannerContainer.style.width = '100%';
            bannerContainer.style.padding = '0';
        }
        
        // Optimize single banner for mobile
        optimizeSingleBanner();
    }
}

// Optimize the single banner for all devices
function optimizeSingleBanner() {
    const singleBanner = document.querySelector('.single-banner-wrapper img');
    if (!singleBanner) return;
    
    console.log('Optimizing single banner');
    
    // Force the image to display correctly
    singleBanner.style.display = 'block';
    singleBanner.style.width = '100%';
    
    if (window.innerWidth <= 576) {
        // Mobile specific optimizations
        singleBanner.style.height = 'auto';
        singleBanner.style.maxHeight = '70vh';
        singleBanner.style.objectFit = 'contain';
        
        // Adjust container to full width on mobile
        const singleBannerContainer = document.querySelector('.single-banner .container');
        if (singleBannerContainer) {
            singleBannerContainer.style.maxWidth = '100%';
            singleBannerContainer.style.width = '100%';
            singleBannerContainer.style.padding = '0';
        }
    } else {
        // Desktop specific optimizations
        singleBanner.style.objectFit = 'cover';
    }
    
    // Force image to reload for proper sizing
    const currentSrc = singleBanner.src;
    if (!currentSrc.includes('?')) {
        singleBanner.src = currentSrc + '?t=' + new Date().getTime();
    }
    
    // Set up fade-in animation
    setTimeout(() => {
        const bannerWrapper = document.querySelector('.single-banner');
        if (bannerWrapper) {
            bannerWrapper.classList.add('active');
        }
    }, 100);
} 
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

// Initialize countdown timer
function initializeCountdownTimer() {
    // Set the target date to one month from now
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setMonth(now.getMonth() + 1);
    
    // Get elements
    const daysElement = document.getElementById('countdown-days');
    const hoursElement = document.getElementById('countdown-hours');
    const minutesElement = document.getElementById('countdown-minutes');
    const secondsElement = document.getElementById('countdown-seconds');
    
    if (!daysElement || !hoursElement || !minutesElement || !secondsElement) {
        console.error('Countdown elements not found');
        return;
    }
    
    // Update the countdown every second
    function updateCountdown() {
        // Calculate the remaining time
        const currentTime = new Date();
        const timeDifference = targetDate - currentTime;
        
        // Check if the countdown has ended
        if (timeDifference <= 0) {
            daysElement.textContent = '0';
            hoursElement.textContent = '0';
            minutesElement.textContent = '0';
            secondsElement.textContent = '0';
            return;
        }
        
        // Calculate days, hours, minutes and seconds
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
        
        // Update the display with a flip animation
        updateWithAnimation(daysElement, days);
        updateWithAnimation(hoursElement, hours);
        updateWithAnimation(minutesElement, minutes);
        updateWithAnimation(secondsElement, seconds);
    }
    
    // Function to update with flip animation
    function updateWithAnimation(element, value) {
        const currentValue = parseInt(element.textContent);
        
        // Only animate if the value has changed
        if (currentValue !== value) {
            // Add flip out animation
            element.classList.add('flip-out');
            
            // Wait for animation to complete before changing the value
            setTimeout(() => {
                element.textContent = value < 10 ? '0' + value : value;
                element.classList.remove('flip-out');
                element.classList.add('flip-in');
                
                // Remove flip in animation after it completes
                setTimeout(() => {
                    element.classList.remove('flip-in');
                }, 300);
            }, 300);
        }
    }
    
    // Initial update
    updateCountdown();
    
    // Update every second
    setInterval(updateCountdown, 1000);
}

// Function to initialize all homepage functionality
function initializeHomepage() {
    console.log("Initializing homepage...");
    
    // Immediately activate all elements without animations
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => {
        el.classList.add('active');
        // Disable any transitions or transforms
        el.style.transition = 'none';
        el.style.transform = 'none';
        el.style.opacity = '1';
    });
    
    // Ensure product cards are initialized
    initializeProductCards();
    
    // Add event listeners to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-id');
            addToCart(productId);
        });
    });
    
    // Initialize countdown timer if present
    initializeCountdownTimer();
    
    // Fix spacing issues and optimize images
    fixSectionSpacingAndImages();
    
    // Fix banner images and setup sliders
    fixBannerImagePaths();
    setupMobileSlider();
    
    // Initialize banner slider
    initializeBannerSlider();
    
    // Optimize banners for mobile
    optimizeBannersForMobile();
    
    // Optimize collections for mobile
    optimizeCollectionsForMobile();
    
    // Initialize mobile product slider
    initializeMobileProductSlider();
    
    // Ensure text centering
    ensureTextCentering();
    
    // Initialize collections functionality
    initializeCollections();
    
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
    
    // Optimize single banner
    optimizeSingleBanner();
    
    // Force reflow to ensure proper rendering of swipeable banners on mobile
    if (window.innerWidth <= 576) {
        setTimeout(() => {
            const bannerSlider = document.querySelector('.banner-slider');
            if (bannerSlider) {
                bannerSlider.style.display = 'none';
                // Force reflow
                void bannerSlider.offsetHeight;
                bannerSlider.style.display = 'flex';
            }
        }, 100);
    }
    
    // Disable scroll animations
    window.addEventListener('scroll', function() {
        // Do nothing - prevent scroll animations
    }, { passive: true });
    
    console.log("Homepage initialization complete!");
}

// Fix spacing between sections and ensure images display properly
function fixSectionSpacingAndImages() {
    // Remove any unwanted animations or effects
    document.querySelectorAll('img').forEach(img => {
        img.style.transform = 'none';
        img.style.transition = 'none';
    });

    // Fix premium banner image on mobile
    const premiumBannerImage = document.querySelector('.premium-banner-image');
    if (premiumBannerImage && window.innerWidth <= 576) {
        // Ensure minimum height for mobile views
        premiumBannerImage.style.minHeight = '450px';
        
        // For very small screens
        if (window.innerWidth <= 375) {
            premiumBannerImage.style.minHeight = '500px';
        }
        
        // Ensure proper image display
        const img = premiumBannerImage.querySelector('img');
        if (img) {
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'center';
            img.style.width = '100%';
            img.style.height = '100%';
        }
    }
    
    // Fix collection sections (all)
    document.querySelectorAll('.featured-collections, .parfume-collections, .casual-collections').forEach(section => {
        // Remove any margin or padding
        section.style.margin = '0';
        section.style.padding = '0';
        
        // Fix the collection items
        const items = section.querySelectorAll('.collection-item');
        items.forEach(item => {
            // Set proper styles
            item.style.margin = '0';
            item.style.padding = '0';
            
            // Fix the images
            const img = item.querySelector('img');
            if (img) {
                img.style.display = 'block';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.transform = 'none';
                img.style.transition = 'none';
            }
            
            // Fix the overlay
            const overlay = item.querySelector('.collection-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.style.flexDirection = 'column';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.style.textAlign = 'center';
            }
        });
    });
    
    // Fix text centering for all key sections
    ensureTextCentering();

    // Ensure zero margin/padding for all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.margin = '0';
        section.style.padding = '0';
    });

    // Ensure containers are full width on mobile
    if (window.innerWidth <= 576) {
        document.querySelectorAll('.container').forEach(container => {
            container.style.maxWidth = '100%';
            container.style.width = '100%';
            container.style.padding = '0';
            container.style.margin = '0';
        });
    }
}

// New function to ensure text is centered properly across all sections
function ensureTextCentering() {
    // Hero section text centering
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.textAlign = 'center';
        
        // Position hero content in the middle for all screen sizes
        heroContent.style.position = 'absolute';
        heroContent.style.top = '50%';
        heroContent.style.left = '50%';
        heroContent.style.transform = 'translate(-50%, -50%)';
        
        // Make sure all inner elements are centered
        const heroTitle = heroContent.querySelector('.hero-title');
        const heroSubtitle = heroContent.querySelector('.hero-subtitle');
        
        if (heroTitle) heroTitle.style.textAlign = 'center';
        if (heroSubtitle) heroSubtitle.style.textAlign = 'center';
        
        // Center hero buttons
        const heroButtons = heroContent.querySelector('.hero-buttons');
        if (heroButtons) {
            heroButtons.style.display = 'flex';
            heroButtons.style.justifyContent = 'center';
        }
        
        // Center hero features
        const heroFeatures = heroContent.querySelector('.hero-features');
        if (heroFeatures) {
            heroFeatures.style.display = 'flex';
            heroFeatures.style.justifyContent = 'center';
        }
    }
    
    // Premium banner text centering
    const premiumContent = document.querySelector('.premium-banner-content');
    if (premiumContent) {
        premiumContent.style.textAlign = 'center';
        premiumContent.style.display = 'flex';
        premiumContent.style.flexDirection = 'column';
        premiumContent.style.alignItems = 'center';
        premiumContent.style.justifyContent = 'center';
        
        // Ensure title line is centered
        const premiumTitle = premiumContent.querySelector('h2');
        if (premiumTitle && premiumTitle.style) {
            premiumTitle.style.textAlign = 'center';
        }
    }
    
    // Collection overlay text centering (for all collection types)
    document.querySelectorAll('.featured-collections .collection-overlay, .parfume-collections .collection-overlay, .casual-collections .collection-overlay').forEach(overlay => {
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.textAlign = 'center';
        
        const title = overlay.querySelector('.collection-title');
        if (title) {
            title.style.textAlign = 'center';
            title.style.width = '100%';
        }
        
        const btn = overlay.querySelector('.collection-btn');
        if (btn) {
            btn.style.textAlign = 'center';
        }
    });
    
    // Limited offer text centering
    const offerContent = document.querySelector('.offer-content');
    if (offerContent) {
        offerContent.style.textAlign = 'center';
        
        const offerTitle = offerContent.querySelector('.offer-title');
        const offerSubtitle = offerContent.querySelector('.offer-subtitle');
        
        if (offerTitle) offerTitle.style.textAlign = 'center';
        if (offerSubtitle) offerSubtitle.style.textAlign = 'center';
        
        // Center countdown timer
        const countdownTimer = offerContent.querySelector('.countdown-timer');
        if (countdownTimer) {
            countdownTimer.style.display = 'flex';
            countdownTimer.style.justifyContent = 'center';
        }
    }
    
    // Section titles centering
    document.querySelectorAll('.section-title').forEach(title => {
        title.style.textAlign = 'center';
    });
}

// Keep the original initializeCollections function but remove any animations
function initializeCollections() {
    // Get all collection sections
    const collectionSections = document.querySelectorAll('.featured-collections, .parfume-collections, .casual-collections');
    
    // For each collection section
    collectionSections.forEach(section => {
        const items = section.querySelectorAll('.collection-item');
        
        // Make sure collection items have proper hover effects
        items.forEach(item => {
            // Remove any animations or transforms
            const img = item.querySelector('img');
            if (img) {
                img.style.transform = 'none';
                img.style.transition = 'none';
            }
            
            // Ensure overlay is properly positioned
            const overlay = item.querySelector('.collection-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.style.flexDirection = 'column';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.style.textAlign = 'center';
            }
            
            // Ensure collection title is centered
            const title = item.querySelector('.collection-title');
            if (title) {
                title.style.textAlign = 'center';
            }
        });
    });
    
    // Ensure proper spacing between collection sections
    collectionSections.forEach((section, index) => {
        if (index > 0) {
            section.style.marginTop = '0';
        }
    });
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

// Enhanced mobile banner slider setup
function setupMobileSlider() {
    const bannerSlider = document.querySelector('.banner-slider');
    if (!bannerSlider) return;
    
    const bannerSlides = bannerSlider.querySelectorAll('.banner-slide');
    const bannerDots = bannerSlider.querySelectorAll('.banner-dot');
    
    // Initialize CSS class for mobile
    bannerSlider.classList.add('mobile-banner-slider');
    
    // Set display flex for horizontal arrangement
    bannerSlider.style.display = 'flex';
    bannerSlider.style.flexDirection = 'row';
    bannerSlider.style.width = '100%';
    bannerSlider.style.overflowX = 'scroll';
    bannerSlider.style.scrollSnapType = 'x mandatory';
    
    // Make all slides visible for mobile
    bannerSlides.forEach((slide, index) => {
        slide.style.position = 'relative';
        slide.style.opacity = '1';
        slide.style.display = 'block';
        slide.style.flex = '0 0 100%';
        slide.style.width = '100%';
        slide.style.scrollSnapAlign = 'start';
        
        // Set z-index to properly layer slides
        slide.style.zIndex = bannerSlides.length - index;
        
        // Ensure slides have links to shop page
        if (!slide.querySelector('a[href="/shop"]')) {
            const img = slide.querySelector('img');
            if (img && img.parentElement.tagName !== 'A') {
                const wrap = document.createElement('a');
                wrap.href = '/shop';
                img.parentNode.insertBefore(wrap, img);
                wrap.appendChild(img);
            }
        }
        
        // Ensure images take full width
        const img = slide.querySelector('img');
        if (img) {
            img.style.width = '100%';
            img.style.objectFit = 'cover';
            img.style.height = 'auto';
            img.style.minHeight = '250px';
            img.style.margin = '0';
            img.style.padding = '0';
            img.style.borderRadius = '0';
            img.style.boxShadow = 'none';
        }
    });

    // Variables for touch handling
    let isSwiping = false;
    let startX, startY, startScrollLeft;
    let currentIndex = 0;
    
    // Get slide width after slides are visible
    const getSlideWidth = () => bannerSlides[0].offsetWidth;
    
    // Improved swipe handlers
    bannerSlider.addEventListener('touchstart', (e) => {
        isSwiping = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startScrollLeft = bannerSlider.scrollLeft;
        bannerSlider.style.cursor = 'grabbing';
    }, { passive: true });
    
    bannerSlider.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        const walkX = x - startX;
        const walkY = y - startY;
        
        // Vertical scrolling detection
        if (Math.abs(walkY) > Math.abs(walkX)) {
            return;
        }
        
        // Prevent default only for horizontal swipes
        if (e.cancelable) e.preventDefault();
        
        bannerSlider.scrollLeft = startScrollLeft - walkX;
    }, { passive: false });
    
    bannerSlider.addEventListener('touchend', () => {
        if (!isSwiping) return;
        isSwiping = false;
        
        const slideWidth = getSlideWidth();
        const scrollPosition = bannerSlider.scrollLeft;
        currentIndex = Math.round(scrollPosition / slideWidth);
        
        // Ensure index is within bounds
        currentIndex = Math.max(0, Math.min(currentIndex, bannerSlides.length - 1));
        
        // Smooth scroll to the current slide
        bannerSlider.scrollTo({
            left: currentIndex * slideWidth,
            behavior: 'smooth'
        });
        
        // Update active dot
        updateActiveDot(currentIndex);
        
        bannerSlider.style.cursor = 'grab';
    });
    
    // Update dots on scroll
    bannerSlider.addEventListener('scroll', () => {
        const slideWidth = getSlideWidth();
        const scrollPosition = bannerSlider.scrollLeft;
        const index = Math.round(scrollPosition / slideWidth);
        
        if (index !== currentIndex) {
            currentIndex = index;
            updateActiveDot(currentIndex);
        }
    });
    
    // Click event for dots
    bannerDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            
            // Scroll to the selected slide
            bannerSlider.scrollTo({
                left: index * getSlideWidth(),
                behavior: 'smooth'
            });
            
            // Update active dot
            updateActiveDot(index);
        });
    });
    
    // Update active dot
    function updateActiveDot(index) {
        bannerDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
    
    // Initial scroll to first slide
    setTimeout(() => {
        bannerSlider.scrollTo({
            left: 0,
            behavior: 'auto'
        });
        updateActiveDot(0);
    }, 100);
}

// Initialize banner slider
function initializeBannerSlider() {
    console.log('Initializing banner slider');
    
    // Fix any image path issues
    fixBannerImagePaths();
    
    const bannerSlider = document.querySelector('.banner-slider');
    if (!bannerSlider) {
        console.error('Banner slider element not found');
        return;
    }
    
    const isMobile = window.innerWidth <= 576;
    
    if (isMobile) {
        // Use mobile setup for small screens
        setupMobileSlider();
    } else {
        // Desktop setup with autoplay
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
        
        // Set first slide as active
        setInitialSlide();
        
        // Start auto-slide for desktop
        startAutoSlide();
        
        // Click event for dots (desktop)
        bannerDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                navigateToSlide(index);
            });
        });
        
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
            
            bannerSlides[currentIndex].style.opacity = '0';
            bannerSlides[currentIndex].style.display = 'block';
            
            setTimeout(() => {
                bannerSlides[currentIndex].style.display = 'none';
                bannerSlides[currentIndex].classList.remove('active');
                
                currentIndex = index;
                
                bannerSlides[currentIndex].style.display = 'block';
                
                setTimeout(() => {
                    bannerSlides[currentIndex].style.opacity = '1';
                    bannerSlides[currentIndex].classList.add('active');
                    
                    updateActiveDot(currentIndex);
                }, 50);
            }, 600);
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
}

// Add a resize handler to switch between mobile and desktop modes
window.addEventListener('resize', function() {
    // Use a debounce technique to avoid multiple calls
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(function() {
        initializeBannerSlider();
        optimizeBannersForMobile();
    }, 250);
});

// Add mobile-specific banner optimizations
function optimizeBannersForMobile() {
    const isMobile = window.innerWidth <= 576;
    
    if (isMobile) {
        console.log('Optimizing banners for mobile');
        
        // Get banner elements
        const bannerSlider = document.querySelector('.banner-slider');
        const bannerSlides = document.querySelectorAll('.banner-slide');
        const bannerImages = document.querySelectorAll('.banner-slide img');
        
        // Ensure slider has mobile-banner-slider class
        if (bannerSlider && !bannerSlider.classList.contains('mobile-banner-slider')) {
            bannerSlider.classList.add('mobile-banner-slider');
        }
        
        // Show all slides for mobile swiping
        bannerSlides.forEach(slide => {
            slide.style.position = 'relative';
            slide.style.opacity = '1';
            slide.style.display = 'block';
            slide.style.height = 'auto';
            
            // Ensure direct links
            if (!slide.querySelector('a[href="/shop"]')) {
                const img = slide.querySelector('img');
                if (img && img.parentElement.tagName !== 'A') {
                    const wrap = document.createElement('a');
                    wrap.href = '/shop';
                    img.parentNode.insertBefore(wrap, img);
                    wrap.appendChild(img);
                }
            }
            
            // Hide any buttons
            const buttons = slide.querySelectorAll('.btn, .banner-content .btn');
            buttons.forEach(btn => {
                btn.style.display = 'none';
            });
        });
        
        // Ensure images are properly sized for consistent dimensions
        bannerImages.forEach(img => {
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.objectFit = 'cover';
            img.style.aspectRatio = '16/9';
            
            // Force image reload for proper sizing
            const currentSrc = img.src;
            img.src = currentSrc.includes('?') ? currentSrc : currentSrc + '?t=' + new Date().getTime();
        });
        
        // Adjust container to full width
        const bannerContainer = document.querySelector('.promo-banners .container');
        if (bannerContainer) {
            bannerContainer.style.maxWidth = '100%';
            bannerContainer.style.width = '100%';
            bannerContainer.style.padding = '0';
            bannerContainer.style.margin = '0';
        }
        
        // Optimize single banner
        const singleBanner = document.querySelector('.single-banner');
        if (singleBanner) {
            singleBanner.style.margin = '0';
            singleBanner.style.padding = '0';
            
            const singleBannerContainer = singleBanner.querySelector('.container');
            if (singleBannerContainer) {
                singleBannerContainer.style.maxWidth = '100%';
                singleBannerContainer.style.width = '100%';
                singleBannerContainer.style.padding = '0';
                singleBannerContainer.style.margin = '0';
            }
            
            const singleBannerWrapper = singleBanner.querySelector('.single-banner-wrapper');
            if (singleBannerWrapper) {
                singleBannerWrapper.style.borderRadius = '0';
                singleBannerWrapper.style.boxShadow = 'none';
            }
            
            const singleBannerImg = singleBanner.querySelector('img');
            if (singleBannerImg) {
                singleBannerImg.style.width = '100%';
                singleBannerImg.style.height = 'auto';
                singleBannerImg.style.objectFit = 'cover';
                singleBannerImg.style.aspectRatio = '16/9';
                singleBannerImg.style.margin = '0';
                singleBannerImg.style.padding = '0';
                singleBannerImg.style.borderRadius = '0';
                
                // Force image reload for proper sizing
                const currentSrc = singleBannerImg.src;
                singleBannerImg.src = currentSrc.includes('?') ? currentSrc : currentSrc + '?t=' + new Date().getTime();
            }
        }
        
        // Remove spacing between sections
        document.querySelectorAll('.hero, .promo-banners, .single-banner, .featured-collections').forEach(section => {
            section.style.margin = '0';
            section.style.padding = '0';
        });
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

function optimizeCollectionsForMobile() {
    // Check if we're on mobile
    if (window.innerWidth <= 576) {
        const collectionSections = document.querySelectorAll('.featured-collections');
        
        collectionSections.forEach(section => {
            // Remove any padding/margin that might prevent edge-to-edge display
            section.style.padding = '20px 0 0';
            section.style.margin = '0';
            section.style.width = '100%';
            
            // Make the container full width
            const container = section.querySelector('.container');
            if (container) {
                container.style.width = '100%';
                container.style.maxWidth = '100%';
                container.style.padding = '0';
                container.style.margin = '0';
            }
            
            // Make collection grid edge-to-edge
            const grid = section.querySelector('.collection-grid');
            if (grid) {
                grid.style.display = 'block';
                grid.style.gap = '0';
                grid.style.margin = '0';
                grid.style.width = '100%';
            }
            
            // Adjust collection items
            const items = section.querySelectorAll('.collection-item');
            items.forEach((item, index) => {
                item.style.marginBottom = index === items.length - 1 ? '0' : '2px';
                item.style.height = '250px';
                item.style.borderRadius = '0';
                
                // Make overlay always visible on mobile
                const overlay = item.querySelector('.collection-overlay');
                if (overlay) {
                    overlay.style.opacity = '1';
                    overlay.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 70%)';
                }
                
                // Adjust collection title position and visibility
                const title = item.querySelector('.collection-title');
                if (title) {
                    title.style.opacity = '1';
                    title.style.transform = 'translateY(0)';
                    title.style.bottom = '60px';
                }
                
                // Adjust collection button position and visibility
                const btn = item.querySelector('.collection-btn');
                if (btn) {
                    btn.style.opacity = '1';
                    btn.style.transform = 'translateY(0)';
                    btn.style.bottom = '20px';
                }
            });
        });
    }
} 
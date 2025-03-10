/**
 * D&D Brand E-commerce - Image Service
 * Centralized service for handling product images
 */

// Get API URL from config if available
const imageServiceApiUrl = window.CONFIG && window.CONFIG.API_URL 
    ? window.CONFIG.API_URL 
    : 'https://dndbrand-server.onrender.com/api';

// Default placeholder images by category - use absolute paths
const PLACEHOLDER_IMAGES = {
    men: '/images/placeholder-men.jpg',
    women: '/images/placeholder-women.jpg',
    accessories: '/images/placeholder-accessories.jpg',
    default: '/images/placeholder-product.jpg'
};

// Remote placeholder (stored in database) - always available in production
const DATABASE_PLACEHOLDER_URL = 'https://dndbrand-server.onrender.com/api/uploads/image/placeholder-product.jpg';

// Default image path - use placeholder-product.jpg as the default fallback
const DEFAULT_IMAGE = '/images/placeholder-product.jpg';

// Maximum number of retry attempts
const MAX_RETRY_ATTEMPTS = 2;

// Track whether database placeholder is available
let isDatabasePlaceholderAvailable = false;

// Preload the database placeholder image
function preloadDatabasePlaceholder() {
    const img = new Image();
    img.onload = function() {
        isDatabasePlaceholderAvailable = true;
        console.log('Database placeholder image loaded successfully');
    };
    img.onerror = function() {
        isDatabasePlaceholderAvailable = false;
        console.warn('Database placeholder image not available, will use local file fallback');
    };
    img.src = DATABASE_PLACEHOLDER_URL;
}

// Try to preload the database placeholder
preloadDatabasePlaceholder();

/**
 * Get the best available placeholder image
 * @param {string} category - Optional category for specialized placeholders
 * @returns {string} The best available placeholder image URL
 */
function getBestPlaceholder(category) {
    // If database placeholder is available, use it (most reliable)
    if (isDatabasePlaceholderAvailable) {
        return DATABASE_PLACEHOLDER_URL;
    }
    
    // Otherwise fall back to category-specific or default local placeholder
    return getCategoryPlaceholder(category);
}

/**
 * Global image error handler to prevent endless loading loops
 * @param {HTMLImageElement} imgElement - The image element that failed to load
 * @param {string} fallbackSrc - The fallback image source to use if retries fail
 * @param {number} maxRetries - Maximum number of retry attempts
 */
function handleImageError(imgElement, fallbackSrc, maxRetries = MAX_RETRY_ATTEMPTS) {
    // Skip if no image element provided
    if (!imgElement) return;
    
    // Get current retry count or initialize to 0
    const currentRetryCount = parseInt(imgElement.dataset.retryCount || '0');
    
    // If we haven't reached max retries, try again
    if (currentRetryCount < maxRetries) {
        // Increment retry count
        imgElement.dataset.retryCount = (currentRetryCount + 1).toString();
        
        // Log retry attempt
        console.log(`Retrying image load (${currentRetryCount + 1}/${maxRetries}): ${imgElement.src}`);
        
        // Add cache-busting parameter to force reload
        const originalSrc = imgElement.src.split('?')[0];
        const newSrc = `${originalSrc}?retry=${Date.now()}`;
        
        // Try again after a short delay
        setTimeout(() => {
            imgElement.src = newSrc;
        }, 1000);
    } else {
        // Max retries reached, use fallback image
        console.log('Max retries reached, using fallback image');
        imgElement.src = getBestPlaceholder() || fallbackSrc || PLACEHOLDER_IMAGES.default;
        imgElement.onerror = null; // Prevent further retries
    }
}

/**
 * Apply the image error handler to all images on the page
 */
function applyImageErrorHandler() {
    // Wait for DOM to be ready
    const applyHandlers = () => {
        // Get all images on the page
        const images = document.querySelectorAll('img');
        
        // Apply error handler to each image
        images.forEach(img => {
            // Skip images that already have our error handler
            if (img.hasAttribute('data-error-handled')) return;
            
            // Mark image as handled
            img.setAttribute('data-error-handled', 'true');
            
            // Get appropriate fallback based on image classes or parent elements
            let fallbackSrc = PLACEHOLDER_IMAGES.default;
            
            // Check if image is in a product card with a category
            const productCard = img.closest('[data-category]');
            if (productCard) {
                const category = productCard.getAttribute('data-category');
                fallbackSrc = getCategoryPlaceholder(category);
            }
            
            // Set error handler
            img.onerror = function() {
                handleImageError(this, fallbackSrc);
            };
        });
    };
    
    // Apply now if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyHandlers);
    } else {
        applyHandlers();
    }
    
    // Set up MutationObserver to catch dynamically added images
    if (document.body) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        // Apply to direct image nodes
                        if (node.tagName === 'IMG') {
                            if (!node.hasAttribute('data-error-handled')) {
                                node.setAttribute('data-error-handled', 'true');
                                node.onerror = function() {
                                    handleImageError(this, getBestPlaceholder());
                                };
                            }
                        }
                        
                        // Apply to all images inside added nodes
                        if (node.querySelectorAll) {
                            const images = node.querySelectorAll('img');
                            images.forEach(img => {
                                if (!img.hasAttribute('data-error-handled')) {
                                    img.setAttribute('data-error-handled', 'true');
                                    img.onerror = function() {
                                        handleImageError(this, getBestPlaceholder());
                                    };
                                }
                            });
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Apply error handler to all images when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyImageErrorHandler);
} else {
    applyImageErrorHandler();
}

/**
 * Get product image URL with proper handling of various formats
 * @param {Object|Array|String} image - The image data from the product
 * @param {Object} options - Options for image processing
 * @param {boolean} options.useThumbnail - Whether to use thumbnail if available
 * @param {string} options.category - Product category for fallback images
 * @param {boolean} options.fullSize - Whether to return full-size image
 * @returns {string} - The processed image URL
 */
function getProductImage(image, options = {}) {
    try {
        // Set default options
        const { useThumbnail = true, category = '', fullSize = false } = options;
        
        // Handle null, undefined, or empty values
        if (!image) {
            return getBestPlaceholder(category);
        }
        
        // If image is an array, use the first item
        if (Array.isArray(image)) {
            if (image.length === 0) {
                return getBestPlaceholder(category);
            }
            return getProductImage(image[0], options);
        }
        
        // If image is a product object, extract the images property
        if (typeof image === 'object' && image !== null && image.images) {
            return getProductImage(image.images, options);
        }
        
        // If image is an object, try to extract the URL
        if (typeof image === 'object' && image !== null) {
            // If fullSize is requested and original is available, use it
            if (fullSize && image.original) {
                return processImagePath(image.original);
            }
            
            // Use thumbnail if available and requested
            if (useThumbnail && image.thumbnail) {
                return processImagePath(image.thumbnail);
            }
            
            // Try other common properties
            if (image.url) {
                return processImagePath(image.url);
            } else if (image.src) {
                return processImagePath(image.src);
            } else if (image.path) {
                return processImagePath(image.path);
            } else if (image.original) {
                return processImagePath(image.original);
            }
            
            // Can't extract a string URL from the object
            return getBestPlaceholder(category);
        }
        
        // Ensure image is a string at this point
        if (typeof image !== 'string') {
            return getBestPlaceholder(category);
        }
        
        // Process the image path
        return processImagePath(image);
    } catch (error) {
        console.error('Error processing product image:', error);
        return getBestPlaceholder(category);
    }
}

/**
 * Process an image path to ensure it's a valid URL
 * @param {string} imagePath - The image path to process
 * @returns {string} - The processed image URL
 */
function processImagePath(imagePath) {
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    // If it's a relative path to our images folder, return it as is
    if (imagePath.startsWith('/images/')) {
        return imagePath;
    }
    
    // Check for problematic patterns and return the best placeholder
    const problematicPatterns = [
        'no-image.jpg',
        'undefined',
        'default-product.jpg'
    ];
    
    if (problematicPatterns.some(pattern => imagePath.includes(pattern)) ||
        imagePath.includes('placeholder-product.jpg')) {
        return getBestPlaceholder();
    }
    
    // Handle uploads directory paths
    if (imagePath.includes('/uploads/')) {
        // Make sure we don't duplicate the /api/ part
        if (imagePath.startsWith('/api/uploads/')) {
            return imagePath;
        }
        
        // Make sure the path starts with a slash
        if (!imagePath.startsWith('/')) {
            imagePath = '/' + imagePath;
        }
        
        // Return the full API URL with the uploads path
        return `${imageServiceApiUrl}${imagePath}`;
    }
    
    // If it's just a filename, add the API URL path
    if (!imagePath.includes('/')) {
        return `${imageServiceApiUrl}/images/${imagePath}`;
    }
    
    // Make sure the path starts with a slash
    if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
    }
    
    // Default to API URL
    return `${imageServiceApiUrl}${imagePath}`;
}

/**
 * Get a placeholder image based on product category
 * @param {string} category - The product category
 * @returns {string} - The placeholder image URL
 */
function getCategoryPlaceholder(category) {
    if (!category) return PLACEHOLDER_IMAGES.default;
    
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('men') || lowerCategory.includes('erkek')) {
        return PLACEHOLDER_IMAGES.men;
    } else if (lowerCategory.includes('women') || lowerCategory.includes('kadin') || lowerCategory.includes('kadın')) {
        return PLACEHOLDER_IMAGES.women;
    } else if (lowerCategory.includes('accessories') || lowerCategory.includes('aksesuar')) {
        return PLACEHOLDER_IMAGES.accessories;
    }
    
    return PLACEHOLDER_IMAGES.default;
}

// Export the functions
window.ImageService = {
    getProductImage,
    processImagePath,
    getCategoryPlaceholder,
    getBestPlaceholder,
    handleImageError,
    applyImageErrorHandler
}; 
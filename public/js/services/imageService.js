/**
 * DnD Brand E-commerce - Image Service
 * Centralized service for handling product images
 */

// Get API URL from config if available
const API_URL = window.CONFIG && window.CONFIG.API_URL 
    ? window.CONFIG.API_URL 
    : 'https://dndbrand-server.onrender.com/api';

// Default placeholder images by category
const PLACEHOLDER_IMAGES = {
    men: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    women: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    accessories: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    default: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
};

// Default image path
const DEFAULT_IMAGE = `${API_URL}/images/default-product.jpg`;

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
            return getCategoryPlaceholder(category);
        }
        
        // If image is an array, use the first item
        if (Array.isArray(image)) {
            if (image.length === 0) {
                return getCategoryPlaceholder(category);
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
            return getCategoryPlaceholder(category);
        }
        
        // Ensure image is a string at this point
        if (typeof image !== 'string') {
            return getCategoryPlaceholder(category);
        }
        
        // Process the image path
        return processImagePath(image);
    } catch (error) {
        console.error('Error processing product image:', error);
        return getCategoryPlaceholder(category);
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
        return `${API_URL}${imagePath}`;
    }
    
    // If it's just a filename, add the API URL path
    if (!imagePath.includes('/')) {
        return `${API_URL}/images/${imagePath}`;
    }
    
    // Make sure the path starts with a slash
    if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
    }
    
    // Default to API URL
    return `${API_URL}${imagePath}`;
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
    getCategoryPlaceholder
}; 
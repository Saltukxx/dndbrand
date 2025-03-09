/**
 * DnD Brand Image Service
 * Centralized image handling with caching and fallbacks
 */

class ImageService {
    constructor() {
        // Configuration
        this.config = {
            apiBaseUrl: window.CONFIG?.API_URL || 'https://dndbrand-server.onrender.com/api',
            fallbackImage: '/images/placeholder-product.jpg',
            localFallbackImage: '/images/placeholder-product.jpg',
            maxRetries: 2,
            retryDelay: 1000
        };
        
        // Cache for successful image loads
        this.imageCache = new Map();
        
        // Load error tracking to avoid repeated failed requests
        this.loadErrors = new Map();
        
        // Preload the fallback image
        this._preloadFallbackImage();
        
        console.log('ImageService initialized with API base:', this.config.apiBaseUrl);
    }
    
    /**
     * Get a product image with fallback handling
     * @param {string|null} imagePath - The image path or URL
     * @param {Object} options - Options for image loading
     * @returns {string} The resolved image URL
     */
    getProductImage(imagePath, options = {}) {
        const { fullSize = false, useCache = true } = options;
        
        // Handle null, undefined or empty cases
        if (!imagePath) {
            return this.getFallbackImage();
        }
        
        // Convert to string if it's not already
        let resolvedPath = this._resolveImagePath(imagePath);
        
        // Check cache first if enabled
        if (useCache && this.imageCache.has(resolvedPath)) {
            return this.imageCache.get(resolvedPath);
        }
        
        // Check if we've already had errors with this image
        if (this.loadErrors.has(resolvedPath)) {
            return this.getFallbackImage();
        }
        
        // Load the image in the background to check if it exists
        this._preloadImage(resolvedPath);
        
        return resolvedPath;
    }
    
    /**
     * Preload an image and cache the result
     * @param {string} imageUrl - The image URL to preload
     * @param {number} retryCount - Current retry attempt
     * @private
     */
    _preloadImage(imageUrl, retryCount = 0) {
        const img = new Image();
        
        img.onload = () => {
            // Cache successful loads
            this.imageCache.set(imageUrl, imageUrl);
        };
        
        img.onerror = () => {
            if (retryCount < this.config.maxRetries) {
                // Retry with a delay
                console.log(`Retrying image load (${retryCount + 1}/${this.config.maxRetries}): ${imageUrl}`);
                setTimeout(() => {
                    // Add a cache-busting parameter
                    const retrySrc = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}retry=${Date.now()}`;
                    this._preloadImage(retrySrc, retryCount + 1);
                }, this.config.retryDelay);
            } else {
                // Mark as failed after max retries
                console.log('Max retries reached, using fallback image');
                this.loadErrors.set(imageUrl, true);
                
                // If we're showing this image, replace it with fallback
                const imgElements = document.querySelectorAll(`img[src="${imageUrl}"]`);
                imgElements.forEach(element => {
                    element.src = this.getFallbackImage();
                });
            }
        };
        
        img.src = imageUrl;
    }
    
    /**
     * Preload the fallback image to ensure it's available
     * @private
     */
    _preloadFallbackImage() {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
            console.log('Fallback image loaded successfully');
            // Cache the fallback image so we know it works
            this.imageCache.set(this.config.localFallbackImage, this.config.localFallbackImage);
        };
        
        fallbackImg.onerror = () => {
            console.warn('Fallback image failed to load, using absolute path instead');
            // If local fallback fails, update to absolute URL
            this.config.localFallbackImage = window.location.origin + '/images/placeholder-product.jpg';
            
            // Try with absolute path
            const absoluteFallbackImg = new Image();
            absoluteFallbackImg.src = this.config.localFallbackImage;
        };
        
        fallbackImg.src = this.config.localFallbackImage;
    }
    
    /**
     * Resolve the image path to a full URL
     * @param {string|object|array} imagePath - Raw image path data
     * @returns {string} Full image URL
     * @private
     */
    _resolveImagePath(imagePath) {
        // Handle array input
        if (Array.isArray(imagePath)) {
            return imagePath.length > 0 
                ? this._resolveImagePath(imagePath[0]) 
                : this.getFallbackImage();
        }
        
        // Handle object input
        if (typeof imagePath === 'object' && imagePath !== null) {
            // Try various common properties
            for (const prop of ['url', 'src', 'path', 'original', 'thumbnail']) {
                if (imagePath[prop]) {
                    return this._resolveImagePath(imagePath[prop]);
                }
            }
            return this.getFallbackImage();
        }
        
        // Ensure string
        imagePath = String(imagePath);
        
        // Already a full URL
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // Local image from images folder
        if (imagePath.startsWith('/images/') || imagePath.includes('/images/')) {
            // Make sure it's an absolute path
            if (imagePath.startsWith('/')) {
                return window.location.origin + imagePath;
            }
            return imagePath;
        }
        
        // Just a filename, add API path
        if (!imagePath.includes('/')) {
            return `${this.config.apiBaseUrl}/images/${imagePath}`;
        }
        
        // Path already includes some structure but not full URL
        return `${this.config.apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    }
    
    /**
     * Get the appropriate fallback image
     * @returns {string} Fallback image URL
     */
    getFallbackImage() {
        // Use absolute path for local fallback
        return window.location.origin + this.config.localFallbackImage.replace(/^\//, '');
    }
    
    /**
     * Clear the image cache
     */
    clearCache() {
        this.imageCache.clear();
        this.loadErrors.clear();
        console.log('ImageService cache cleared');
    }
}

// Initialize the global service
window.ImageService = new ImageService();

console.log('ImageService loaded and available globally'); 
/**
 * DnD Brand Image Service
 * Centralized image handling with caching and fallbacks
 */

class ImageService {
    constructor() {
        // Base64 encoded 1x1 gray pixel as absolute fallback
        this.BASE64_FALLBACK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAQlBMVEX///+qqqr09PT5+fnv7+/8/Pzr6+u0tLTc3NzR0dG5ubmurq7BwcHGxsbNzc3j4+Pn5+fZ2dnU1NT19fXw8PDg4OCF/xZ5AAADlklEQVR4nO2b2XLrIAyGwQtgvGHH7/+oJ03apGs6sRM4Z+bXRZvLfCBA6DJ1HYIgCIIgCIIgCIIgCIIgCIJ8G2JA3bYQ6Hdv5BPAH5R1MpvMZUwK30bTQB4XaXwhlzydE/guHsI8cQpAOKXGHn6CwJc9hVn8wewmywJwcx1/Y0D9JoLgcv5CVPQFAsdz+QvpYwxo3vOXDMQU3gKAuOCvXRDf4CAf6gsFB5A+4C8dkMfmQK4SejCgJg1YOZ+wDGx1Ae3i5TaEA/8mAZDLDdh4tQNzMUC6zQU0i1x3oF3kwq/47VD87oLcZcA4PuFA/MABcZcBwzqNHZ9MQBR3GTBuU49nHNCPhcgj5/NDDrCfOUb8hY8cA1UwPj73lW8dgQ8P0yLHkYm0k/tjhRj1F1swM5xBvKx3GXA9mPWrA+Jvs4ywunbgCQfESQZIqzWI4wg6bPkS7dK1Vy2gJ+ZJQK9BPDuFjAe3bHxEq3kSMOsM/HkbXodGTW+GYuRPt7ExYHgSUF8cOPV/Xdo/3/53B8ZdPwho9/kHhLTHP9+BuvpJELA0d3+AK67Z+gTCWzXMD/0ykBH3mEJQKbZT2+p+D5Q4S98C0K46OzE49YMDlhqm+ICBIG5zjUEHgLJCG/24LmRYXX/fBGjX3Y+SZ7dLaEDU0ypY+ftvR9h5sYK2sZ2kGdYpbPhqANKuc58Rqb9YqJ2RO2B2lgB5dh+9j5ER1H4RxEYA8Qbnn1Cnwk9h2LHtFATJ8Pf4CybWRd9vWQF4dDgYvZdQ+YkUyzfHsUg+53vkdKN9Xw5Qx9H9qQ5QJzL0XtZNgIHLlmPrVuAXCVDhLyCLu3qdSYCnDgGXQqSc87uXtARQt2xhsHPeApR4/PQp+uXC2QGQDpxVjFVcMvdEKIvEj+CcHPg4qTCEVl/Xzl5/jZt5yvqLHaLkotNsaJXrRmRQRaFSSYLjEsb7MVDPu1mUtpJGNbWdxlDkOJlVcK2t9wW9LCxBJQkBJAkMIZBfGw6RYJCgsCt3ASp3Acp3ATp3Acr3ATqfAOr3ARrfCOr3AWpfB6rfCKp9I2jhU7CJr8Em33ha+CRMJI+CIbCAMdCAkTDzYqQiICZfUEjQpnARCQlpZcRMQ0LCa2WU+CNSTkJDYgpmQzIqc4H/n5iOjpyQkJqQkpySlPFvJSYlJaWlpSb+B6jJiampyelJ/1Z6egRBEARBEAT5Jv4BRv9A0iXGr8MAAAAASUVORK5CYII=';
        
        // Configuration
        this.config = {
            apiBaseUrl: window.CONFIG?.API_URL || 'https://dndbrand-server.onrender.com/api',
            fallbackImage: '../images/placeholder-product.jpg', // Relative path
            localFallbackImage: '../images/placeholder-product.jpg', // Relative path
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
        // Try the first fallback image
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
            console.log('Fallback image loaded successfully');
            // Cache the fallback image so we know it works
            this.imageCache.set(this.config.localFallbackImage, this.config.localFallbackImage);
        };
        
        fallbackImg.onerror = () => {
            console.warn('Fallback image failed to load, using absolute path instead');
            
            // Try a second fallback with an absolute path
            this.config.localFallbackImage = window.location.origin + '/images/placeholder-product.jpg';
            const absoluteFallbackImg = new Image();
            
            absoluteFallbackImg.onload = () => {
                console.log('Absolute fallback image loaded successfully');
                this.imageCache.set(this.config.localFallbackImage, this.config.localFallbackImage);
            };
            
            absoluteFallbackImg.onerror = () => {
                console.warn('Absolute fallback image also failed, using base64 fallback');
                // Just use the base64 fallback as the last resort
                this.config.localFallbackImage = this.BASE64_FALLBACK;
            };
            
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
        
        // Return the base64 data URL as is
        if (imagePath.startsWith('data:')) {
            return imagePath;
        }
        
        // Already a full URL
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // Local image from images folder - make sure it's an absolute path
        if (imagePath.startsWith('/images/') || imagePath.includes('/images/')) {
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
        // If we've determined that the base64 fallback is our only option, use it
        if (this.config.localFallbackImage === this.BASE64_FALLBACK) {
            return this.BASE64_FALLBACK;
        }
        
        // Check if we have a cached fallback image
        if (this.imageCache.has(this.config.localFallbackImage)) {
            return this.config.localFallbackImage;
        }
        
        // Try the original fallback location
        const fallbackImage = this.config.localFallbackImage;
        
        // Make sure it's an absolute path if it's not the base64
        if (fallbackImage.startsWith('/')) {
            return window.location.origin + fallbackImage;
        } else if (!fallbackImage.startsWith('http') && !fallbackImage.startsWith('data:')) {
            // If it's not absolute, base64, or http, resolve it relative to origin
            if (fallbackImage.startsWith('../')) {
                return window.location.origin + '/' + fallbackImage.replace('../', '');
            }
            return window.location.origin + '/' + fallbackImage;
        }
        
        return fallbackImage;
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
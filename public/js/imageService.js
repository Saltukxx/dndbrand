/**
 * DnD Brand Image Service
 * Centralized image handling with caching and fallbacks
 */

class ImageService {
    constructor() {
        // Base64 encoded gray placeholder as absolute fallback
        this.BASE64_FALLBACK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAAAQlBMVEX///+qqqr09PT5+fnv7+/8/Pzr6+u0tLTc3NzR0dG5ubmurq7BwcHGxsbNzc3j4+Pn5+fZ2dnU1NT19fXw8PDg4OCF/xZ5AAADlklEQVR4nO2b2XLrIAyGwQtgvGHH7/+oJ03apGs6sRM4Z+bXRZvLfCBA6DJ1HYIgCIIgCIIgCIIgCIIgCIJ8G2JA3bYQ6Hdv5BPAH5R1MpvMZUwK30bTQB4XaXwhlzydE/guHsI8cQpAOKXGHn6CwJc9hVn8wewmywJwcx1/Y0D9JoLgcv5CVPQFAsdz+QvpYwxo3vOXDMQU3gKAuOCvXRDf4CAf6gsFB5A+4C8dkMfmQK4SejCgJg1YOZ+wDGx1Ae3i5TaEA/8mAZDLDdh4tQNzMUC6zQU0i1x3oF3kwq/47VD87oLcZcA4PuFA/MABcZcBwzqNHZ9MQBR3GTBuU49nHNCPhcgj5/NDDrCfOUb8hY8cA1UwPj73lW8dgQ8P0yLHkYm0k/tjhRj1F1swM5xBvKx3GXA9mPWrA+Jvs4ywunbgCQfESQZIqzWI4wg6bPkS7dK1Vy2gJ+ZJQK9BPDuFjAe3bHxEq3kSMOsM/HkbXodGTW+GYuRPt7ExYHgSUF8cOPV/Xdo/3/53B8ZdPwho9/kHhLTHP9+BuvpJELA0d3+AK67Z+gTCWzXMD/0ykBH3mEJQKbZT2+p+D5Q4S98C0K46OzE49YMDlhqm+ICBIG5zjUEHgLJCG/24LmRYXX/fBGjX3Y+SZ7dLaEDU0ypY+ftvR9h5sYK2sZ2kGdYpbPhqANKuc58Rqb9YqJ2RO2B2lgB5dh+9j5ER1H4RxEYA8Qbnn1Cnwk9h2LHtFATJ8Pf4CybWRd9vWQF4dDgYvZdQ+YkUyzfHsUg+53vkdKN9Xw5Qx9H9qQ5QJzL0XtZNgIHLlmPrVuAXCVDhLyCLu3qdSYCnDgGXQqSc87uXtARQt2xhsHPeApR4/PQp+uXC2QGQDpxVjFVcMvdEKIvEj+CcHPg4qTCEVl/Xzl5/jZt5yvqLHaLkotNsaJXrRmRQRaFSSYLjEsb7MVDPu1mUtpJGNbWdxlDkOJlVcK2t9wW9LCxBJQkBJAkMIZBfGw6RYJCgsCt3ASp3Acp3ATp3Acr3ATqfAOr3ARrfCOr3AWpfB6rfCKp9I2jhU7CJr8Em33ha+CRMJI+CIbCAMdCAkTDzYqQiICZfUEjQpnARCQlpZcRMQ0LCa2WU+CNSTkJDYgpmQzIqc4H/n5iOjpyQkJqQkpySlPFvJSYlJaWlpSb+B6jJiampyelJ/1Z6egRBEARBEAT5Jv4BRv9A0iXGr8MAAAAASUVORK5CYII=';
        
        // Configuration
        this.config = {
            apiBaseUrl: window.CONFIG?.API_URL || 'https://dndbrand-server.onrender.com/api',
            maxRetries: 1,
            retryDelay: 1000
        };
        
        // Cache for successful image loads
        this.imageCache = new Map();
        
        // Load error tracking to avoid repeated failed requests
        this.loadErrors = new Map();
        
        console.log('ImageService initialized with API base:', this.config.apiBaseUrl);
        
        // Fix all images on the page
        this._fixAllImagesOnLoad();
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
            return this.BASE64_FALLBACK;
        }
        
        // Convert to string if it's not already
        let resolvedPath = this._resolveImagePath(imagePath);
        
        // Check cache first if enabled
        if (useCache && this.imageCache.has(resolvedPath)) {
            return this.imageCache.get(resolvedPath);
        }
        
        // Check if we've already had errors with this image
        if (this.loadErrors.has(resolvedPath)) {
            return this.BASE64_FALLBACK;
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
                    element.src = this.BASE64_FALLBACK;
                });
            }
        };
        
        img.src = imageUrl;
    }
    
    /**
     * Find and fix all images on page load
     * @private
     */
    _fixAllImagesOnLoad() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._applyImageFixes());
        } else {
            this._applyImageFixes();
        }
        
        // Also run again after possible AJAX content loads
        setTimeout(() => this._applyImageFixes(), 1000);
        setTimeout(() => this._applyImageFixes(), 3000);
    }
    
    /**
     * Apply fixes to all images on the page
     * @private
     */
    _applyImageFixes() {
        const problematicPatterns = [
            'no-image.jpg',
            'undefined',
            'null',
            '/images/placeholder-product.jpg',
            'default-product.jpg'
        ];
        
        // Find all images on the page
        const allImages = document.querySelectorAll('img');
        allImages.forEach(img => {
            // Skip if already handled
            if (img.hasAttribute('data-fixed-by-service')) {
                return;
            }
            
            // Mark as handled
            img.setAttribute('data-fixed-by-service', 'true');
            
            // Check if src is problematic
            const src = img.getAttribute('src') || '';
            const hasProblematicPattern = problematicPatterns.some(pattern => src.includes(pattern));
            
            if (hasProblematicPattern) {
                // Replace immediately with base64
                img.src = this.BASE64_FALLBACK;
            }
            
            // Add error handler for future errors
            img.onerror = () => {
                // Avoid infinite loops
                if (img.hasAttribute('data-fallback-applied')) {
                    return;
                }
                
                img.setAttribute('data-fallback-applied', 'true');
                img.src = this.BASE64_FALLBACK;
            };
        });
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
                : this.BASE64_FALLBACK;
        }
        
        // Handle object input
        if (typeof imagePath === 'object' && imagePath !== null) {
            // Try various common properties
            for (const prop of ['url', 'src', 'path', 'original', 'thumbnail']) {
                if (imagePath[prop]) {
                    return this._resolveImagePath(imagePath[prop]);
                }
            }
            return this.BASE64_FALLBACK;
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
        
        // If it refers to a problematic pattern, return fallback immediately
        const problematicPatterns = [
            'no-image.jpg',
            'undefined',
            'placeholder-product.jpg',
            'default-product.jpg'
        ];
        
        if (problematicPatterns.some(pattern => imagePath.includes(pattern))) {
            return this.BASE64_FALLBACK;
        }
        
        // Just a filename, add API path
        if (!imagePath.includes('/')) {
            return `${this.config.apiBaseUrl}/images/${imagePath}`;
        }
        
        // Path already includes some structure but not full URL
        return `${this.config.apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    }
    
    /**
     * Get the fallback image (always returns the base64 encoded image)
     * @returns {string} Fallback image URL
     */
    getFallbackImage() {
        return this.BASE64_FALLBACK;
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
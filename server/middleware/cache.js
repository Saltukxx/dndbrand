let NodeCache;
let cache;
const logger = require('../utils/logger');

// Try to load NodeCache, and if it fails, provide a fallback
try {
  NodeCache = require('node-cache');
  // Create a new cache instance
  cache = new NodeCache({ 
    stdTTL: 300, // Default TTL: 5 minutes
    checkperiod: 60, // Check for expired keys every 60 seconds
    maxKeys: 1000 // Maximum number of keys in cache
  });
  logger.info('NodeCache initialized successfully');
} catch (error) {
  logger.warn(`NodeCache could not be loaded: ${error.message}`);
  logger.warn('Using fallback simple cache implementation');
  
  // Implement a simple fallback cache
  cache = {
    data: new Map(),
    timeouts: new Map(),
    get: function(key) {
      return this.data.get(key);
    },
    set: function(key, value, ttl) {
      this.data.set(key, value);
      
      // Clear previous timeout if it exists
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key));
      }
      
      // Set a timeout to automatically delete the key after ttl seconds
      if (ttl) {
        const timeout = setTimeout(() => {
          this.data.delete(key);
          this.timeouts.delete(key);
        }, ttl * 1000);
        
        this.timeouts.set(key, timeout);
      }
    },
    del: function(key) {
      this.data.delete(key);
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key));
        this.timeouts.delete(key);
      }
    },
    flushAll: function() {
      this.data.clear();
      // Clear all timeouts
      for (const timeout of this.timeouts.values()) {
        clearTimeout(timeout);
      }
      this.timeouts.clear();
    },
    keys: function() {
      return Array.from(this.data.keys());
    },
    getStats: function() {
      return {
        hits: 0,
        misses: 0,
        keys: this.data.size,
        ksize: 0,
        vsize: 0
      };
    }
  };
}

/**
 * Create a middleware that caches the response of API endpoints
 * @param {number} duration - Cache duration in seconds
 * @returns {Function} - Express middleware function
 */
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a cache key based on the URL and query parameters
    const key = `${req.originalUrl || req.url}`;
    
    // Check if we have a cached response
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      logger.debug(`Cache hit for ${key}`);
      return res.send(cachedResponse);
    }
    
    logger.debug(`Cache miss for ${key}`);
    
    // Store the original send method
    const originalSend = res.send;
    
    // Override the send method to cache the response
    res.send = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, duration);
        logger.debug(`Cached response for ${key} for ${duration} seconds`);
      }
      
      // Call the original send method
      originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Clear the entire cache
 */
const clearCache = () => {
  cache.flushAll();
  logger.info('Cache cleared');
};

/**
 * Clear a specific cache key
 * @param {string} key - The cache key to clear
 */
const clearCacheKey = (key) => {
  cache.del(key);
  logger.info(`Cache cleared for key: ${key}`);
};

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
const getCacheStats = () => {
  return {
    keys: cache.keys(),
    stats: cache.getStats(),
    info: {
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      keys: cache.keys().length,
      ksize: cache.getStats().ksize,
      vsize: cache.getStats().vsize
    }
  };
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearCacheKey,
  getCacheStats
}; 
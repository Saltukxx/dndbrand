const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Create a new cache instance
const cache = new NodeCache({ 
  stdTTL: 300, // Default TTL: 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  maxKeys: 1000 // Maximum number of keys in cache
});

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
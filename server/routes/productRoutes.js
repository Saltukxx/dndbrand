const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware, clearCacheKey } = require('../middleware/cache');

const router = express.Router();

// Apply cache middleware to GET routes
router.route('/')
  .get(cacheMiddleware(300), getProducts) // Cache for 5 minutes
  .post(protect, authorize('admin'), createProduct);

router.route('/:id')
  .get(cacheMiddleware(600), getProduct) // Cache for 10 minutes
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router; 
const express = require('express');
const { getDashboardStats, getRecentOrders } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.route('/stats').get(getDashboardStats);

// Recent orders
router.route('/orders/recent').get(getRecentOrders);

module.exports = router; 
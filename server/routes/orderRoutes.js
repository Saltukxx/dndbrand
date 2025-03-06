const express = require('express');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getCustomerOrders
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, createOrder)
  .get(protect, authorize('admin'), getOrders);

router.route('/:id')
  .get(protect, getOrder);

router.route('/:id/status')
  .put(protect, authorize('admin'), updateOrderStatus);

router.route('/customer/:customerId')
  .get(protect, getCustomerOrders);

// Add route for recent orders
router.route('/admin/recent')
  .get(protect, authorize('admin'), async (req, res) => {
    try {
      // Get the most recent 5 orders
      const orders = await req.app.locals.db.collection('orders')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

module.exports = router; 
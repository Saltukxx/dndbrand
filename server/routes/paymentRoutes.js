const express = require('express');
const {
  initializePayment,
  initialize3DPayment,
  processPaymentCallback,
  process3DPaymentCallback,
  getPaymentStatus,
  refundPayment
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');
const { validatePaymentInit, validateRefund } = require('../middleware/paymentValidation');

const router = express.Router();

// Initialize payment for an order
router.post('/initialize/:orderId', protect, validatePaymentInit, initializePayment);

// Initialize 3D secure payment for an order
router.post('/initialize-3d/:orderId', protect, validatePaymentInit, initialize3DPayment);

// Process payment callback
router.post('/callback', processPaymentCallback);

// Process 3D secure payment callback
router.post('/callback-3d', process3DPaymentCallback);

// Get payment status for an order
router.get('/status/:orderId', protect, getPaymentStatus);

// Refund a payment (admin only)
router.post('/refund/:orderId', protect, authorize('admin'), validateRefund, refundPayment);

module.exports = router; 
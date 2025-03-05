const iyzipay = require('../config/iyzico');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { validationResult } = require('express-validator');
const {
  generateConversationId,
  formatPrice,
  createBasketItems,
  createBuyerInfo,
  createAddressInfo,
  validateIyzicoCallback
} = require('../utils/paymentUtils');

/**
 * @desc    Initialize payment for an order
 * @route   POST /api/payments/initialize/:orderId
 * @access  Private
 */
exports.initializePayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { cardHolderName, cardNumber, expireMonth, expireYear, cvc, registerCard } = req.body;

    // Find the order
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${orderId}`
      });
    }

    // Check if order belongs to the authenticated customer
    if (order.customer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid'
      });
    }

    // Find the customer
    const customer = await Customer.findById(order.customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate a unique conversation ID
    const conversationId = generateConversationId();

    // Create payment request
    const request = {
      locale: 'tr',
      conversationId: conversationId,
      price: formatPrice(order.total),
      paidPrice: formatPrice(order.total),
      currency: 'TRY',
      installment: '1',
      basketId: order.orderNumber,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      paymentCard: {
        cardHolderName,
        cardNumber,
        expireMonth,
        expireYear,
        cvc,
        registerCard: registerCard ? '1' : '0'
      },
      buyer: createBuyerInfo(customer, order.billingAddress),
      shippingAddress: createAddressInfo(order.shippingAddress, customer, 'shipping'),
      billingAddress: createAddressInfo(order.billingAddress, customer, 'billing'),
      basketItems: createBasketItems(order.items)
    };

    // Make the payment request to Iyzico
    iyzipay.payment.create(request, async function (err, result) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Payment processing error',
          error: err.message
        });
      }

      // Check if payment was successful
      if (result.status === 'success') {
        // Update order with payment information
        order.paymentStatus = 'paid';
        order.orderStatus = 'processing';
        order.paymentDetails = {
          paymentId: result.paymentId,
          conversationId: result.conversationId,
          paymentMethod: 'credit_card',
          paymentProvider: 'iyzico',
          paymentDate: new Date(),
          lastFourDigits: result.lastFourDigits || cardNumber.slice(-4),
          cardType: result.cardType || 'Unknown'
        };

        await order.save();

        return res.status(200).json({
          success: true,
          message: 'Payment successful',
          data: {
            paymentId: result.paymentId,
            orderId: order._id,
            orderNumber: order.orderNumber
          }
        });
      } else {
        // Payment failed
        return res.status(400).json({
          success: false,
          message: 'Payment failed',
          error: result.errorMessage || 'Unknown error'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Initialize 3D secure payment for an order
 * @route   POST /api/payments/initialize-3d/:orderId
 * @access  Private
 */
exports.initialize3DPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { cardHolderName, cardNumber, expireMonth, expireYear, cvc, registerCard } = req.body;

    // Find the order
    const order = await Order.findById(orderId).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${orderId}`
      });
    }

    // Check if order belongs to the authenticated customer
    if (order.customer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid'
      });
    }

    // Find the customer
    const customer = await Customer.findById(order.customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate a unique conversation ID
    const conversationId = generateConversationId();

    // Create payment request for 3D secure
    const request = {
      locale: 'tr',
      conversationId: conversationId,
      price: formatPrice(order.total),
      paidPrice: formatPrice(order.total),
      currency: 'TRY',
      installment: '1',
      basketId: order.orderNumber,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      callbackUrl: `${process.env.SITE_URL || 'http://localhost:5000'}/api/payments/callback-3d`,
      paymentCard: {
        cardHolderName,
        cardNumber,
        expireMonth,
        expireYear,
        cvc,
        registerCard: registerCard ? '1' : '0'
      },
      buyer: createBuyerInfo(customer, order.billingAddress),
      shippingAddress: createAddressInfo(order.shippingAddress, customer, 'shipping'),
      billingAddress: createAddressInfo(order.billingAddress, customer, 'billing'),
      basketItems: createBasketItems(order.items)
    };

    // Store order ID in conversation data for callback
    request.conversationData = order._id.toString();

    // Make the 3D secure payment request to Iyzico
    iyzipay.threedsInitialize.create(request, function (err, result) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Payment processing error',
          error: err.message
        });
      }

      // Check if initialization was successful
      if (result.status === 'success') {
        // Return the HTML content for 3D secure redirect
        return res.status(200).json({
          success: true,
          message: '3D secure payment initialized',
          data: {
            htmlContent: result.threeDSHtmlContent
          }
        });
      } else {
        // Payment initialization failed
        return res.status(400).json({
          success: false,
          message: 'Payment initialization failed',
          error: result.errorMessage || 'Unknown error'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Process 3D secure payment callback
 * @route   POST /api/payments/callback
 * @access  Public
 */
exports.processPaymentCallback = async (req, res) => {
  try {
    const callbackParams = req.body;

    // Validate the callback parameters
    if (!validateIyzicoCallback(callbackParams, process.env.IYZICO_SECRET_KEY)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid callback parameters'
      });
    }

    // Extract order ID from conversation data
    const orderId = callbackParams.conversationData;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check payment status
    if (callbackParams.status === 'success') {
      // Update order with payment information
      order.paymentStatus = 'paid';
      order.orderStatus = 'processing';
      order.paymentDetails = {
        paymentId: callbackParams.paymentId,
        conversationId: callbackParams.conversationId,
        paymentMethod: 'credit_card',
        paymentProvider: 'iyzico',
        paymentDate: new Date()
      };

      await order.save();

      // Redirect to success page
      return res.redirect(`/payment/success?orderId=${order._id}`);
    } else {
      // Payment failed
      return res.redirect(`/payment/failed?orderId=${order._id}&error=${encodeURIComponent(callbackParams.errorMessage || 'Payment failed')}`);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Process 3D secure payment completion
 * @route   POST /api/payments/callback-3d
 * @access  Public
 */
exports.process3DPaymentCallback = async (req, res) => {
  try {
    const { paymentId, conversationData } = req.body;

    // Create request for 3D payment completion
    const request = {
      locale: 'tr',
      conversationId: req.body.conversationId,
      paymentId: paymentId
    };

    // Complete the 3D payment
    iyzipay.threedsComplete.create(request, async function (err, result) {
      if (err) {
        return res.redirect(`/payment/failed?error=${encodeURIComponent('Payment processing error')}`);
      }

      // Find the order using conversation data
      const order = await Order.findById(conversationData);
      if (!order) {
        return res.redirect(`/payment/failed?error=${encodeURIComponent('Order not found')}`);
      }

      // Check if payment was successful
      if (result.status === 'success') {
        // Update order with payment information
        order.paymentStatus = 'paid';
        order.orderStatus = 'processing';
        order.paymentDetails = {
          paymentId: result.paymentId,
          conversationId: result.conversationId,
          paymentMethod: 'credit_card',
          paymentProvider: 'iyzico',
          paymentDate: new Date(),
          lastFourDigits: result.lastFourDigits || '',
          cardType: result.cardType || 'Unknown'
        };

        await order.save();

        // Redirect to success page
        return res.redirect(`/payment/success?orderId=${order._id}`);
      } else {
        // Payment failed
        return res.redirect(`/payment/failed?orderId=${order._id}&error=${encodeURIComponent(result.errorMessage || 'Payment failed')}`);
      }
    });
  } catch (error) {
    return res.redirect(`/payment/failed?error=${encodeURIComponent('Server error')}`);
  }
};

/**
 * @desc    Get payment status for an order
 * @route   GET /api/payments/status/:orderId
 * @access  Private
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${orderId}`
      });
    }

    // Check if order belongs to the authenticated customer
    if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    // Return payment status
    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        paymentDetails: order.paymentDetails || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Refund a payment
 * @route   POST /api/payments/refund/:orderId
 * @access  Private/Admin
 */
exports.refundPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { orderId } = req.params;
    const { refundAmount, refundReason } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${orderId}`
      });
    }

    // Check if order is paid
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has not been paid yet'
      });
    }

    // Check if payment details exist
    if (!order.paymentDetails || !order.paymentDetails.paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment details not found for this order'
      });
    }

    // Create refund request
    const request = {
      locale: 'tr',
      conversationId: generateConversationId(),
      paymentTransactionId: order.paymentDetails.paymentId,
      price: formatPrice(refundAmount || order.total),
      currency: 'TRY',
      ip: req.ip
    };

    // Make the refund request to Iyzico
    iyzipay.refund.create(request, async function (err, result) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Refund processing error',
          error: err.message
        });
      }

      // Check if refund was successful
      if (result.status === 'success') {
        // Update order with refund information
        order.paymentStatus = 'refunded';
        order.orderStatus = 'cancelled';
        order.refundDetails = {
          refundId: result.paymentId,
          refundAmount: refundAmount || order.total,
          refundReason: refundReason || 'Customer request',
          refundDate: new Date()
        };

        await order.save();

        return res.status(200).json({
          success: true,
          message: 'Refund successful',
          data: {
            refundId: result.paymentId,
            orderId: order._id,
            orderNumber: order.orderNumber,
            refundAmount: refundAmount || order.total
          }
        });
      } else {
        // Refund failed
        return res.status(400).json({
          success: false,
          message: 'Refund failed',
          error: result.errorMessage || 'Unknown error'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 
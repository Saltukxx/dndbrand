const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { customer, items, shippingAddress, billingAddress, paymentMethod } = req.body;

    // Check if customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Calculate totals
    let subtotal = 0;
    let tax = 0;
    let shippingCost = 25; // Default shipping cost
    let total = 0;

    // Validate products and calculate subtotal
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with id of ${item.product}`
        });
      }

      // Check if enough inventory
      if (product.inventory < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough inventory for product ${product.name}`
        });
      }

      // Update item with current product info
      item.name = product.name;
      item.price = product.price;
      item.image = product.images.length > 0 ? product.images[0] : '';

      // Calculate item total
      subtotal += item.price * item.quantity;

      // Update product inventory
      product.inventory -= item.quantity;
      await product.save();
    }

    // Calculate tax (18% VAT)
    tax = subtotal * 0.18;

    // Calculate total
    total = subtotal + tax + shippingCost;

    // Create order
    const order = await Order.create({
      customer,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      subtotal,
      tax,
      shippingCost,
      total,
      orderNumber: '', // Will be generated by pre-save hook
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    // Add order to customer's orders
    customerExists.orders.push(order._id);
    await customerExists.save();

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'customer',
        select: 'firstName lastName email phone'
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: 'customer',
      select: 'firstName lastName email phone'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with id of ${req.params.id}`
      });
    }

    // Update order status if provided
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    // Update payment status if provided
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Update tracking number if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get customer orders
// @route   GET /api/orders/customer/:customerId
// @access  Private
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.params.customerId }).sort(
      '-createdAt'
    );

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 
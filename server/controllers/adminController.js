const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total sales
    const orders = await Order.find();
    const totalSales = orders.reduce((acc, order) => acc + order.total, 0);

    // Get total customers
    const totalCustomers = await Customer.countDocuments();

    // Get total products
    const totalProducts = await Product.countDocuments();

    // Get new orders (orders in the last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newOrders = await Order.countDocuments({
      createdAt: { $gte: oneWeekAgo }
    });

    res.status(200).json({
      success: true,
      totalSales,
      totalCustomers,
      totalProducts,
      newOrders
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get recent orders
// @route   GET /api/admin/orders/recent
// @access  Private/Admin
exports.getRecentOrders = async (req, res) => {
  try {
    // Get the 5 most recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name email');

    res.status(200).json({
      success: true,
      count: recentOrders.length,
      data: recentOrders
    });
  } catch (error) {
    console.error('Error getting recent orders:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 
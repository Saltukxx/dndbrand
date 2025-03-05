const Customer = require('../models/Customer');
const jwt = require('jsonwebtoken');

// @desc    Register customer
// @route   POST /api/customers/register
// @access  Public
exports.registerCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if customer already exists
    const customerExists = await Customer.findOne({ email });

    if (customerExists) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists with this email'
      });
    }

    // Create customer
    const customer = await Customer.create({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    // Generate token
    const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      success: true,
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
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

// @desc    Login customer
// @route   POST /api/customers/login
// @access  Public
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for customer
    const customer = await Customer.findOne({ email }).select('+password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await customer.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    customer.lastLogin = Date.now();
    await customer.save();

    // Generate token
    const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(200).json({
      success: true,
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone
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

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().select('-password');

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private/Admin
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = async (req, res) => {
  try {
    // Check if user is authorized to update this customer
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this customer'
      });
    }

    // Get customer
    let customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Handle wishlist actions
    if (req.body.action === 'addToWishlist') {
      // Check if product exists in wishlist
      if (!customer.wishlist.includes(req.body.productId)) {
        customer.wishlist.push(req.body.productId);
      }
    } else if (req.body.action === 'removeFromWishlist') {
      // Remove product from wishlist
      customer.wishlist = customer.wishlist.filter(
        id => id.toString() !== req.body.productId
      );
    } else {
      // Regular update
      const { firstName, lastName, email, phone } = req.body;

      // Update fields
      if (firstName) customer.firstName = firstName;
      if (lastName) customer.lastName = lastName;
      if (email) customer.email = email;
      if (phone) customer.phone = phone;

      // Handle password change
      if (req.body.currentPassword && req.body.newPassword) {
        // Verify current password
        const isMatch = await customer.matchPassword(req.body.currentPassword);

        if (!isMatch) {
          return res.status(401).json({
            success: false,
            error: 'Current password is incorrect'
          });
        }

        // Set new password
        customer.password = req.body.newPassword;
      }
    }

    // Save customer
    await customer.save();

    // Return updated customer
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Add customer address
// @route   POST /api/customers/:id/addresses
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id of ${req.params.id}`
      });
    }

    // Add address to addresses array
    customer.addresses.push(req.body);

    // If this is the first address or isDefault is true, set as default
    if (customer.addresses.length === 1 || req.body.isDefault) {
      // Set all addresses to not default
      customer.addresses.forEach((address, index) => {
        if (index !== customer.addresses.length - 1) {
          address.isDefault = false;
        }
      });
    }

    await customer.save();

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update customer address
// @route   PUT /api/customers/:id/addresses/:addressId
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id of ${req.params.id}`
      });
    }

    // Find the address index
    const addressIndex = customer.addresses.findIndex(
      address => address._id.toString() === req.params.addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update the address
    const updatedAddress = {
      ...customer.addresses[addressIndex].toObject(),
      ...req.body
    };
    
    customer.addresses[addressIndex] = updatedAddress;

    // If this address is being set as default, update other addresses
    if (updatedAddress.isDefault) {
      customer.addresses.forEach((address, index) => {
        if (index !== addressIndex) {
          address.isDefault = false;
        }
      });
    }

    await customer.save();

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete customer address
// @route   DELETE /api/customers/:id/addresses/:addressId
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer not found with id of ${req.params.id}`
      });
    }

    // Find the address index
    const addressIndex = customer.addresses.findIndex(
      address => address._id.toString() === req.params.addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Check if this is the default address
    const isDefault = customer.addresses[addressIndex].isDefault;

    // Remove the address
    customer.addresses.splice(addressIndex, 1);

    // If the deleted address was the default and there are other addresses,
    // set the first one as default
    if (isDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 
/**
 * Database Seed Script for DnD Brand
 * 
 * This script initializes the database with sample data
 * Usage: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load models
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config/.env') });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@dndbrand.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Test User',
    email: 'user@dndbrand.com',
    password: 'user123',
    role: 'user'
  }
];

const customers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+90 555 123 4567',
    addresses: [
      {
        addressType: 'shipping',
        street: '123 Main St',
        city: 'Istanbul',
        state: 'Istanbul',
        postalCode: '34000',
        country: 'Turkey',
        isDefault: true
      },
      {
        addressType: 'billing',
        street: '456 Business Ave',
        city: 'Istanbul',
        state: 'Istanbul',
        postalCode: '34100',
        country: 'Turkey',
        isDefault: false
      }
    ],
    isSubscribed: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password456',
    phone: '+90 555 987 6543',
    addresses: [
      {
        addressType: 'shipping',
        street: '789 Residential Blvd',
        city: 'Ankara',
        state: 'Ankara',
        postalCode: '06000',
        country: 'Turkey',
        isDefault: true
      }
    ],
    isSubscribed: false
  }
];

const products = [
  {
    name: 'Premium Leather Jacket',
    sku: 'DND-LJ-001',
    description: 'Handcrafted premium leather jacket with unique design.',
    price: 4999.99,
    comparePrice: 5999.99,
    images: ['/uploads/product-1.jpg'],
    category: 'clothing',
    tags: ['leather', 'jacket', 'premium'],
    status: 'active',
    inventory: 10,
    variants: [
      {
        name: 'Size',
        options: ['S', 'M', 'L', 'XL']
      },
      {
        name: 'Color',
        options: ['Black', 'Brown']
      }
    ],
    weight: 2.5,
    dimensions: {
      length: 60,
      width: 40,
      height: 10
    },
    featured: true,
    onSale: true
  },
  {
    name: 'Designer T-Shirt',
    sku: 'DND-TS-001',
    description: 'Comfortable cotton t-shirt with unique DnD Brand design.',
    price: 799.99,
    comparePrice: 999.99,
    images: ['/uploads/product-2.jpg'],
    category: 'clothing',
    tags: ['t-shirt', 'cotton', 'casual'],
    status: 'active',
    inventory: 50,
    variants: [
      {
        name: 'Size',
        options: ['S', 'M', 'L', 'XL']
      },
      {
        name: 'Color',
        options: ['White', 'Black', 'Gray']
      }
    ],
    weight: 0.3,
    dimensions: {
      length: 30,
      width: 20,
      height: 2
    },
    featured: false,
    onSale: true
  },
  {
    name: 'Stylish Jeans',
    sku: 'DND-JN-001',
    description: 'High-quality denim jeans with perfect fit.',
    price: 1499.99,
    comparePrice: 0,
    images: ['/uploads/product-3.jpg'],
    category: 'clothing',
    tags: ['jeans', 'denim', 'casual'],
    status: 'active',
    inventory: 30,
    variants: [
      {
        name: 'Size',
        options: ['28', '30', '32', '34', '36']
      },
      {
        name: 'Style',
        options: ['Slim', 'Regular', 'Relaxed']
      }
    ],
    weight: 0.8,
    dimensions: {
      length: 40,
      width: 30,
      height: 5
    },
    featured: false,
    onSale: false
  }
];

// Import data
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Customer.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    
    console.log('Data cleared');
    
    // Create users
    const createdUsers = await User.create(
      users.map(user => ({
        ...user,
        password: bcrypt.hashSync(user.password, 10)
      }))
    );
    
    console.log(`${createdUsers.length} users created`);
    
    // Create customers
    const createdCustomers = await Customer.create(
      customers.map(customer => ({
        ...customer,
        password: bcrypt.hashSync(customer.password, 10)
      }))
    );
    
    console.log(`${createdCustomers.length} customers created`);
    
    // Create products
    const createdProducts = await Product.create(products);
    
    console.log(`${createdProducts.length} products created`);
    
    // Create sample order
    const sampleOrder = {
      customer: createdCustomers[0]._id,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      items: [
        {
          product: createdProducts[0]._id,
          name: createdProducts[0].name,
          price: createdProducts[0].price,
          quantity: 1,
          image: createdProducts[0].images[0]
        },
        {
          product: createdProducts[1]._id,
          name: createdProducts[1].name,
          price: createdProducts[1].price,
          quantity: 2,
          image: createdProducts[1].images[0]
        }
      ],
      shippingAddress: createdCustomers[0].addresses[0],
      billingAddress: createdCustomers[0].addresses[1] || createdCustomers[0].addresses[0],
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      subtotal: createdProducts[0].price + (createdProducts[1].price * 2),
      tax: (createdProducts[0].price + (createdProducts[1].price * 2)) * 0.18,
      shippingCost: 0,
      discount: 0,
      total: (createdProducts[0].price + (createdProducts[1].price * 2)) * 1.18,
      paymentDetails: {
        paymentId: 'sample-payment-id',
        paymentMethod: 'credit_card',
        paymentProvider: 'iyzico',
        paymentDate: new Date(),
        lastFourDigits: '1234',
        cardType: 'Visa'
      }
    };
    
    const createdOrder = await Order.create(sampleOrder);
    
    // Add order to customer
    await Customer.findByIdAndUpdate(
      createdCustomers[0]._id,
      { $push: { orders: createdOrder._id } }
    );
    
    // Add products to wishlist
    await Customer.findByIdAndUpdate(
      createdCustomers[0]._id,
      { $push: { wishlist: { $each: [createdProducts[2]._id] } } }
    );
    
    console.log('Sample order created and added to customer');
    console.log('Sample wishlist item added to customer');
    
    console.log('Data import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    process.exit(1);
  }
};

// Run the import
importData(); 
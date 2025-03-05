const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables
console.log('Loading environment variables...');
dotenv.config({ path: path.join(__dirname, './config/.env') });
console.log('Environment variables loaded.');

// Use a different port
const PORT = 8080;
console.log('Using port:', PORT);

// Initialize Express app
console.log('Initializing Express app...');
const app = express();
console.log('Express app initialized');

// Apply middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the server directory

// API routes
app.get('/', (req, res) => {
  console.log('Request received at root endpoint from:', req.ip);
  res.send('Final server is running!');
});

app.get('/api/products', async (req, res) => {
  console.log('Request received at products endpoint from:', req.ip);
  try {
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add POST route for creating products
app.post('/api/products', async (req, res) => {
  console.log('Request received to create product from:', req.ip);
  try {
    // Add a timestamp to the product
    const productData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the product into the database
    const result = await mongoose.connection.db.collection('products').insertOne(productData);
    
    // Get the inserted product
    const insertedProduct = await mongoose.connection.db.collection('products').findOne({ _id: result.insertedId });
    
    console.log('Product created successfully');
    res.status(201).json({
      success: true,
      data: insertedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

app.get('/api/customers', async (req, res) => {
  console.log('Request received at customers endpoint from:', req.ip);
  try {
    const customers = await mongoose.connection.db.collection('customers').find({}).toArray();
    console.log(`Found ${customers.length} customers`);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  console.log('Request received at users endpoint from:', req.ip);
  try {
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add PUT route for updating products
app.put('/api/products/:id', async (req, res) => {
  console.log(`Request received to update product ${req.params.id} from:`, req.ip);
  try {
    // Convert string ID to MongoDB ObjectId
    const ObjectId = mongoose.Types.ObjectId;
    const productId = new ObjectId(req.params.id);
    
    // Update the product data
    const productData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Update the product in the database
    const result = await mongoose.connection.db.collection('products').findOneAndUpdate(
      { _id: productId },
      { $set: productData },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      console.log(`Product ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`
      });
    }
    
    console.log('Product updated successfully');
    res.status(200).json({
      success: true,
      data: result.value
    });
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Add DELETE route for deleting products
app.delete('/api/products/:id', async (req, res) => {
  console.log(`Request received to delete product ${req.params.id} from:`, req.ip);
  try {
    // Convert string ID to MongoDB ObjectId
    const ObjectId = mongoose.Types.ObjectId;
    const productId = new ObjectId(req.params.id);
    
    // Delete the product from the database
    const result = await mongoose.connection.db.collection('products').findOneAndDelete({ _id: productId });
    
    if (!result.value) {
      console.log(`Product ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        message: `Product not found with id of ${req.params.id}`
      });
    }
    
    console.log('Product deleted successfully');
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// API endpoint for orders
app.post('/api/orders', async (req, res) => {
  try {
    console.log('Creating new order:', req.body);
    
    // Create order schema
    const orderSchema = new mongoose.Schema({
      items: Array,
      subtotal: Number,
      tax: Number,
      shipping: Number,
      total: Number,
      paymentMethod: String,
      shippingAddress: Object,
      orderDate: Date,
      status: String,
      orderNumber: String
    }, { collection: 'orders' });
    
    // Create order model
    const Order = mongoose.model('Order', orderSchema);
    
    // Create new order
    const newOrder = new Order(req.body);
    
    // Save order to database
    const savedOrder = await newOrder.save();
    
    console.log('Order created successfully:', savedOrder);
    
    // Return saved order
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// API endpoint to get orders
app.get('/api/orders', async (req, res) => {
  try {
    console.log('Getting orders');
    
    // Create order schema
    const orderSchema = new mongoose.Schema({}, { collection: 'orders', strict: false });
    
    // Create order model
    const Order = mongoose.model('Order', orderSchema);
    
    // Get orders from database
    const orders = await Order.find().sort({ orderDate: -1 });
    
    console.log(`Found ${orders.length} orders`);
    
    // Return orders
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Error getting orders', error: error.message });
  }
});

// API endpoint for addresses
app.post('/api/addresses', async (req, res) => {
  try {
    console.log('Creating new address:', req.body);
    
    // Create address schema
    const addressSchema = new mongoose.Schema({
      id: String,
      title: String,
      fullName: String,
      phone: String,
      address: String,
      city: String,
      district: String,
      postalCode: String,
      country: String,
      isDefault: Boolean
    }, { collection: 'addresses' });
    
    // Create address model
    const Address = mongoose.model('Address', addressSchema);
    
    // Create new address
    const newAddress = new Address(req.body);
    
    // Save address to database
    const savedAddress = await newAddress.save();
    
    console.log('Address created successfully:', savedAddress);
    
    // Return saved address
    res.status(201).json(savedAddress);
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ message: 'Error creating address', error: error.message });
  }
});

// API endpoint to get addresses
app.get('/api/addresses', async (req, res) => {
  try {
    console.log('Getting addresses');
    
    // Create address schema
    const addressSchema = new mongoose.Schema({}, { collection: 'addresses', strict: false });
    
    // Create address model
    const Address = mongoose.model('Address', addressSchema);
    
    // Get addresses from database
    const addresses = await Address.find();
    
    console.log(`Found ${addresses.length} addresses`);
    
    // Return addresses
    res.status(200).json(addresses);
  } catch (error) {
    console.error('Error getting addresses:', error);
    res.status(500).json({ message: 'Error getting addresses', error: error.message });
  }
});

// API endpoint to delete an address
app.delete('/api/addresses/:id', async (req, res) => {
  try {
    console.log('Deleting address with ID:', req.params.id);
    
    // Create address schema
    const addressSchema = new mongoose.Schema({}, { collection: 'addresses', strict: false });
    
    // Create address model
    const Address = mongoose.model('Address', addressSchema);
    
    // Delete address from database
    const result = await Address.deleteOne({ id: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }
    
    console.log('Address deleted successfully');
    
    // Return success
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ message: 'Error deleting address', error: error.message });
  }
});

// HTML test page route
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'direct-test.html'));
});

// Connect to MongoDB and start server
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'URI exists (not shown for security)' : 'URI is missing');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
    
    // Start server after successful database connection
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server bound to all interfaces (0.0.0.0)`);
      console.log(`Access the API at http://localhost:${PORT}/`);
      console.log(`Access the test page at http://localhost:${PORT}/test`);
      
      // Log all available IP addresses
      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      console.log('\nAvailable on these addresses:');
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            console.log(`  http://${net.address}:${PORT}/`);
          }
        }
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
  }); 
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'admin@dndbrand.com' });

    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@dndbrand.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

module.exports = seedAdmin; 
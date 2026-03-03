const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin
    await User.deleteOne({ email: 'admin@test.com' });
    console.log('Deleted existing admin user');

    // Create new admin
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ New admin user created!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

resetAdmin();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear existing users
    await User.deleteMany({});
    
    // Test users with different roles
    const testUsers = [
      {
        name: 'Student Test User',
        email: 'student@test.com',
        password: await bcrypt.hash('password123', 12),
        role: 'student'
      },
      {
        name: 'Library Test User', 
        email: 'library@test.com',
        password: await bcrypt.hash('password123', 12),
        role: 'library'
      },
      {
        name: 'Admin Test User',
        email: 'admin@test.com', 
        password: await bcrypt.hash('password123', 12),
        role: 'admin'
      }
    ];
    
    await User.insertMany(testUsers);
    
    console.log('✅ Test users created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Student: student@test.com / password123');
    console.log('Library: library@test.com / password123'); 
    console.log('Admin: admin@test.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
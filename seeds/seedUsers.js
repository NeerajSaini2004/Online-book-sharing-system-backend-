const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (optional)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    const users = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Test Student',
        email: 'student@test.com',
        password: 'student123',
        role: 'student'
      },
      {
        name: 'Test Library',
        email: 'library@test.com',
        password: 'library123',
        role: 'library'
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`⚠️  User already exists: ${userData.email}`);
      }
    }

    console.log('\n🎉 User seeding completed!');
    console.log('\nTest Accounts:');
    console.log('Admin: admin@test.com / admin123');
    console.log('Student: student@test.com / student123');
    console.log('Library: library@test.com / library123');
    
  } catch (error) {
    console.error('Error seeding users:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

seedUsers();
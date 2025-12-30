import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User';
import connectDB from './config/database';

dotenv.config();

const fixGeorgePassword = async () => {
  try {
    await connectDB();

    console.log('\n🔧 Fixing George\'s password...\n');

    const user = await User.findOne({ email: 'george.mathew@email.com' }).select('+password');

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('✅ User found:', user.email);

    // Set the password - the pre-save hook will hash it
    user.password = 'password123';
    await user.save();

    console.log('✅ Password updated successfully!');

    // Verify the password works
    const updatedUser = await User.findOne({ email: 'george.mathew@email.com' }).select('+password');
    if (updatedUser) {
      const isMatch = await updatedUser.comparePassword('password123');
      console.log(`✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    }

    console.log('\n📋 Login Credentials:');
    console.log('   Email: george.mathew@email.com');
    console.log('   Password: password123');
    console.log('   Login URL: http://localhost:3000/member');
    console.log('\n✅ George can now log in!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixGeorgePassword();

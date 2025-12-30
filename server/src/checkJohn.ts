import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User';
import Member from './models/Member';
import connectDB from './config/database';

dotenv.config();

const checkJohn = async () => {
  try {
    await connectDB();

    console.log('\n🔍 Checking for john.thomas@email.com...\n');

    const user = await User.findOne({ email: 'john.thomas@email.com' });
    const member = await Member.findOne({ email: 'john.thomas@email.com' });

    if (!user && !member) {
      console.log('❌ john.thomas@email.com does NOT exist');
      console.log('\n✅ Available accounts:');
      console.log('   Email: george.mathew@email.com');
      console.log('   Password: password123');
    } else {
      console.log('✅ Found account for john.thomas@email.com');
      if (user) console.log('   User ID:', user._id);
      if (member) console.log('   Member ID:', member._id);
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkJohn();

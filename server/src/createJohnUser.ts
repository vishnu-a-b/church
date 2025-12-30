import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User';
import Member from './models/Member';
import Church from './models/Church';
import Unit from './models/Unit';
import Bavanakutayima from './models/Bavanakutayima';
import House from './models/House';
import connectDB from './config/database';

dotenv.config();

const createJohnUser = async () => {
  try {
    await connectDB();

    console.log('\n🔧 Creating User account for John Thomas...\n');

    // Get John's member record
    const member = await Member.findOne({ email: 'john.thomas@email.com' });

    if (!member) {
      console.log('❌ Member not found');
      process.exit(1);
    }

    console.log('✅ Found member:', member.firstName, member.lastName);

    // Check if User already exists
    let user = await User.findOne({ email: 'john.thomas@email.com' });

    if (user) {
      console.log('✅ User account already exists, updating password...');
      user.password = 'password123';
      user.churchId = member.churchId;
      user.unitId = member.unitId;
      user.bavanakutayimaId = member.bavanakutayimaId;
      user.memberId = member._id;
      user.isActive = true;
      await user.save();
    } else {
      console.log('Creating new User account...');
      user = await User.create({
        username: 'john.thomas',
        email: 'john.thomas@email.com',
        password: 'password123',
        role: 'member',
        churchId: member.churchId,
        unitId: member.unitId,
        bavanakutayimaId: member.bavanakutayimaId,
        memberId: member._id,
        isActive: true,
      });
    }

    console.log('✅ User account created/updated successfully!');

    // Verify password
    const verifyUser = await User.findOne({ email: 'john.thomas@email.com' }).select('+password');
    if (verifyUser) {
      const isMatch = await verifyUser.comparePassword('password123');
      console.log(`✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    }

    console.log('\n📋 Login Credentials:');
    console.log('   Email: john.thomas@email.com');
    console.log('   Password: password123');
    console.log('   Login URL: http://localhost:3000/member-login');
    console.log('\n✅ John can now log in!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createJohnUser();

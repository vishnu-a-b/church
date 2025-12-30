import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Member from './models/Member';
import House from './models/House';
import Bavanakutayima from './models/Bavanakutayima';
import Unit from './models/Unit';
import connectDB from './config/database';

dotenv.config();

const createTestMember = async () => {
  try {
    await connectDB();

    console.log('\n🔧 Creating test member with login credentials...\n');

    // Get an existing house to assign the member to
    const house = await House.findOne();

    if (!house) {
      console.log('❌ No houses found. Please run the seed script first.');
      process.exit(1);
    }

    console.log('✅ Found house:', house.uniqueId);

    // Get the hierarchy IDs
    const bavanakutayima = await Bavanakutayima.findById(house.bavanakutayimaId);
    if (!bavanakutayima) {
      console.log('❌ Bavanakutayima not found.');
      process.exit(1);
    }

    const unit = await Unit.findById(bavanakutayima.unitId);
    if (!unit) {
      console.log('❌ Unit not found.');
      process.exit(1);
    }

    // Check if member already exists
    let member = await Member.findOne({ username: 'testmember' });

    if (member) {
      console.log('✅ Test member already exists, updating password...');
      member.password = 'member123';
      member.isActive = true;
      await member.save();
    } else {
      // Get the next member number for this house
      const lastMember = await Member.findOne({ houseId: house._id }).sort({ memberNumber: -1 });
      const memberNumber = lastMember ? lastMember.memberNumber + 1 : 1;

      // Generate uniqueId
      const uniqueId = `${house.uniqueId}-M${String(memberNumber).padStart(3, '0')}`;

      console.log('Creating new test member...');
      member = await Member.create({
        churchId: unit.churchId,
        unitId: bavanakutayima.unitId,
        bavanakutayimaId: house.bavanakutayimaId,
        houseId: house._id,
        memberNumber,
        uniqueId,
        firstName: 'Test',
        lastName: 'Member',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        phone: '9999999999',
        email: 'test.member@email.com',
        baptismName: 'Test Baptism',
        relationToHead: 'other',
        username: 'testmember',
        password: 'member123',
        role: 'member',
        isActive: true,
        smsPreferences: {
          enabled: true,
          paymentNotifications: true,
          receiptNotifications: true,
        },
      });
    }

    console.log('✅ Test member created/updated successfully!');

    // Verify password
    const verifyMember = await Member.findOne({ username: 'testmember' }).select('+password');
    if (verifyMember) {
      const isMatch = await verifyMember.comparePassword('member123');
      console.log(`✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    }

    console.log('\n📋 Member Login Credentials:');
    console.log('   Username: testmember');
    console.log('   Password: member123');
    console.log('   Login URL: http://localhost:3000/member-login');
    console.log('\n✅ Test member can now log in!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createTestMember();

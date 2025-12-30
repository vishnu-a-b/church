import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Church from './models/Church';
import Unit from './models/Unit';
import Bavanakutayima from './models/Bavanakutayima';
import House from './models/House';
import Member from './models/Member';
import Transaction from './models/Transaction';
import SpiritualActivity from './models/SpiritualActivity';
import Campaign from './models/Campaign';
import connectDB from './config/database';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    // Clear existing data
    await Church.deleteMany({});
    await Unit.deleteMany({});
    await Bavanakutayima.deleteMany({});
    await House.deleteMany({});
    await Member.deleteMany({});
    await Campaign.deleteMany({});
    await Transaction.deleteMany({});
    await SpiritualActivity.deleteMany({});

    console.log('✅ Database cleared successfully!');
    console.log('\n🏛️  Creating Churches...');

    // Create Churches
    const church1 = await Church.create({
      churchNumber: 1,
      uniqueId: 'CH001',
      name: 'St. Mary\'s Cathedral',
      location: 'Kochi, Kerala',
      diocese: 'Ernakulam-Angamaly Archdiocese',
      established: new Date('1990-01-15'),
      contactPerson: 'Fr. Thomas Joseph',
      phone: '9876543210',
      email: 'stmarys@cathedral.org',
      settings: {
        smsEnabled: true,
        smsProvider: 'fast2sms',
        smsSenderId: 'STMARY',
        currency: 'INR',
      },
    });

    const church2 = await Church.create({
      churchNumber: 2,
      uniqueId: 'CH002',
      name: 'Sacred Heart Church',
      location: 'Thrissur, Kerala',
      diocese: 'Thrissur Diocese',
      established: new Date('1985-03-20'),
      contactPerson: 'Fr. John Paul',
      phone: '9876543211',
      email: 'sacredheart@church.org',
      settings: {
        smsEnabled: true,
        smsProvider: 'fast2sms',
        smsSenderId: 'SACRED',
        currency: 'INR',
      },
    });

    console.log(`✅ Created ${2} churches`);
    console.log('\n🏘️  Creating Units...');

    // Create Units for Church 1
    const unit1 = await Unit.create({
      churchId: church1._id,
      unitNumber: 1,
      uniqueId: 'CH001-U001',
      name: 'North Zone',
      unitCode: 'NZ01',
    });

    const unit2 = await Unit.create({
      churchId: church1._id,
      unitNumber: 2,
      uniqueId: 'CH001-U002',
      name: 'South Zone',
      unitCode: 'SZ01',
    });

    // Create Units for Church 2
    const unit3 = await Unit.create({
      churchId: church2._id,
      unitNumber: 1,
      uniqueId: 'CH002-U001',
      name: 'East Zone',
      unitCode: 'EZ01',
    });

    console.log(`✅ Created ${3} units`);
    console.log('\n🏘️  Creating Bavanakutayimas...');

    // Create Bavanakutayimas for Unit 1
    const bk1 = await Bavanakutayima.create({
      unitId: unit1._id,
      bavanakutayimaNumber: 1,
      uniqueId: 'CH001-U001-BK001',
      name: 'Kadavanthra Bavanakutayima',
      leaderName: 'Jose Thomas',
    });

    const bk2 = await Bavanakutayima.create({
      unitId: unit1._id,
      bavanakutayimaNumber: 2,
      uniqueId: 'CH001-U001-BK002',
      name: 'Panampilly Bavanakutayima',
      leaderName: 'Mary Joseph',
    });

    // Create Bavanakutayimas for Unit 2
    const bk3 = await Bavanakutayima.create({
      unitId: unit2._id,
      bavanakutayimaNumber: 1,
      uniqueId: 'CH001-U002-BK001',
      name: 'Palarivattom Bavanakutayima',
      leaderName: 'Abraham John',
    });

    // Create Bavanakutayima for Unit 3
    const bk4 = await Bavanakutayima.create({
      unitId: unit3._id,
      bavanakutayimaNumber: 1,
      uniqueId: 'CH002-U001-BK001',
      name: 'Ollur Bavanakutayima',
      leaderName: 'George Paul',
    });

    console.log(`✅ Created ${4} bavanakutayimas`);
    console.log('\n🏠 Creating Houses...');

    // Create Houses for BK1
    const house1 = await House.create({
      bavanakutayimaId: bk1._id,
      houseNumber: 1,
      uniqueId: 'CH001-U001-BK001-H001',
      familyName: 'Thomas Family',
      headOfFamily: 'John Thomas',
      address: 'TC 12/345, Kadavanthra, Kochi',
      phone: '9876501234',
      houseCode: 'TF001',
    });

    const house2 = await House.create({
      bavanakutayimaId: bk1._id,
      houseNumber: 2,
      uniqueId: 'CH001-U001-BK001-H002',
      familyName: 'Sebastian Family',
      headOfFamily: 'Paul Sebastian',
      address: 'TC 13/456, Kadavanthra, Kochi',
      phone: '9876501235',
      houseCode: 'SF001',
    });

    // Create Houses for BK2
    const house3 = await House.create({
      bavanakutayimaId: bk2._id,
      houseNumber: 1,
      uniqueId: 'CH001-U001-BK002-H001',
      familyName: 'Joseph Family',
      headOfFamily: 'George Joseph',
      address: 'PB 45/789, Panampilly Nagar, Kochi',
      phone: '9876501236',
      houseCode: 'JF001',
    });

    // Create Houses for BK3
    const house4 = await House.create({
      bavanakutayimaId: bk3._id,
      houseNumber: 1,
      uniqueId: 'CH001-U002-BK001-H001',
      familyName: 'Abraham Family',
      headOfFamily: 'Thomas Abraham',
      address: 'PL 67/123, Palarivattom, Kochi',
      phone: '9876501237',
      houseCode: 'AF001',
    });

    // Create Houses for BK4
    const house5 = await House.create({
      bavanakutayimaId: bk4._id,
      houseNumber: 1,
      uniqueId: 'CH002-U001-BK001-H001',
      familyName: 'Paul Family',
      headOfFamily: 'Jacob Paul',
      address: 'OL 89/456, Ollur, Thrissur',
      phone: '9876501238',
      houseCode: 'PF001',
    });

    console.log(`✅ Created ${5} houses`);
    console.log('\n👥 Creating Members with Login Credentials...');

    // Create Super Admin Member
    const superAdmin = await Member.create({
      churchId: church1._id,
      unitId: unit1._id,
      bavanakutayimaId: bk1._id,
      houseId: house1._id,
      memberNumber: 1,
      uniqueId: 'CH001-U001-BK001-H001-M001',
      firstName: 'John',
      lastName: 'Thomas',
      dateOfBirth: new Date('1980-05-15'),
      gender: 'male',
      phone: '9876501234',
      email: 'john.thomas@email.com',
      baptismName: 'John Baptist',
      relationToHead: 'head',
      username: 'superadmin',
      password: 'admin123',
      role: 'super_admin',
      isActive: true,
      smsPreferences: {
        enabled: true,
        paymentNotifications: true,
        receiptNotifications: true,
      },
    });

    // Create Church Admin Member
    const churchAdmin = await Member.create({
      churchId: church1._id,
      unitId: unit1._id,
      bavanakutayimaId: bk1._id,
      houseId: house1._id,
      memberNumber: 2,
      uniqueId: 'CH001-U001-BK001-H001-M002',
      firstName: 'Mary',
      lastName: 'Thomas',
      dateOfBirth: new Date('1982-08-20'),
      gender: 'female',
      phone: '9876501239',
      email: 'mary.thomas@email.com',
      baptismName: 'Mary Magdalene',
      relationToHead: 'spouse',
      username: 'churchadmin',
      password: 'church123',
      role: 'church_admin',
      isActive: true,
      smsPreferences: {
        enabled: true,
        paymentNotifications: true,
        receiptNotifications: true,
      },
    });

    // Create Unit Admin Member
    const unitAdmin = await Member.create({
      churchId: church1._id,
      unitId: unit2._id,
      bavanakutayimaId: bk3._id,
      houseId: house4._id,
      memberNumber: 1,
      uniqueId: 'CH001-U002-BK001-H001-M001',
      firstName: 'Thomas',
      lastName: 'Abraham',
      dateOfBirth: new Date('1975-03-10'),
      gender: 'male',
      phone: '9876501237',
      email: 'thomas.abraham@email.com',
      baptismName: 'Thomas Aquinas',
      relationToHead: 'head',
      username: 'unitadmin',
      password: 'unit123',
      role: 'unit_admin',
      isActive: true,
      smsPreferences: {
        enabled: true,
        paymentNotifications: true,
        receiptNotifications: true,
      },
    });

    // Create Regular Members without login credentials
    const member1 = await Member.create({
      churchId: church1._id,
      unitId: unit1._id,
      bavanakutayimaId: bk1._id,
      houseId: house2._id,
      memberNumber: 1,
      uniqueId: 'CH001-U001-BK001-H002-M001',
      firstName: 'Paul',
      lastName: 'Sebastian',
      dateOfBirth: new Date('1985-12-25'),
      gender: 'male',
      phone: '9876501235',
      email: 'paul.sebastian@email.com',
      baptismName: 'Paul Francis',
      relationToHead: 'head',
      role: 'member',
      isActive: true,
      smsPreferences: {
        enabled: true,
        paymentNotifications: true,
        receiptNotifications: true,
      },
    });

    const member2 = await Member.create({
      churchId: church1._id,
      unitId: unit1._id,
      bavanakutayimaId: bk1._id,
      houseId: house2._id,
      memberNumber: 2,
      uniqueId: 'CH001-U001-BK001-H002-M002',
      firstName: 'Anna',
      lastName: 'Sebastian',
      dateOfBirth: new Date('1988-07-10'),
      gender: 'female',
      phone: '9876501240',
      email: 'anna.sebastian@email.com',
      baptismName: 'Anna Maria',
      relationToHead: 'spouse',
      role: 'member',
      isActive: true,
      smsPreferences: {
        enabled: true,
        paymentNotifications: true,
        receiptNotifications: true,
      },
    });

    const member3 = await Member.create({
      churchId: church1._id,
      unitId: unit1._id,
      bavanakutayimaId: bk2._id,
      houseId: house3._id,
      memberNumber: 1,
      uniqueId: 'CH001-U001-BK002-H001-M001',
      firstName: 'George',
      lastName: 'Joseph',
      dateOfBirth: new Date('1970-04-18'),
      gender: 'male',
      phone: '9876501236',
      email: 'george.joseph@email.com',
      baptismName: 'George Michael',
      relationToHead: 'head',
      role: 'member',
      isActive: true,
      smsPreferences: {
        enabled: true,
        paymentNotifications: true,
        receiptNotifications: true,
      },
    });

    const member4 = await Member.create({
      churchId: church2._id,
      unitId: unit3._id,
      bavanakutayimaId: bk4._id,
      houseId: house5._id,
      memberNumber: 1,
      uniqueId: 'CH002-U001-BK001-H001-M001',
      firstName: 'Jacob',
      lastName: 'Paul',
      dateOfBirth: new Date('1978-11-05'),
      gender: 'male',
      phone: '9876501238',
      email: 'jacob.paul@email.com',
      baptismName: 'Jacob Peter',
      relationToHead: 'head',
      role: 'member',
      isActive: true,
      smsPreferences: {
        enabled: true,
        paymentNotifications: true,
        receiptNotifications: true,
      },
    });

    // Add more members across different Bavanakutayimas
    const member5 = await Member.create({
      churchId: church1._id,
      unitId: unit1._id,
      bavanakutayimaId: bk2._id,
      houseId: house3._id,
      memberNumber: 2,
      uniqueId: 'CH001-U001-BK002-H001-M002',
      firstName: 'Sarah',
      lastName: 'Joseph',
      dateOfBirth: new Date('1987-06-12'),
      gender: 'female',
      phone: '9876501241',
      email: 'sarah.joseph@email.com',
      baptismName: 'Sarah Grace',
      relationToHead: 'spouse',
      role: 'member',
      isActive: true,
      smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
    });

    const member6 = await Member.create({
      churchId: church1._id,
      unitId: unit1._id,
      bavanakutayimaId: bk2._id,
      houseId: house3._id,
      memberNumber: 3,
      uniqueId: 'CH001-U001-BK002-H001-M003',
      firstName: 'David',
      lastName: 'Joseph',
      dateOfBirth: new Date('2010-03-15'),
      gender: 'male',
      phone: '9876501242',
      baptismName: 'David Luke',
      relationToHead: 'child',
      role: 'member',
      isActive: true,
      smsPreferences: { enabled: true, paymentNotifications: false, receiptNotifications: false },
    });

    const member7 = await Member.create({
      churchId: church1._id,
      unitId: unit2._id,
      bavanakutayimaId: bk3._id,
      houseId: house4._id,
      memberNumber: 2,
      uniqueId: 'CH001-U002-BK001-H001-M002',
      firstName: 'Rachel',
      lastName: 'Abraham',
      dateOfBirth: new Date('1978-09-22'),
      gender: 'female',
      phone: '9876501243',
      email: 'rachel.abraham@email.com',
      baptismName: 'Rachel Maria',
      relationToHead: 'spouse',
      role: 'member',
      isActive: true,
      smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
    });

    const member8 = await Member.create({
      churchId: church1._id,
      unitId: unit2._id,
      bavanakutayimaId: bk3._id,
      houseId: house4._id,
      memberNumber: 3,
      uniqueId: 'CH001-U002-BK001-H001-M003',
      firstName: 'Joshua',
      lastName: 'Abraham',
      dateOfBirth: new Date('2005-11-08'),
      gender: 'male',
      phone: '9876501244',
      baptismName: 'Joshua Matthew',
      relationToHead: 'child',
      role: 'member',
      isActive: true,
      smsPreferences: { enabled: false, paymentNotifications: false, receiptNotifications: false },
    });

    const member9 = await Member.create({
      churchId: church2._id,
      unitId: unit3._id,
      bavanakutayimaId: bk4._id,
      houseId: house5._id,
      memberNumber: 2,
      uniqueId: 'CH002-U001-BK001-H001-M002',
      firstName: 'Rebecca',
      lastName: 'Paul',
      dateOfBirth: new Date('1980-04-17'),
      gender: 'female',
      phone: '9876501245',
      email: 'rebecca.paul@email.com',
      baptismName: 'Rebecca Anne',
      relationToHead: 'spouse',
      role: 'member',
      isActive: true,
      smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
    });

    const member10 = await Member.create({
      churchId: church2._id,
      unitId: unit3._id,
      bavanakutayimaId: bk4._id,
      houseId: house5._id,
      memberNumber: 3,
      uniqueId: 'CH002-U001-BK001-H001-M003',
      firstName: 'Daniel',
      lastName: 'Paul',
      dateOfBirth: new Date('2008-07-25'),
      gender: 'male',
      phone: '9876501246',
      baptismName: 'Daniel Joseph',
      relationToHead: 'child',
      role: 'member',
      isActive: true,
      smsPreferences: { enabled: false, paymentNotifications: false, receiptNotifications: false },
    });

    // Add Kutayima Admin
    const kutayimaAdmin = await Member.create({
      churchId: church1._id,
      unitId: unit1._id,
      bavanakutayimaId: bk2._id,
      houseId: house3._id,
      memberNumber: 4,
      uniqueId: 'CH001-U001-BK002-H001-M004',
      firstName: 'Jose',
      lastName: 'Joseph',
      dateOfBirth: new Date('1972-02-14'),
      gender: 'male',
      phone: '9876501247',
      email: 'jose.joseph@email.com',
      baptismName: 'Jose Thomas',
      relationToHead: 'other',
      username: 'kutayimaadmin',
      password: 'kutayima123',
      role: 'kudumbakutayima_admin',
      isActive: true,
      smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
    });

    console.log(`✅ Created ${14} members (4 with login, 10 regular)`);
    console.log('\n💰 Creating Transactions...');

    // Create Transactions
    const transaction1 = await Transaction.create({
      receiptNumber: 'RCP001',
      transactionType: 'lelam',
      totalAmount: 5000,
      memberAmount: 5000,
      houseAmount: 0,
      memberId: member1._id,
      houseId: house2._id,
      unitId: unit1._id,
      churchId: church1._id,
      paymentDate: new Date('2024-01-15'),
      paymentMethod: 'cash',
      notes: 'Monthly lelam contribution',
      smsNotificationSent: false,
      createdBy: churchAdmin._id,
    });

    const transaction2 = await Transaction.create({
      receiptNumber: 'RCP002',
      transactionType: 'dashamansham',
      totalAmount: 2000,
      memberAmount: 2000,
      houseAmount: 0,
      memberId: member3._id,
      houseId: house3._id,
      unitId: unit1._id,
      churchId: church1._id,
      paymentDate: new Date('2024-01-20'),
      paymentMethod: 'upi',
      notes: 'Dashamansham payment',
      smsNotificationSent: false,
      createdBy: churchAdmin._id,
    });

    const transaction3 = await Transaction.create({
      receiptNumber: 'RCP003',
      transactionType: 'spl_contribution',
      totalAmount: 10000,
      memberAmount: 0,
      houseAmount: 10000,
      houseId: house4._id,
      unitId: unit2._id,
      churchId: church1._id,
      paymentDate: new Date('2024-02-01'),
      paymentMethod: 'bank_transfer',
      notes: 'Special contribution for church renovation',
      smsNotificationSent: false,
      createdBy: churchAdmin._id,
    });

    // Add more transactions from different units and bavanakutayimas
    const transaction4 = await Transaction.create({
      receiptNumber: 'RCP004',
      transactionType: 'thirunnaal_panam',
      totalAmount: 1500,
      memberAmount: 1500,
      houseAmount: 0,
      memberId: member5._id,
      houseId: house3._id,
      unitId: unit1._id,
      churchId: church1._id,
      paymentDate: new Date('2024-02-10'),
      paymentMethod: 'upi',
      notes: 'Thirunnaal panam for Easter',
      smsNotificationSent: false,
      createdBy: churchAdmin._id,
    });

    const transaction5 = await Transaction.create({
      receiptNumber: 'RCP005',
      transactionType: 'lelam',
      totalAmount: 3000,
      memberAmount: 3000,
      houseAmount: 0,
      memberId: member7._id,
      houseId: house4._id,
      unitId: unit2._id,
      churchId: church1._id,
      paymentDate: new Date('2024-02-15'),
      paymentMethod: 'cash',
      notes: 'Monthly lelam - February',
      smsNotificationSent: false,
      createdBy: unitAdmin._id,
    });

    const transaction6 = await Transaction.create({
      receiptNumber: 'RCP006',
      transactionType: 'dashamansham',
      totalAmount: 2500,
      memberAmount: 2500,
      houseAmount: 0,
      memberId: member9._id,
      houseId: house5._id,
      unitId: unit3._id,
      churchId: church2._id,
      paymentDate: new Date('2024-02-20'),
      paymentMethod: 'bank_transfer',
      notes: 'Tithe contribution',
      smsNotificationSent: false,
      createdBy: superAdmin._id,
    });

    const transaction7 = await Transaction.create({
      receiptNumber: 'RCP007',
      transactionType: 'spl_contribution',
      totalAmount: 5000,
      memberAmount: 0,
      houseAmount: 5000,
      houseId: house2._id,
      unitId: unit1._id,
      churchId: church1._id,
      paymentDate: new Date('2024-03-01'),
      paymentMethod: 'upi',
      notes: 'Special offering for new altar',
      smsNotificationSent: false,
      createdBy: churchAdmin._id,
    });

    const transaction8 = await Transaction.create({
      receiptNumber: 'RCP008',
      transactionType: 'lelam',
      totalAmount: 4500,
      memberAmount: 4500,
      houseAmount: 0,
      memberId: kutayimaAdmin._id,
      houseId: house3._id,
      unitId: unit1._id,
      churchId: church1._id,
      paymentDate: new Date('2024-03-05'),
      paymentMethod: 'cash',
      notes: 'March lelam contribution',
      smsNotificationSent: false,
      createdBy: churchAdmin._id,
    });

    const transaction9 = await Transaction.create({
      receiptNumber: 'RCP009',
      transactionType: 'thirunnaal_panam',
      totalAmount: 2000,
      memberAmount: 2000,
      houseAmount: 0,
      memberId: member3._id,
      houseId: house3._id,
      unitId: unit1._id,
      churchId: church1._id,
      paymentDate: new Date('2024-03-10'),
      paymentMethod: 'upi',
      notes: 'Festival offering',
      smsNotificationSent: false,
      createdBy: kutayimaAdmin._id,
    });

    const transaction10 = await Transaction.create({
      receiptNumber: 'RCP010',
      transactionType: 'spl_contribution',
      totalAmount: 7500,
      memberAmount: 0,
      houseAmount: 7500,
      houseId: house4._id,
      unitId: unit2._id,
      churchId: church1._id,
      paymentDate: new Date('2024-03-15'),
      paymentMethod: 'bank_transfer',
      notes: 'Building fund contribution',
      smsNotificationSent: false,
      createdBy: unitAdmin._id,
    });

    console.log(`✅ Created ${10} transactions`);
    console.log('\n🙏 Creating Spiritual Activities...');

    // Create Spiritual Activities
    const activity1 = await SpiritualActivity.create({
      memberId: member1._id,
      activityType: 'mass',
      massDate: new Date('2024-01-07'),
      massAttended: true,
      selfReported: false,
      reportedAt: new Date('2024-01-07'),
      verifiedBy: churchAdmin._id,
      verifiedAt: new Date('2024-01-07'),
    });

    const activity2 = await SpiritualActivity.create({
      memberId: member2._id,
      activityType: 'fasting',
      fastingWeek: '2024-W03',
      fastingDays: ['friday', 'saturday'],
      selfReported: true,
      reportedAt: new Date('2024-01-20'),
    });

    const activity3 = await SpiritualActivity.create({
      memberId: member3._id,
      activityType: 'prayer',
      prayerType: 'rosary',
      prayerCount: 7,
      prayerWeek: '2024-W04',
      selfReported: true,
      reportedAt: new Date('2024-01-25'),
    });

    // Add more spiritual activities from different members
    const activity4 = await SpiritualActivity.create({
      memberId: member5._id,
      activityType: 'mass',
      massDate: new Date('2024-01-14'),
      massAttended: true,
      selfReported: false,
      reportedAt: new Date('2024-01-14'),
      verifiedBy: churchAdmin._id,
      verifiedAt: new Date('2024-01-14'),
    });

    const activity5 = await SpiritualActivity.create({
      memberId: member7._id,
      activityType: 'prayer',
      prayerType: 'divine_mercy',
      prayerCount: 9,
      prayerWeek: '2024-W05',
      selfReported: true,
      reportedAt: new Date('2024-02-01'),
    });

    const activity6 = await SpiritualActivity.create({
      memberId: member9._id,
      activityType: 'fasting',
      fastingWeek: '2024-W06',
      fastingDays: ['wednesday', 'friday'],
      selfReported: true,
      reportedAt: new Date('2024-02-10'),
    });

    const activity7 = await SpiritualActivity.create({
      memberId: kutayimaAdmin._id,
      activityType: 'mass',
      massDate: new Date('2024-02-04'),
      massAttended: true,
      selfReported: false,
      reportedAt: new Date('2024-02-04'),
      verifiedBy: churchAdmin._id,
      verifiedAt: new Date('2024-02-04'),
    });

    const activity8 = await SpiritualActivity.create({
      memberId: member1._id,
      activityType: 'prayer',
      prayerType: 'rosary',
      prayerCount: 30,
      prayerWeek: '2024-W07',
      selfReported: true,
      reportedAt: new Date('2024-02-15'),
    });

    const activity9 = await SpiritualActivity.create({
      memberId: member3._id,
      activityType: 'mass',
      massDate: new Date('2024-02-11'),
      massAttended: true,
      selfReported: false,
      reportedAt: new Date('2024-02-11'),
      verifiedBy: kutayimaAdmin._id,
      verifiedAt: new Date('2024-02-11'),
    });

    const activity10 = await SpiritualActivity.create({
      memberId: member5._id,
      activityType: 'fasting',
      fastingWeek: '2024-W08',
      fastingDays: ['friday'],
      selfReported: true,
      reportedAt: new Date('2024-02-23'),
    });

    const activity11 = await SpiritualActivity.create({
      memberId: member7._id,
      activityType: 'mass',
      massDate: new Date('2024-02-18'),
      massAttended: true,
      selfReported: false,
      reportedAt: new Date('2024-02-18'),
      verifiedBy: unitAdmin._id,
      verifiedAt: new Date('2024-02-18'),
    });

    const activity12 = await SpiritualActivity.create({
      memberId: member2._id,
      activityType: 'prayer',
      prayerType: 'stations',
      prayerCount: 14,
      prayerWeek: '2024-W09',
      selfReported: true,
      reportedAt: new Date('2024-03-01'),
    });

    console.log(`✅ Created ${12} spiritual activities`);
    console.log('\n📊 Creating Campaign...');

    // Create Campaign
    const campaign = await Campaign.create({
      churchId: church1._id,
      campaignType: 'stothrakazhcha',
      name: 'Annual Stothrakazhcha 2024',
      description: 'Annual thanksgiving celebration',
      fixedAmount: 500,
      amountType: 'per_house',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      dueDate: new Date('2024-03-31'),
      isActive: true,
      totalCollected: 0,
      participantCount: 0,
      createdBy: superAdmin._id,
    });

    console.log(`✅ Created ${1} campaign`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📝 Summary:');
    console.log(`   Churches: 2`);
    console.log(`   Units: 3`);
    console.log(`   Bavanakutayimas: 4`);
    console.log(`   Houses: 5`);
    console.log(`   Members: 14 (4 with login, 10 regular)`);
    console.log(`   Transactions: 10 (₹43,000 total)`);
    console.log(`   Spiritual Activities: 12`);
    console.log(`   Campaigns: 1`);

    console.log('\n🔐 Login Credentials:');
    console.log('   Super Admin:');
    console.log('     Username: superadmin');
    console.log('     Password: admin123');
    console.log('   Church Admin:');
    console.log('     Username: churchadmin');
    console.log('     Password: church123');
    console.log('   Unit Admin:');
    console.log('     Username: unitadmin');
    console.log('     Password: unit123');
    console.log('   Kutayima Admin:');
    console.log('     Username: kutayimaadmin');
    console.log('     Password: kutayima123');

    console.log('\n📊 Data Distribution:');
    console.log('   Church 1 (St. Mary\'s):');
    console.log('     - Unit 1 (North): 6 members, 2 BKs');
    console.log('     - Unit 2 (South): 3 members, 1 BK');
    console.log('   Church 2 (Sacred Heart):');
    console.log('     - Unit 3 (East): 3 members, 1 BK');
    console.log('\n   Transactions by Type:');
    console.log('     - Lelam: 4 transactions');
    console.log('     - Dashamansham: 2 transactions');
    console.log('     - Special Contribution: 3 transactions');
    console.log('     - Thirunnaal Panam: 1 transaction');
    console.log('\n   Spiritual Activities:');
    console.log('     - Mass Attendance: 5 records');
    console.log('     - Fasting: 4 records');
    console.log('     - Prayer: 3 records');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();

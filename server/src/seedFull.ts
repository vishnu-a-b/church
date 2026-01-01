import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/database';

// Import all models
import Church from './models/Church';
import Unit from './models/Unit';
import Bavanakutayima from './models/Bavanakutayima';
import House from './models/House';
import Member from './models/Member';
import Campaign from './models/Campaign';
import Transaction from './models/Transaction';
import SpiritualActivity from './models/SpiritualActivity';
import Stothrakazhcha from './models/Stothrakazhcha';
import StothrakazhchaDue from './models/StothrakazhchaDue';

dotenv.config();

/**
 * COMPREHENSIVE DATABASE SEED WITH FULL DATA
 * Includes: Church hierarchy, Members, Campaigns with payments, Stothrakazhcha with member/house payments
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting comprehensive database seed...\n');

    // Connect to database
    await connectDB();

    console.log('🗑️  Clearing all existing data...');
    // Clear ALL existing data
    await Promise.all([
      Church.deleteMany({}),
      Unit.deleteMany({}),
      Bavanakutayima.deleteMany({}),
      House.deleteMany({}),
      Member.deleteMany({}),
      Campaign.deleteMany({}),
      Transaction.deleteMany({}),
      SpiritualActivity.deleteMany({}),
      Stothrakazhcha.deleteMany({}),
      StothrakazhchaDue.deleteMany({}),
    ]);
    console.log('✅ All data cleared successfully\n');

    // ========================
    // 1. CREATE CHURCH
    // ========================
    console.log('🏛️  Creating Church...');
    const church = await Church.create({
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
    console.log(`   ✓ Created: ${church.name} (${church.uniqueId})`);

    // ========================
    // 2. CREATE UNITS
    // ========================
    console.log('\n📍 Creating Units...');
    const units = await Unit.insertMany([
      {
        churchId: church._id,
        unitNumber: 1,
        uniqueId: 'CH001-U001',
        name: 'Sacred Heart Unit',
        unitCode: 'UNIT-001',
      },
      {
        churchId: church._id,
        unitNumber: 2,
        uniqueId: 'CH001-U002',
        name: 'Holy Family Unit',
        unitCode: 'UNIT-002',
      },
      {
        churchId: church._id,
        unitNumber: 3,
        uniqueId: 'CH001-U003',
        name: 'Divine Mercy Unit',
        unitCode: 'UNIT-003',
      },
    ]);
    console.log(`   ✓ Created ${units.length} units`);

    // ========================
    // 3. CREATE BAVANAKUTAYIMAS (Prayer Groups)
    // ========================
    console.log('\n🙏 Creating Bavanakutayimas (Prayer Groups)...');
    const bavanakutayimas = await Bavanakutayima.insertMany([
      // Unit 1 - Sacred Heart Unit
      {
        unitId: units[0]._id,
        bavanakutayimaNumber: 1,
        uniqueId: 'CH001-U001-B001',
        name: 'Morning Star Prayer Group',
        leaderName: 'Sebastian Mathew',
      },
      {
        unitId: units[0]._id,
        bavanakutayimaNumber: 2,
        uniqueId: 'CH001-U001-B002',
        name: 'Holy Cross Prayer Group',
        leaderName: 'Mary Joseph',
      },
      {
        unitId: units[0]._id,
        bavanakutayimaNumber: 3,
        uniqueId: 'CH001-U001-B003',
        name: 'St. Anthony Prayer Group',
        leaderName: 'George Thomas',
      },
      // Unit 2 - Holy Family Unit
      {
        unitId: units[1]._id,
        bavanakutayimaNumber: 1,
        uniqueId: 'CH001-U002-B001',
        name: 'Divine Mercy Group',
        leaderName: 'John Peter',
      },
      {
        unitId: units[1]._id,
        bavanakutayimaNumber: 2,
        uniqueId: 'CH001-U002-B002',
        name: 'Sacred Heart Group',
        leaderName: 'Elizabeth Paul',
      },
      // Unit 3 - Divine Mercy Unit
      {
        unitId: units[2]._id,
        bavanakutayimaNumber: 1,
        uniqueId: 'CH001-U003-B001',
        name: 'Holy Spirit Group',
        leaderName: 'James Abraham',
      },
    ]);
    console.log(`   ✓ Created ${bavanakutayimas.length} bavanakutayimas`);

    // ========================
    // 4. CREATE HOUSES
    // ========================
    console.log('\n🏠 Creating Houses...');
    const houses = await House.insertMany([
      // Bavanakutayima 1 - Morning Star (Unit 1)
      {
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseNumber: 1,
        uniqueId: 'CH001-U001-B001-H001',
        familyName: 'Mathew Family',
        headOfFamily: 'Thomas Mathew',
        address: '123 Church Road, Kochi',
        phone: '9876543211',
        houseCode: 'MAT-001',
      },
      {
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseNumber: 2,
        uniqueId: 'CH001-U001-B001-H002',
        familyName: 'Joseph Family',
        headOfFamily: 'John Joseph',
        address: '456 Lake View, Kochi',
        phone: '9876543212',
        houseCode: 'JOS-001',
      },
      // Bavanakutayima 2 - Holy Cross (Unit 1)
      {
        bavanakutayimaId: bavanakutayimas[1]._id,
        houseNumber: 1,
        uniqueId: 'CH001-U001-B002-H001',
        familyName: 'Peter Family',
        headOfFamily: 'Simon Peter',
        address: '789 Hill Station, Kochi',
        phone: '9876543213',
        houseCode: 'PET-001',
      },
      {
        bavanakutayimaId: bavanakutayimas[1]._id,
        houseNumber: 2,
        uniqueId: 'CH001-U001-B002-H002',
        familyName: 'George Family',
        headOfFamily: 'Philip George',
        address: '234 Garden Street, Kochi',
        phone: '9876543215',
        houseCode: 'GEO-001',
      },
      // Bavanakutayima 3 - St. Anthony (Unit 1)
      {
        bavanakutayimaId: bavanakutayimas[2]._id,
        houseNumber: 1,
        uniqueId: 'CH001-U001-B003-H001',
        familyName: 'Jacob Family',
        headOfFamily: 'Benjamin Jacob',
        address: '567 Market Road, Kochi',
        phone: '9876543216',
        houseCode: 'JAC-001',
      },
      // Bavanakutayima 4 - Divine Mercy (Unit 2)
      {
        bavanakutayimaId: bavanakutayimas[3]._id,
        houseNumber: 1,
        uniqueId: 'CH001-U002-B001-H001',
        familyName: 'Abraham Family',
        headOfFamily: 'Paul Abraham',
        address: '321 River Side, Kochi',
        phone: '9876543214',
        houseCode: 'ABR-001',
      },
      {
        bavanakutayimaId: bavanakutayimas[3]._id,
        houseNumber: 2,
        uniqueId: 'CH001-U002-B001-H002',
        familyName: 'Samuel Family',
        headOfFamily: 'David Samuel',
        address: '890 Temple Street, Kochi',
        phone: '9876543217',
        houseCode: 'SAM-001',
      },
      // Bavanakutayima 5 - Sacred Heart (Unit 2)
      {
        bavanakutayimaId: bavanakutayimas[4]._id,
        houseNumber: 1,
        uniqueId: 'CH001-U002-B002-H001',
        familyName: 'Luke Family',
        headOfFamily: 'Matthew Luke',
        address: '432 Station Road, Kochi',
        phone: '9876543218',
        houseCode: 'LUK-001',
      },
      // Bavanakutayima 6 - Holy Spirit (Unit 3)
      {
        bavanakutayimaId: bavanakutayimas[5]._id,
        houseNumber: 1,
        uniqueId: 'CH001-U003-B001-H001',
        familyName: 'Stephen Family',
        headOfFamily: 'Andrew Stephen',
        address: '765 Beach Road, Kochi',
        phone: '9876543219',
        houseCode: 'STE-001',
      },
      {
        bavanakutayimaId: bavanakutayimas[5]._id,
        houseNumber: 2,
        uniqueId: 'CH001-U003-B001-H002',
        familyName: 'Emmanuel Family',
        headOfFamily: 'Joseph Emmanuel',
        address: '109 Fort Street, Kochi',
        phone: '9876543220',
        houseCode: 'EMM-001',
      },
    ]);
    console.log(`   ✓ Created ${houses.length} houses`);

    // ========================
    // 5. CREATE MEMBERS
    // ========================
    console.log('\n👨‍👩‍👧‍👦 Creating Members...');
    const memberData = [
      // House 1 - Mathew Family (4 members)
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseId: houses[0]._id,
        memberNumber: 1,
        uniqueId: 'CH001-U001-B001-H001-M001',
        firstName: 'Thomas',
        lastName: 'Mathew',
        dateOfBirth: new Date('1980-05-15'),
        gender: 'male',
        phone: '9876543211',
        email: 'thomas@example.com',
        baptismName: 'Thomas',
        relationToHead: 'head',
        isActive: true,
        username: 'thomas',
        password: 'password123',
        role: 'member',
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseId: houses[0]._id,
        memberNumber: 2,
        uniqueId: 'CH001-U001-B001-H001-M002',
        firstName: 'Anna',
        lastName: 'Mathew',
        dateOfBirth: new Date('1982-08-20'),
        gender: 'female',
        phone: '9876543221',
        email: 'anna@example.com',
        baptismName: 'Anna',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseId: houses[0]._id,
        memberNumber: 3,
        uniqueId: 'CH001-U001-B001-H001-M003',
        firstName: 'David',
        lastName: 'Mathew',
        dateOfBirth: new Date('2005-03-10'),
        gender: 'male',
        phone: '9876543225',
        email: 'david@example.com',
        baptismName: 'David',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseId: houses[0]._id,
        memberNumber: 4,
        uniqueId: 'CH001-U001-B001-H001-M004',
        firstName: 'Sarah',
        lastName: 'Mathew',
        dateOfBirth: new Date('2008-11-25'),
        gender: 'female',
        phone: '9876543230',
        email: 'sarah.mathew@example.com',
        baptismName: 'Sarah',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: false, receiptNotifications: false },
      },

      // House 2 - Joseph Family (3 members)
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseId: houses[1]._id,
        memberNumber: 5,
        uniqueId: 'CH001-U001-B001-H002-M001',
        firstName: 'John',
        lastName: 'Joseph',
        dateOfBirth: new Date('1975-07-22'),
        gender: 'male',
        phone: '9876543212',
        email: 'john@example.com',
        baptismName: 'John',
        relationToHead: 'head',
        isActive: true,
        username: 'john',
        password: 'password123',
        role: 'member',
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseId: houses[1]._id,
        memberNumber: 6,
        uniqueId: 'CH001-U001-B001-H002-M002',
        firstName: 'Mary',
        lastName: 'Joseph',
        dateOfBirth: new Date('1978-12-15'),
        gender: 'female',
        phone: '9876543222',
        relationToHead: 'spouse',
        baptismName: 'Mary',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[0]._id,
        houseId: houses[1]._id,
        memberNumber: 7,
        uniqueId: 'CH001-U001-B001-H002-M003',
        firstName: 'Elizabeth',
        lastName: 'Joseph',
        dateOfBirth: new Date('2006-04-18'),
        gender: 'female',
        phone: '9876543226',
        email: 'elizabeth@example.com',
        baptismName: 'Elizabeth',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },

      // House 3 - Peter Family (2 members)
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[1]._id,
        houseId: houses[2]._id,
        memberNumber: 8,
        uniqueId: 'CH001-U001-B002-H001-M001',
        firstName: 'Simon',
        lastName: 'Peter',
        dateOfBirth: new Date('1985-09-30'),
        gender: 'male',
        phone: '9876543213',
        email: 'simon@example.com',
        baptismName: 'Simon',
        relationToHead: 'head',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[1]._id,
        houseId: houses[2]._id,
        memberNumber: 9,
        uniqueId: 'CH001-U001-B002-H001-M002',
        firstName: 'Rachel',
        lastName: 'Peter',
        dateOfBirth: new Date('1987-02-14'),
        gender: 'female',
        phone: '9876543223',
        email: 'rachel@example.com',
        baptismName: 'Rachel',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },

      // House 4 - George Family (3 members)
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[1]._id,
        houseId: houses[3]._id,
        memberNumber: 10,
        uniqueId: 'CH001-U001-B002-H002-M001',
        firstName: 'Philip',
        lastName: 'George',
        dateOfBirth: new Date('1983-06-12'),
        gender: 'male',
        phone: '9876543215',
        email: 'philip@example.com',
        baptismName: 'Philip',
        relationToHead: 'head',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[1]._id,
        houseId: houses[3]._id,
        memberNumber: 11,
        uniqueId: 'CH001-U001-B002-H002-M002',
        firstName: 'Rebecca',
        lastName: 'George',
        dateOfBirth: new Date('1985-10-05'),
        gender: 'female',
        phone: '9876543231',
        email: 'rebecca@example.com',
        baptismName: 'Rebecca',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[1]._id,
        houseId: houses[3]._id,
        memberNumber: 12,
        uniqueId: 'CH001-U001-B002-H002-M003',
        firstName: 'Joshua',
        lastName: 'George',
        dateOfBirth: new Date('2010-01-20'),
        gender: 'male',
        phone: '9876543232',
        baptismName: 'Joshua',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: false, paymentNotifications: false, receiptNotifications: false },
      },

      // House 5 - Jacob Family (4 members)
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[2]._id,
        houseId: houses[4]._id,
        memberNumber: 13,
        uniqueId: 'CH001-U001-B003-H001-M001',
        firstName: 'Benjamin',
        lastName: 'Jacob',
        dateOfBirth: new Date('1979-04-08'),
        gender: 'male',
        phone: '9876543216',
        email: 'benjamin@example.com',
        baptismName: 'Benjamin',
        relationToHead: 'head',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[2]._id,
        houseId: houses[4]._id,
        memberNumber: 14,
        uniqueId: 'CH001-U001-B003-H001-M002',
        firstName: 'Ruth',
        lastName: 'Jacob',
        dateOfBirth: new Date('1981-11-30'),
        gender: 'female',
        phone: '9876543233',
        email: 'ruth@example.com',
        baptismName: 'Ruth',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[2]._id,
        houseId: houses[4]._id,
        memberNumber: 15,
        uniqueId: 'CH001-U001-B003-H001-M003',
        firstName: 'Samuel',
        lastName: 'Jacob',
        dateOfBirth: new Date('2007-07-07'),
        gender: 'male',
        phone: '9876543234',
        baptismName: 'Samuel',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: false, receiptNotifications: false },
      },
      {
        churchId: church._id,
        unitId: units[0]._id,
        bavanakutayimaId: bavanakutayimas[2]._id,
        houseId: houses[4]._id,
        memberNumber: 16,
        uniqueId: 'CH001-U001-B003-H001-M004',
        firstName: 'Esther',
        lastName: 'Jacob',
        dateOfBirth: new Date('2009-09-09'),
        gender: 'female',
        phone: '9876543235',
        baptismName: 'Esther',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: false, paymentNotifications: false, receiptNotifications: false },
      },

      // House 6 - Abraham Family (3 members) - Church Admin
      {
        churchId: church._id,
        unitId: units[1]._id,
        bavanakutayimaId: bavanakutayimas[3]._id,
        houseId: houses[5]._id,
        memberNumber: 17,
        uniqueId: 'CH001-U002-B001-H001-M001',
        firstName: 'Paul',
        lastName: 'Abraham',
        dateOfBirth: new Date('1970-01-15'),
        gender: 'male',
        phone: '9876543214',
        email: 'paul@example.com',
        baptismName: 'Paul',
        relationToHead: 'head',
        isActive: true,
        username: 'paul',
        password: 'password123',
        role: 'church_admin',
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[1]._id,
        bavanakutayimaId: bavanakutayimas[3]._id,
        houseId: houses[5]._id,
        memberNumber: 18,
        uniqueId: 'CH001-U002-B001-H001-M002',
        firstName: 'Sarah',
        lastName: 'Abraham',
        dateOfBirth: new Date('1972-05-20'),
        gender: 'female',
        phone: '9876543224',
        email: 'sarah@example.com',
        baptismName: 'Sarah',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[1]._id,
        bavanakutayimaId: bavanakutayimas[3]._id,
        houseId: houses[5]._id,
        memberNumber: 19,
        uniqueId: 'CH001-U002-B001-H001-M003',
        firstName: 'James',
        lastName: 'Abraham',
        dateOfBirth: new Date('2003-12-12'),
        gender: 'male',
        phone: '9876543227',
        email: 'james@example.com',
        baptismName: 'James',
        relationToHead: 'child',
        isActive: true,
        username: 'james',
        password: 'password123',
        role: 'member',
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },

      // House 7 - Samuel Family (2 members)
      {
        churchId: church._id,
        unitId: units[1]._id,
        bavanakutayimaId: bavanakutayimas[3]._id,
        houseId: houses[6]._id,
        memberNumber: 20,
        uniqueId: 'CH001-U002-B001-H002-M001',
        firstName: 'David',
        lastName: 'Samuel',
        dateOfBirth: new Date('1988-03-25'),
        gender: 'male',
        phone: '9876543217',
        email: 'david.samuel@example.com',
        baptismName: 'David',
        relationToHead: 'head',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[1]._id,
        bavanakutayimaId: bavanakutayimas[3]._id,
        houseId: houses[6]._id,
        memberNumber: 21,
        uniqueId: 'CH001-U002-B001-H002-M002',
        firstName: 'Hannah',
        lastName: 'Samuel',
        dateOfBirth: new Date('1990-08-16'),
        gender: 'female',
        phone: '9876543236',
        email: 'hannah@example.com',
        baptismName: 'Hannah',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },

      // House 8 - Luke Family (3 members)
      {
        churchId: church._id,
        unitId: units[1]._id,
        bavanakutayimaId: bavanakutayimas[4]._id,
        houseId: houses[7]._id,
        memberNumber: 22,
        uniqueId: 'CH001-U002-B002-H001-M001',
        firstName: 'Matthew',
        lastName: 'Luke',
        dateOfBirth: new Date('1977-11-11'),
        gender: 'male',
        phone: '9876543218',
        email: 'matthew@example.com',
        baptismName: 'Matthew',
        relationToHead: 'head',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[1]._id,
        bavanakutayimaId: bavanakutayimas[4]._id,
        houseId: houses[7]._id,
        memberNumber: 23,
        uniqueId: 'CH001-U002-B002-H001-M002',
        firstName: 'Martha',
        lastName: 'Luke',
        dateOfBirth: new Date('1979-06-06'),
        gender: 'female',
        phone: '9876543237',
        email: 'martha@example.com',
        baptismName: 'Martha',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[1]._id,
        bavanakutayimaId: bavanakutayimas[4]._id,
        houseId: houses[7]._id,
        memberNumber: 24,
        uniqueId: 'CH001-U002-B002-H001-M003',
        firstName: 'Mark',
        lastName: 'Luke',
        dateOfBirth: new Date('2004-02-28'),
        gender: 'male',
        phone: '9876543238',
        baptismName: 'Mark',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: false, receiptNotifications: false },
      },

      // House 9 - Stephen Family (4 members)
      {
        churchId: church._id,
        unitId: units[2]._id,
        bavanakutayimaId: bavanakutayimas[5]._id,
        houseId: houses[8]._id,
        memberNumber: 25,
        uniqueId: 'CH001-U003-B001-H001-M001',
        firstName: 'Andrew',
        lastName: 'Stephen',
        dateOfBirth: new Date('1973-10-10'),
        gender: 'male',
        phone: '9876543219',
        email: 'andrew@example.com',
        baptismName: 'Andrew',
        relationToHead: 'head',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[2]._id,
        bavanakutayimaId: bavanakutayimas[5]._id,
        houseId: houses[8]._id,
        memberNumber: 26,
        uniqueId: 'CH001-U003-B001-H001-M002',
        firstName: 'Deborah',
        lastName: 'Stephen',
        dateOfBirth: new Date('1975-12-24'),
        gender: 'female',
        phone: '9876543239',
        email: 'deborah@example.com',
        baptismName: 'Deborah',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[2]._id,
        bavanakutayimaId: bavanakutayimas[5]._id,
        houseId: houses[8]._id,
        memberNumber: 27,
        uniqueId: 'CH001-U003-B001-H001-M003',
        firstName: 'Nathan',
        lastName: 'Stephen',
        dateOfBirth: new Date('2001-05-05'),
        gender: 'male',
        phone: '9876543240',
        baptismName: 'Nathan',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[2]._id,
        bavanakutayimaId: bavanakutayimas[5]._id,
        houseId: houses[8]._id,
        memberNumber: 28,
        uniqueId: 'CH001-U003-B001-H001-M004',
        firstName: 'Lydia',
        lastName: 'Stephen',
        dateOfBirth: new Date('2003-08-18'),
        gender: 'female',
        phone: '9876543241',
        baptismName: 'Lydia',
        relationToHead: 'child',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: false, receiptNotifications: false },
      },

      // House 10 - Emmanuel Family (2 members)
      {
        churchId: church._id,
        unitId: units[2]._id,
        bavanakutayimaId: bavanakutayimas[5]._id,
        houseId: houses[9]._id,
        memberNumber: 29,
        uniqueId: 'CH001-U003-B001-H002-M001',
        firstName: 'Joseph',
        lastName: 'Emmanuel',
        dateOfBirth: new Date('1992-07-07'),
        gender: 'male',
        phone: '9876543220',
        email: 'joseph.emmanuel@example.com',
        baptismName: 'Joseph',
        relationToHead: 'head',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
      {
        churchId: church._id,
        unitId: units[2]._id,
        bavanakutayimaId: bavanakutayimas[5]._id,
        houseId: houses[9]._id,
        memberNumber: 30,
        uniqueId: 'CH001-U003-B001-H002-M002',
        firstName: 'Grace',
        lastName: 'Emmanuel',
        dateOfBirth: new Date('1994-09-14'),
        gender: 'female',
        phone: '9876543242',
        email: 'grace@example.com',
        baptismName: 'Grace',
        relationToHead: 'spouse',
        isActive: true,
        smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
      },
    ];

    // Create members one by one to trigger password hashing hooks
    const members = [];
    for (const data of memberData) {
      const member = await Member.create(data);
      members.push(member);
    }
    console.log(`   ✓ Created ${members.length} members across ${houses.length} houses`);

    // ========================
    // 6. CREATE ADMIN USER
    // ========================
    console.log('\n👤 Creating Super Admin...');
    const admin = await Member.create({
      churchId: church._id,
      unitId: units[0]._id,
      bavanakutayimaId: bavanakutayimas[0]._id,
      houseId: houses[0]._id,
      memberNumber: 999,
      uniqueId: 'CH001-ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      dateOfBirth: new Date('1970-01-01'),
      gender: 'male',
      phone: '9999999999',
      email: 'admin@example.com',
      baptismName: 'Admin',
      relationToHead: 'other',
      isActive: true,
      username: 'admin',
      password: 'admin123',
      role: 'super_admin',
      smsPreferences: { enabled: true, paymentNotifications: true, receiptNotifications: true },
    });
    console.log(`   ✓ Created super admin: ${admin.username}`);

    // ========================
    // 7. CREATE CAMPAIGNS
    // ========================
    console.log('\n📢 Creating Campaigns...');
    const campaigns = await Campaign.insertMany([
      {
        churchId: church._id,
        campaignType: 'building_fund',
        name: 'Church Building Fund 2025',
        description: 'Major fundraising campaign for new church building construction and renovation',
        contributionMode: 'fixed',
        fixedAmount: 5000,
        amountType: 'per_member',
        minimumAmount: 1000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        dueDate: new Date('2025-06-30'),
        isActive: true,
        totalCollected: 0,
        participantCount: 0,
        duesProcessed: false,
        createdBy: admin._id,
      },
      {
        churchId: church._id,
        campaignType: 'charity',
        name: 'Christmas Charity Fund',
        description: 'Special collection for helping poor families during Christmas season',
        contributionMode: 'variable',
        amountType: 'per_house',
        minimumAmount: 500,
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-01-06'),
        dueDate: new Date('2024-12-25'),
        isActive: true,
        totalCollected: 0,
        participantCount: 0,
        duesProcessed: false,
        createdBy: admin._id,
      },
      {
        churchId: church._id,
        campaignType: 'spl_contribution',
        name: 'Annual Feast Day Fund',
        description: 'Contribution for annual parish feast day celebration and programs',
        contributionMode: 'fixed',
        fixedAmount: 2000,
        amountType: 'per_house',
        minimumAmount: 1000,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-02-15'),
        dueDate: new Date('2025-02-10'),
        isActive: true,
        totalCollected: 0,
        participantCount: 0,
        duesProcessed: false,
        createdBy: admin._id,
      },
      {
        churchId: church._id,
        campaignType: 'general_fund',
        name: 'Education Support Fund',
        description: 'Supporting education expenses for underprivileged children',
        contributionMode: 'variable',
        amountType: 'flexible',
        minimumAmount: 100,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
        dueDate: new Date('2025-03-15'),
        isActive: true,
        totalCollected: 0,
        participantCount: 0,
        duesProcessed: false,
        createdBy: admin._id,
      },
    ] as any[]);
    console.log(`   ✓ Created ${campaigns.length} campaigns`);

    // ========================
    // 8. CREATE STOTHRAKAZHCHA (Weekly Contributions)
    // ========================
    console.log('\n📅 Creating Stothrakazhcha (Weekly Contributions)...');
    const stothrakazhchas = [];

    // Create 4 weeks of stothrakazhcha
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekStartDate = new Date('2025-01-01');
      weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      const dueDate = new Date(weekEndDate);
      dueDate.setDate(dueDate.getDate() + 1);

      const stothrakazhcha = await Stothrakazhcha.create({
        churchId: church._id,
        weekNumber: weekNum,
        year: 2025,
        weekStartDate,
        weekEndDate,
        dueDate,
        defaultAmount: 100,
        amountType: 'per_member',
        status: weekNum === 4 ? 'active' : 'closed',
        totalCollected: 0,
        totalContributors: 0,
        duesProcessed: false,
        createdBy: admin._id,
      } as any);
      stothrakazhchas.push(stothrakazhcha);
    }
    console.log(`   ✓ Created ${stothrakazhchas.length} stothrakazhcha weeks`);

    // ========================
    // 9. CREATE TRANSACTIONS - CAMPAIGN PAYMENTS
    // ========================
    console.log('\n💳 Creating Campaign Payment Transactions...');
    const campaignTransactions = [];
    let receiptCounter = 1000;

    // Building Fund - Member payments (10 members pay)
    for (let i = 0; i < 10; i++) {
      const member = members[i];
      const amount = campaigns[0].fixedAmount;

      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'spl_contribution',
        contributionMode: 'fixed',
        campaignId: campaigns[0]._id,
        distribution: 'member_only',
        memberAmount: amount,
        houseAmount: 0,
        totalAmount: amount,
        memberId: member._id,
        houseId: member.houseId,
        unitId: member.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-01-10'),
        paymentMethod: i % 4 === 0 ? 'upi' : i % 4 === 1 ? 'bank_transfer' : i % 4 === 2 ? 'cash' : 'cheque',
        notes: `Building Fund contribution - ${member.firstName} ${member.lastName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      campaignTransactions.push(transaction);

      // Update campaign
      if (!campaigns[0].contributors) campaigns[0].contributors = [];
      campaigns[0].contributors.push({
        contributorId: member._id,
        contributedAmount: amount,
        contributedAt: new Date('2025-01-10'),
      });
      campaigns[0].totalCollected += amount;
      campaigns[0].participantCount += 1;
    }
    await campaigns[0].save();

    // Christmas Charity - House payments (all 10 houses)
    for (let i = 0; i < houses.length; i++) {
      const house = houses[i];
      const amount = Math.floor(Math.random() * 1500) + 500; // 500-2000

      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'spl_contribution',
        contributionMode: 'variable',
        campaignId: campaigns[1]._id,
        distribution: 'house_only',
        memberAmount: 0,
        houseAmount: amount,
        totalAmount: amount,
        houseId: house._id,
        unitId: house.bavanakutayimaId ? bavanakutayimas.find(b => b._id.equals(house.bavanakutayimaId))?.unitId : null,
        churchId: church._id,
        paymentDate: new Date('2024-12-20'),
        paymentMethod: i % 3 === 0 ? 'cash' : i % 3 === 1 ? 'upi' : 'bank_transfer',
        notes: `Christmas Charity - ${house.familyName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      campaignTransactions.push(transaction);

      // Update campaign
      if (!campaigns[1].contributors) campaigns[1].contributors = [];
      campaigns[1].contributors.push({
        contributorId: house._id,
        contributedAmount: amount,
        contributedAt: new Date('2024-12-20'),
      });
      campaigns[1].totalCollected += amount;
      campaigns[1].participantCount += 1;
    }
    await campaigns[1].save();

    // Feast Day Fund - House payments (8 houses pay fixed amount)
    for (let i = 0; i < 8; i++) {
      const house = houses[i];
      const amount = campaigns[2].fixedAmount;

      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'spl_contribution',
        contributionMode: 'fixed',
        campaignId: campaigns[2]._id,
        distribution: 'house_only',
        memberAmount: 0,
        houseAmount: amount,
        totalAmount: amount,
        houseId: house._id,
        unitId: bavanakutayimas.find(b => b._id.equals(house.bavanakutayimaId))?.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-01-25'),
        paymentMethod: i % 2 === 0 ? 'cash' : 'upi',
        notes: `Feast Day Fund - ${house.familyName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      campaignTransactions.push(transaction);

      // Update campaign
      if (!campaigns[2].contributors) campaigns[2].contributors = [];
      campaigns[2].contributors.push({
        contributorId: house._id,
        contributedAmount: amount,
        contributedAt: new Date('2025-01-25'),
      });
      campaigns[2].totalCollected += amount;
      campaigns[2].participantCount += 1;
    }
    await campaigns[2].save();

    // Education Fund - Mixed (both member and house payments)
    // 5 members pay
    for (let i = 0; i < 5; i++) {
      const member = members[i * 3];
      const amount = Math.floor(Math.random() * 1000) + 500;

      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'spl_contribution',
        contributionMode: 'variable',
        campaignId: campaigns[3]._id,
        distribution: 'member_only',
        memberAmount: amount,
        houseAmount: 0,
        totalAmount: amount,
        memberId: member._id,
        houseId: member.houseId,
        unitId: member.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-02-01'),
        paymentMethod: 'upi',
        notes: `Education Fund - ${member.firstName} ${member.lastName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      campaignTransactions.push(transaction);

      if (!campaigns[3].contributors) campaigns[3].contributors = [];
      campaigns[3].contributors.push({
        contributorId: member._id,
        contributedAmount: amount,
        contributedAt: new Date('2025-02-01'),
      });
      campaigns[3].totalCollected += amount;
      campaigns[3].participantCount += 1;
    }

    // 3 houses pay
    for (let i = 0; i < 3; i++) {
      const house = houses[i * 2];
      const amount = Math.floor(Math.random() * 2000) + 1000;

      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'spl_contribution',
        contributionMode: 'variable',
        campaignId: campaigns[3]._id,
        distribution: 'house_only',
        memberAmount: 0,
        houseAmount: amount,
        totalAmount: amount,
        houseId: house._id,
        unitId: bavanakutayimas.find(b => b._id.equals(house.bavanakutayimaId))?.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-02-05'),
        paymentMethod: 'bank_transfer',
        notes: `Education Fund - ${house.familyName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      campaignTransactions.push(transaction);

      if (!campaigns[3].contributors) campaigns[3].contributors = [];
      campaigns[3].contributors.push({
        contributorId: house._id,
        contributedAmount: amount,
        contributedAt: new Date('2025-02-05'),
      });
      campaigns[3].totalCollected += amount;
      campaigns[3].participantCount += 1;
    }
    await campaigns[3].save();

    console.log(`   ✓ Created ${campaignTransactions.length} campaign payment transactions`);

    // ========================
    // 10. CREATE TRANSACTIONS - STOTHRAKAZHCHA PAYMENTS
    // ========================
    console.log('\n💰 Creating Stothrakazhcha Payment Transactions...');
    const stothraTransactions = [];
    const allDues = [];

    // Week 1 - Most members paid
    for (let i = 0; i < 25; i++) {
      const member = members[i];
      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'stothrakazhcha',
        distribution: 'member_only',
        memberAmount: 100,
        houseAmount: 0,
        totalAmount: 100,
        memberId: member._id,
        houseId: member.houseId,
        unitId: member.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-01-07'),
        paymentMethod: i % 3 === 0 ? 'cash' : i % 3 === 1 ? 'upi' : 'bank_transfer',
        notes: `Stothrakazhcha Week 1 - ${member.firstName} ${member.lastName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      stothraTransactions.push(transaction);

      // Add to stothrakazhcha contributors
      if (!stothrakazhchas[0].contributors) stothrakazhchas[0].contributors = [];
      stothrakazhchas[0].contributors.push({
        contributorId: member._id,
        contributorType: 'Member',
        amount: 100,
        transactionId: transaction._id,
        contributedAt: new Date('2025-01-07'),
      });
      stothrakazhchas[0].totalCollected += 100;
      stothrakazhchas[0].totalContributors += 1;
    }
    await stothrakazhchas[0].save();

    // Create dues for remaining 5 members in Week 1
    for (let i = 25; i < members.length; i++) {
      const member = members[i];
      const due = await StothrakazhchaDue.create({
        churchId: church._id,
        stothrakazhchaId: stothrakazhchas[0]._id,
        weekNumber: 1,
        year: 2025,
        dueForId: member._id,
        dueForModel: 'Member',
        dueForName: `${member.firstName} ${member.lastName}`,
        amount: 100,
        isPaid: false,
        paidAmount: 0,
        balance: 100,
        dueDate: stothrakazhchas[0].dueDate,
      });
      allDues.push(due);
    }

    // Week 2 - Some members paid, some partial
    for (let i = 0; i < 20; i++) {
      const member = members[i];
      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'stothrakazhcha',
        distribution: 'member_only',
        memberAmount: 100,
        houseAmount: 0,
        totalAmount: 100,
        memberId: member._id,
        houseId: member.houseId,
        unitId: member.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-01-14'),
        paymentMethod: 'cash',
        notes: `Stothrakazhcha Week 2 - ${member.firstName} ${member.lastName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      stothraTransactions.push(transaction);

      if (!stothrakazhchas[1].contributors) stothrakazhchas[1].contributors = [];
      stothrakazhchas[1].contributors.push({
        contributorId: member._id,
        contributorType: 'Member',
        amount: 100,
        transactionId: transaction._id,
        contributedAt: new Date('2025-01-14'),
      });
      stothrakazhchas[1].totalCollected += 100;
      stothrakazhchas[1].totalContributors += 1;
    }

    // 5 members partial payment
    for (let i = 20; i < 25; i++) {
      const member = members[i];
      const paidAmount = 50;

      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'stothrakazhcha',
        distribution: 'member_only',
        memberAmount: paidAmount,
        houseAmount: 0,
        totalAmount: paidAmount,
        memberId: member._id,
        houseId: member.houseId,
        unitId: member.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-01-14'),
        paymentMethod: 'cash',
        notes: `Stothrakazhcha Week 2 (Partial) - ${member.firstName} ${member.lastName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      stothraTransactions.push(transaction);

      if (!stothrakazhchas[1].contributors) stothrakazhchas[1].contributors = [];
      stothrakazhchas[1].contributors.push({
        contributorId: member._id,
        contributorType: 'Member',
        amount: paidAmount,
        transactionId: transaction._id,
        contributedAt: new Date('2025-01-14'),
      });
      stothrakazhchas[1].totalCollected += paidAmount;
      stothrakazhchas[1].totalContributors += 1;

      // Create due with partial payment
      const due = await StothrakazhchaDue.create({
        churchId: church._id,
        stothrakazhchaId: stothrakazhchas[1]._id,
        weekNumber: 2,
        year: 2025,
        dueForId: member._id,
        dueForModel: 'Member',
        dueForName: `${member.firstName} ${member.lastName}`,
        amount: 100,
        isPaid: false,
        paidAmount: paidAmount,
        balance: 50,
        transactionId: transaction._id,
        paidAt: new Date('2025-01-14'),
        dueDate: stothrakazhchas[1].dueDate,
      });
      allDues.push(due);
    }

    // Remaining 5 didn't pay - create dues
    for (let i = 25; i < members.length; i++) {
      const member = members[i];
      const due = await StothrakazhchaDue.create({
        churchId: church._id,
        stothrakazhchaId: stothrakazhchas[1]._id,
        weekNumber: 2,
        year: 2025,
        dueForId: member._id,
        dueForModel: 'Member',
        dueForName: `${member.firstName} ${member.lastName}`,
        amount: 100,
        isPaid: false,
        paidAmount: 0,
        balance: 100,
        dueDate: stothrakazhchas[1].dueDate,
      });
      allDues.push(due);
    }
    await stothrakazhchas[1].save();

    // Week 3 - Mix of house and member payments
    // 15 members pay
    for (let i = 0; i < 15; i++) {
      const member = members[i * 2];
      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'stothrakazhcha',
        distribution: 'member_only',
        memberAmount: 100,
        houseAmount: 0,
        totalAmount: 100,
        memberId: member._id,
        houseId: member.houseId,
        unitId: member.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-01-21'),
        paymentMethod: 'upi',
        notes: `Stothrakazhcha Week 3 - ${member.firstName} ${member.lastName}`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      stothraTransactions.push(transaction);

      if (!stothrakazhchas[2].contributors) stothrakazhchas[2].contributors = [];
      stothrakazhchas[2].contributors.push({
        contributorId: member._id,
        contributorType: 'Member',
        amount: 100,
        transactionId: transaction._id,
        contributedAt: new Date('2025-01-21'),
      });
      stothrakazhchas[2].totalCollected += 100;
      stothrakazhchas[2].totalContributors += 1;
    }

    // 5 houses pay for their entire family
    for (let i = 0; i < 5; i++) {
      const house = houses[i];
      const houseMembers = members.filter(m => m.houseId.equals(house._id));
      const amount = houseMembers.length * 100;

      const transaction = await Transaction.create({
        receiptNumber: `RCP-${receiptCounter++}`,
        transactionType: 'stothrakazhcha',
        distribution: 'house_only',
        memberAmount: 0,
        houseAmount: amount,
        totalAmount: amount,
        houseId: house._id,
        unitId: bavanakutayimas.find(b => b._id.equals(house.bavanakutayimaId))?.unitId,
        churchId: church._id,
        paymentDate: new Date('2025-01-21'),
        paymentMethod: 'bank_transfer',
        notes: `Stothrakazhcha Week 3 (House Payment) - ${house.familyName} (${houseMembers.length} members)`,
        smsNotificationSent: false,
        createdBy: admin._id,
      });
      stothraTransactions.push(transaction);

      if (!stothrakazhchas[2].contributors) stothrakazhchas[2].contributors = [];
      stothrakazhchas[2].contributors.push({
        contributorId: house._id,
        contributorType: 'House',
        amount: amount,
        transactionId: transaction._id,
        contributedAt: new Date('2025-01-21'),
      });
      stothrakazhchas[2].totalCollected += amount;
      stothrakazhchas[2].totalContributors += 1;
    }
    await stothrakazhchas[2].save();

    // Week 4 (Current - Active) - Create dues for all members
    for (const member of members) {
      const due = await StothrakazhchaDue.create({
        churchId: church._id,
        stothrakazhchaId: stothrakazhchas[3]._id,
        weekNumber: 4,
        year: 2025,
        dueForId: member._id,
        dueForModel: 'Member',
        dueForName: `${member.firstName} ${member.lastName}`,
        amount: 100,
        isPaid: false,
        paidAmount: 0,
        balance: 100,
        dueDate: stothrakazhchas[3].dueDate,
      });
      allDues.push(due);
    }

    console.log(`   ✓ Created ${stothraTransactions.length} stothrakazhcha payment transactions`);
    console.log(`   ✓ Created ${allDues.length} stothrakazhcha dues records`);

    // ========================
    // 11. CREATE SPIRITUAL ACTIVITIES
    // ========================
    console.log('\n🙏 Creating Spiritual Activities...');
    const activities = [];

    for (const member of members) {
      // Mass attendance (3-5 times in last month)
      const massCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < massCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const activity = await SpiritualActivity.create({
          memberId: member._id,
          activityType: 'mass',
          massDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          massAttended: true,
          selfReported: false,
        });
        activities.push(activity);
      }

      // Fasting (random weeks)
      if (Math.random() > 0.3) {
        const activity = await SpiritualActivity.create({
          memberId: member._id,
          activityType: 'fasting',
          fastingWeek: '2025-W01',
          fastingDays: ['monday', 'wednesday', 'friday'],
          selfReported: true,
          reportedAt: new Date(),
        });
        activities.push(activity);
      }

      // Prayer (rosary/divine mercy)
      const prayerTypes = ['rosary', 'divine_mercy', 'stations', 'other'];
      const prayerCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < prayerCount; i++) {
        const activity = await SpiritualActivity.create({
          memberId: member._id,
          activityType: 'prayer',
          prayerType: prayerTypes[Math.floor(Math.random() * prayerTypes.length)],
          prayerCount: Math.floor(Math.random() * 10) + 1,
          prayerWeek: '2025-W01',
          selfReported: true,
          reportedAt: new Date(),
        });
        activities.push(activity);
      }
    }

    console.log(`   ✓ Created ${activities.length} spiritual activity records`);

    // ========================
    // 12. SUMMARY
    // ========================
    console.log('\n');
    console.log('═'.repeat(70));
    console.log('🎉 COMPREHENSIVE DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═'.repeat(70));
    console.log(`\n📊 DATA SUMMARY:`);
    console.log(`   Churches              : 1`);
    console.log(`   Units                 : ${units.length}`);
    console.log(`   Bavanakutayimas       : ${bavanakutayimas.length}`);
    console.log(`   Houses                : ${houses.length}`);
    console.log(`   Members               : ${members.length}`);
    console.log(`   Admin Users           : 1 (super admin)`);
    console.log(`   Total Users           : ${members.length + 1}`);
    console.log(`\n💰 FINANCIAL DATA:`);
    console.log(`   Campaigns             : ${campaigns.length}`);
    console.log(`   Campaign Transactions : ${campaignTransactions.length}`);
    console.log(`   Total Campaign Amount : ₹${campaigns.reduce((sum, c) => sum + c.totalCollected, 0).toLocaleString()}`);
    console.log(`\n📅 STOTHRAKAZHCHA DATA:`);
    console.log(`   Stothrakazhcha Weeks  : ${stothrakazhchas.length}`);
    console.log(`   Stothra Transactions  : ${stothraTransactions.length}`);
    console.log(`   Stothra Dues          : ${allDues.length}`);
    console.log(`   Total Stothra Amount  : ₹${stothrakazhchas.reduce((sum, s) => sum + s.totalCollected, 0).toLocaleString()}`);
    console.log(`\n🙏 SPIRITUAL DATA:`);
    console.log(`   Spiritual Activities  : ${activities.length}`);
    console.log(`\n💳 TRANSACTION SUMMARY:`);
    console.log(`   Total Transactions    : ${campaignTransactions.length + stothraTransactions.length}`);
    console.log(`   Grand Total Amount    : ₹${(campaigns.reduce((sum, c) => sum + c.totalCollected, 0) + stothrakazhchas.reduce((sum, s) => sum + s.totalCollected, 0)).toLocaleString()}`);

    console.log(`\n🔐 LOGIN CREDENTIALS:`);
    console.log(`\n   SUPER ADMIN:`);
    console.log(`   Username: admin`);
    console.log(`   Password: admin123`);
    console.log(`   Email   : admin@example.com`);

    console.log(`\n   CHURCH ADMIN:`);
    console.log(`   Username: paul`);
    console.log(`   Password: password123`);
    console.log(`   Email   : paul@example.com`);

    console.log(`\n   SAMPLE MEMBERS:`);
    console.log(`   Username: thomas  | Password: password123 | Email: thomas@example.com`);
    console.log(`   Username: john    | Password: password123 | Email: john@example.com`);
    console.log(`   Username: james   | Password: password123 | Email: james@example.com`);

    console.log(`\n📋 CAMPAIGN DETAILS:`);
    campaigns.forEach((campaign, index) => {
      console.log(`\n   ${index + 1}. ${campaign.name}`);
      console.log(`      Type: ${campaign.campaignType} | Mode: ${campaign.contributionMode}`);
      console.log(`      Amount: ${campaign.amountType} - ₹${campaign.fixedAmount || campaign.minimumAmount}`);
      console.log(`      Collected: ₹${campaign.totalCollected.toLocaleString()} from ${campaign.participantCount} contributors`);
    });

    console.log(`\n📅 STOTHRAKAZHCHA DETAILS:`);
    stothrakazhchas.forEach((stothra, index) => {
      console.log(`   Week ${stothra.weekNumber}: ${stothra.status.toUpperCase()} - ₹${stothra.totalCollected} from ${stothra.totalContributors} contributors`);
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed.');
    process.exit(0);
  }
};

// Run the seed function
seedDatabase();

/**
 * Setup test church hierarchy.
 *
 * Run after create-church.ts has created "St. Mary's Test Church".
 * Creates: Unit → BavanaKutayima → Houses → Members (with credentials)
 *          + News item + Event
 *
 * All credentials:  username / Test@1234
 *
 * npx ts-node --transpile-only src/scripts/setup-test-church.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Church from '../models/Church';
import Unit from '../models/Unit';
import Bavanakutayima from '../models/Bavanakutayima';
import House from '../models/House';
import Member from '../models/Member';
import News from '../models/News';
import Event from '../models/Event';

dotenv.config();

const setup = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-wallet';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');

  // ── 1. Locate the test church ────────────────────────────────────────────────
  const church = await Church.findOne({ name: /test/i });
  if (!church) {
    console.error('Test church not found. Run create-church.ts first.');
    process.exit(1);
  }
  console.log(`Church: ${church.name}  (_id ${church._id}  uniqueId "${church.uniqueId}")`);

  const churchId = church._id as mongoose.Types.ObjectId;

  // ── 2. Unit ──────────────────────────────────────────────────────────────────
  let unit = await Unit.findOne({ churchId, name: 'Test Unit 1' });
  if (unit) {
    console.log(`Unit already exists: ${unit.uniqueId}`);
  } else {
    const lastUnit = await Unit.findOne({ churchId }).sort({ unitNumber: -1 });
    const unitNumber = lastUnit ? lastUnit.unitNumber + 1 : 1;
    const uniqueId = `${church.uniqueId}-${unitNumber}`;
    unit = await Unit.create({ churchId, unitNumber, uniqueId, name: 'Test Unit 1' });
    console.log(`Created Unit: ${unit.name}  (${unit.uniqueId})`);
  }
  const unitId = unit._id as mongoose.Types.ObjectId;

  // ── 3. BavanaKutayima ────────────────────────────────────────────────────────
  let bk = await Bavanakutayima.findOne({ unitId, name: 'Test BavanaKutayima 1' });
  if (bk) {
    console.log(`BavanaKutayima already exists: ${bk.uniqueId}`);
  } else {
    const lastBK = await Bavanakutayima.findOne({ unitId }).sort({ bavanakutayimaNumber: -1 });
    const bavanakutayimaNumber = lastBK ? lastBK.bavanakutayimaNumber + 1 : 1;
    const uniqueId = `${unit.uniqueId}-${bavanakutayimaNumber}`;
    bk = await Bavanakutayima.create({ unitId, bavanakutayimaNumber, uniqueId, name: 'Test BavanaKutayima 1' });
    console.log(`Created BavanaKutayima: ${bk.name}  (${bk.uniqueId})`);
  }
  const bavanakutayimaId = bk._id as mongoose.Types.ObjectId;

  // ── 4. Houses ────────────────────────────────────────────────────────────────
  const createHouse = async (familyName: string, houseCode: string): Promise<mongoose.Document & { _id: mongoose.Types.ObjectId; uniqueId: string; houseNumber: number }> => {
    let house = await House.findOne({ bavanakutayimaId, familyName }) as any;
    if (house) {
      console.log(`House already exists: ${house.uniqueId}  (${house.familyName})`);
      return house;
    }
    const lastHouse = await House.findOne({ bavanakutayimaId }).sort({ houseNumber: -1 });
    const houseNumber = lastHouse ? lastHouse.houseNumber + 1 : 1;
    const uniqueId = `${bk!.uniqueId}-${houseNumber}`;
    house = await House.create({ bavanakutayimaId, houseNumber, uniqueId, familyName, houseCode }) as any;
    console.log(`Created House: ${house.familyName}  (${house.uniqueId})`);
    return house;
  };

  const house1 = await createHouse('Test Family Alpha', 'TH001');
  const house2 = await createHouse('Test Family Beta', 'TH002');

  const house1Id = house1._id as mongoose.Types.ObjectId;
  const house2Id = house2._id as mongoose.Types.ObjectId;

  // ── 5. Members (credentials stored directly on Member document) ───────────────
  interface MemberSpec {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member';
    houseId: mongoose.Types.ObjectId;
    gender: 'male' | 'female';
  }

  const memberSpecs: MemberSpec[] = [
    { username: 'testchurchadmin', email: 'testchurchadmin@test.church', firstName: 'Test', lastName: 'ChurchAdmin', role: 'church_admin',             houseId: house1Id, gender: 'male' },
    { username: 'testunitadmin',   email: 'testunitadmin@test.church',   firstName: 'Test', lastName: 'UnitAdmin',   role: 'unit_admin',               houseId: house1Id, gender: 'male' },
    { username: 'testbkadmin',     email: 'testbkadmin@test.church',     firstName: 'Test', lastName: 'BKAdmin',     role: 'kudumbakutayima_admin',     houseId: house1Id, gender: 'male' },
    { username: 'testmember1',     email: 'testmember1@test.church',     firstName: 'Test', lastName: 'Member1',     role: 'member',                   houseId: house1Id, gender: 'male' },
    { username: 'testmember2',     email: 'testmember2@test.church',     firstName: 'Test', lastName: 'Member2',     role: 'member',                   houseId: house1Id, gender: 'female' },
    { username: 'testmember3',     email: 'testmember3@test.church',     firstName: 'Test', lastName: 'Member3',     role: 'member',                   houseId: house2Id, gender: 'female' },
  ];

  const PASSWORD = 'Test@1234';
  const createdMembers: { username: string; _id: mongoose.Types.ObjectId }[] = [];

  for (const spec of memberSpecs) {
    const existing = await Member.findOne({ username: spec.username });
    if (existing) {
      console.log(`Member already exists: ${spec.username}`);
      createdMembers.push({ username: spec.username, _id: existing._id as mongoose.Types.ObjectId });
      continue;
    }

    const houseDoc = await House.findById(spec.houseId);
    if (!houseDoc) throw new Error(`House not found: ${spec.houseId}`);

    const lastMember = await Member.findOne({ houseId: spec.houseId }).sort({ memberNumber: -1 });
    const memberNumber = lastMember ? lastMember.memberNumber + 1 : 1;
    const uniqueId = `${houseDoc.uniqueId}-${memberNumber}`;

    // Save credentials directly on Member (matching production pattern).
    // The pre-save hook will hash the password.
    const member = new Member({
      churchId,
      unitId,
      bavanakutayimaId,
      houseId: spec.houseId,
      memberNumber,
      uniqueId,
      firstName: spec.firstName,
      lastName: spec.lastName,
      gender: spec.gender,
      role: spec.role,
      username: spec.username,
      password: PASSWORD,
      email: spec.email,
      isActive: true,
    });
    await member.save(); // triggers pre-save password hash
    console.log(`Created Member: ${spec.username}  (${uniqueId}  role:${spec.role})`);
    createdMembers.push({ username: spec.username, _id: member._id as mongoose.Types.ObjectId });
  }

  // churchadmin's _id (used as createdBy for News/Event)
  const churchAdminMember = await Member.findOne({ username: 'testchurchadmin' });
  if (!churchAdminMember) throw new Error('testchurchadmin not found after creation');
  const createdBy = churchAdminMember._id as mongoose.Types.ObjectId;

  // ── 6. News ──────────────────────────────────────────────────────────────────
  const existingNews = await News.findOne({ churchId, title: 'Test Announcement' });
  if (existingNews) {
    console.log('News already exists: Test Announcement');
  } else {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
    await News.create({
      churchId,
      title: 'Test Announcement',
      contentType: 'text',
      content: 'This is a test announcement created for e2e testing of the church app.',
      startDate: now,
      endDate,
      isActive: true,
      createdBy,
    });
    console.log('Created News: Test Announcement');
  }

  // ── 7. Event ─────────────────────────────────────────────────────────────────
  const existingEvent = await Event.findOne({ churchId, title: 'Test Event' });
  if (existingEvent) {
    console.log('Event already exists: Test Event');
  } else {
    const eventStart = new Date();
    eventStart.setDate(eventStart.getDate() + 7);
    const eventEnd = new Date(eventStart);
    eventEnd.setHours(eventEnd.getHours() + 3);
    await Event.create({
      churchId,
      title: 'Test Event',
      contentType: 'text',
      content: 'This is a test event created for e2e testing.',
      location: 'Test Hall',
      startDate: eventStart,
      endDate: eventEnd,
      isActive: true,
      createdBy,
    });
    console.log('Created Event: Test Event');
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n==============================');
  console.log('Test hierarchy created');
  console.log('==============================');
  console.log(`Church:         ${church.name}  (${church.uniqueId})`);
  console.log(`Unit:           ${unit.name}  (${unit.uniqueId})`);
  console.log(`BavanaKutayima: ${bk.name}  (${bk.uniqueId})`);
  console.log(`Houses:         ${house1.uniqueId} (TH001 Test Family Alpha), ${house2.uniqueId} (TH002 Test Family Beta)`);
  console.log('\nCredentials (all use password: Test@1234)');
  console.log('  testchurchadmin  — church_admin');
  console.log('  testunitadmin    — unit_admin');
  console.log('  testbkadmin      — kudumbakutayima_admin');
  console.log('  testmember1      — member (House 1)');
  console.log('  testmember2      — member (House 1)');
  console.log('  testmember3      — member (House 2)');
  console.log('\nLogin endpoint for ALL roles: /auth/member-login');
  console.log('\nNext step: log in as testchurchadmin and create a Stothrakazhcha week via the church-admin portal.\n');

  process.exit(0);
};

setup().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

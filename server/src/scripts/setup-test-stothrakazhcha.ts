/**
 * Creates a Stothrakazhcha week and a Campaign for the test church.
 *
 * Run after setup-test-church.ts.
 *
 * npx ts-node --transpile-only src/scripts/setup-test-stothrakazhcha.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Church from '../models/Church';
import Member from '../models/Member';
import Stothrakazhcha from '../models/Stothrakazhcha';
import Campaign from '../models/Campaign';

dotenv.config();

const getISOWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const run = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-wallet';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');

  const church = await Church.findOne({ name: /test/i });
  if (!church) {
    console.error('Test church not found. Run create-church.ts + setup-test-church.ts first.');
    process.exit(1);
  }
  const churchId = church._id as mongoose.Types.ObjectId;
  console.log(`Church: ${church.name}  (${church.uniqueId})`);

  const adminMember = await Member.findOne({ username: 'testchurchadmin', churchId });
  if (!adminMember) {
    console.error('testchurchadmin not found. Run setup-test-church.ts first.');
    process.exit(1);
  }
  const createdBy = adminMember._id as mongoose.Types.ObjectId;

  // ── Stothrakazhcha week ────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekNumber = getISOWeekNumber(today);
  const year = today.getFullYear();

  // Sunday→Saturday week: find Monday of current ISO week
  const weekStartDate = new Date(today);
  const dow = today.getDay(); // 0=Sun
  const offsetToMonday = dow === 0 ? -6 : 1 - dow;
  weekStartDate.setDate(today.getDate() + offsetToMonday);

  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);

  const dueDate = new Date(weekEndDate);

  const existingSK = await Stothrakazhcha.findOne({ churchId, year, weekNumber });
  if (existingSK) {
    console.log(`Stothrakazhcha week already exists: Week ${weekNumber}/${year}  (_id ${existingSK._id})`);
  } else {
    const sk = await Stothrakazhcha.create({
      churchId,
      weekNumber,
      year,
      weekStartDate,
      weekEndDate,
      dueDate,
      defaultAmount: 100,
      amountType: 'per_member',
      status: 'active',
      createdBy,
    });
    console.log(`Created Stothrakazhcha: "Test Week 1"  Week ${weekNumber}/${year}  (_id ${sk._id})`);
    console.log(`  weekStartDate: ${weekStartDate.toISOString().slice(0, 10)}`);
    console.log(`  weekEndDate:   ${weekEndDate.toISOString().slice(0, 10)}`);
    console.log(`  defaultAmount: ₹100  amountType: per_member`);
  }

  // ── Campaign ───────────────────────────────────────────────────────────────
  const existingCampaign = await Campaign.findOne({ churchId, name: 'Test Campaign' });
  if (existingCampaign) {
    console.log(`\nCampaign already exists: Test Campaign  (_id ${existingCampaign._id})`);
  } else {
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 60);
    const campaign = await Campaign.create({
      churchId,
      campaignType: 'general_fund',
      name: 'Test Campaign',
      description: 'Test campaign for e2e testing',
      contributionMode: 'variable',
      amountType: 'per_member',
      minimumAmount: 100,
      isCompulsory: false,
      startDate: today,
      endDate,
      dueDate: endDate,
      isActive: true,
      createdBy,
    });
    console.log(`\nCreated Campaign: Test Campaign  (_id ${campaign._id})`);
    console.log(`  type: general_fund  mode: variable  amountType: per_member`);
  }

  console.log('\n==================================================');
  console.log('Test Stothrakazhcha week and Campaign are ready.');
  console.log('==================================================\n');
  console.log('Next steps (manual, via web or mobile):');
  console.log('  1. Log in as testbkadmin on kutayima-admin portal');
  console.log('     → Stothrakazhcha → mark testmember1 as contributed (₹100)');
  console.log('     → contribution will appear as "pending_approval"');
  console.log('  2. Log in as testchurchadmin on church-admin portal');
  console.log('     → Approvals → approve the pending contribution');
  console.log('  3. Log in as testmember1 (member)');
  console.log('     → Stothrakazhcha tab → should show contribution status\n');

  process.exit(0);
};

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

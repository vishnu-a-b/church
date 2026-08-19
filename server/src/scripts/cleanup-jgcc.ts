/**
 * Cleanup script — removes ALL JGCC import data from every church.
 * Safe to run multiple times. Run this before re-running import-jgcc.ts.
 *
 * Removes:
 *  - All MonthlySupportPlan documents named "Jubilee Grand Convention Centre"
 *  - All MonthlySupportDue documents linked to those plans
 *  - All Transaction documents whose receipt starts with "JGCC-IMP-"
 *  - All Donor documents whose notes contain "JGCC_NO:"
 *
 * Run from Church/server/:
 *   npx ts-node --transpile-only src/scripts/cleanup-jgcc.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MonthlySupportPlan from '../models/MonthlySupportPlan';
import MonthlySupportDue from '../models/MonthlySupportDue';
import Transaction from '../models/Transaction';
import Donor from '../models/Donor';

dotenv.config();

const PLAN_NAME = 'Jubilee Grand Convention Centre';

const main = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // 1. Find all JGCC plans across all churches
  const plans = await MonthlySupportPlan.find({ name: PLAN_NAME }).lean();
  console.log(`Found ${plans.length} plan(s) named "${PLAN_NAME}"`);

  let deletedDues = 0;
  let deletedTxns = 0;

  for (const plan of plans) {
    // 2. Delete all dues for this plan
    const duesResult = await MonthlySupportDue.deleteMany({ planId: plan._id });
    deletedDues += duesResult.deletedCount;
    console.log(`  Plan ${plan._id} (church ${plan.churchId}): deleted ${duesResult.deletedCount} dues`);

    // 3. Delete all transactions linked to this plan
    const txnResult = await Transaction.deleteMany({ monthlySupportPlanId: plan._id });
    deletedTxns += txnResult.deletedCount;
    console.log(`  Plan ${plan._id}: deleted ${txnResult.deletedCount} transactions by planId`);
  }

  // 4. Also catch any stray import transactions by receipt number prefix
  const strayTxnResult = await Transaction.deleteMany({ receiptNumber: /^JGCC-IMP-/ });
  deletedTxns += strayTxnResult.deletedCount;
  if (strayTxnResult.deletedCount > 0) {
    console.log(`  Deleted ${strayTxnResult.deletedCount} stray JGCC-IMP-* transactions`);
  }

  // 5. Delete all JGCC plans
  const planResult = await MonthlySupportPlan.deleteMany({ name: PLAN_NAME });
  console.log(`Deleted ${planResult.deletedCount} plan(s)`);

  // 6. Delete all JGCC donors (both old JGCC_NO: tag and new JGCC_FIRST: tag)
  const donorResult = await Donor.deleteMany({ notes: /JGCC_(NO|FIRST):/ });
  console.log(`Deleted ${donorResult.deletedCount} JGCC donor(s)`);

  console.log('\n✅ Cleanup complete');
  console.log(`   Plans deleted:        ${planResult.deletedCount}`);
  console.log(`   Dues deleted:         ${deletedDues}`);
  console.log(`   Transactions deleted: ${deletedTxns}`);
  console.log(`   Donors deleted:       ${donorResult.deletedCount}`);
  console.log('\nNow run: npx ts-node --transpile-only src/scripts/import-jgcc.ts');

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});

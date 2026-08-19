/**
 * Reset JGCC payment entries — keeps plan, donors, and due records but:
 *  - Deletes all Transaction documents whose receipt starts with "JGCC-IMP-"
 *  - Resets all MonthlySupportDue for the JGCC plan to unpaid state
 *    (isPaid=false, paidAmount=0, balance=amount, transactionId/paidAt cleared)
 *
 * Run from Church/server/:
 *   npx ts-node --transpile-only src/scripts/reset-jgcc-payments.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MonthlySupportPlan from '../models/MonthlySupportPlan';
import MonthlySupportDue from '../models/MonthlySupportDue';
import Transaction from '../models/Transaction';

dotenv.config();

const PLAN_NAME = 'Jubilee Grand Convention Centre';

const main = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // 1. Find the JGCC plan
  const plan = await MonthlySupportPlan.findOne({ name: PLAN_NAME }).lean();
  if (!plan) {
    console.error(`No plan found named "${PLAN_NAME}". Nothing to reset.`);
    process.exit(0);
  }
  console.log(`Found plan: "${plan.name}" (_id: ${plan._id})`);

  // 2. Delete all JGCC-IMP-* transactions
  const txnResult = await Transaction.deleteMany({ receiptNumber: /^JGCC-IMP-/ });
  console.log(`Deleted ${txnResult.deletedCount} JGCC-IMP-* transactions`);

  // 3. Reset all dues for this plan to unpaid
  const dueResult = await MonthlySupportDue.updateMany(
    { planId: plan._id },
    {
      $set: { isPaid: false, paidAmount: 0 },
      $unset: { transactionId: '', paidAt: '' },
    }
  );
  // Also set balance = amount for each due (balance may differ per due)
  const dues = await MonthlySupportDue.find({ planId: plan._id });
  for (const due of dues) {
    due.balance = due.amount;
    await due.save();
  }

  console.log(`Reset ${dueResult.modifiedCount} dues to unpaid`);
  console.log(`Updated balance on ${dues.length} dues`);

  console.log('\n✅ Reset complete');
  console.log('   Transactions deleted:  ' + txnResult.deletedCount);
  console.log('   Dues reset to unpaid:  ' + dues.length);
  console.log('\nPlan and donors are intact. Payment entries can now be recorded through the UI.');

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});

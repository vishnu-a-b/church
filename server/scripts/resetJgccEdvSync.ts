import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

// One-off: after reversing the wrongly-classified-as-income JGCC vouchers on
// the EDV side, reset these transactions' sync state so they're eligible for
// a clean re-push once the plan's treatment is flipped to liability.
async function main() {
  const idsPath = process.argv[2] || path.join(__dirname, '../../../jgcc-transaction-ids.json');
  const entries: { transactionId: string }[] = JSON.parse(fs.readFileSync(idsPath, 'utf-8'));
  const ids = entries.map((e) => e.transactionId);

  await mongoose.connect(process.env.MONGODB_URI as string);
  const Transaction = (await import('../src/models/Transaction')).default;

  const result = await Transaction.updateMany(
    { _id: { $in: ids } },
    {
      $set: { edvSynced: false },
      $unset: { edvVoucherId: '', edvSyncError: '', edvSyncedAt: '' },
    }
  );

  console.log(`Matched ${result.matchedCount}, modified ${result.modifiedCount} of ${ids.length} JGCC transactions`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => mongoose.connection.close());

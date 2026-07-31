import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

// One-off: export the JGCC hall-booking transaction IDs that were wrongly
// posted to EDV as income, so they can be reversed and re-pushed correctly
// as liability transactions. Read-only against Mongo.
async function main() {
  const outPath = process.argv[2] || path.join(__dirname, '../../../jgcc-transaction-ids.json');
  await mongoose.connect(process.env.MONGODB_URI as string);
  const Transaction = (await import('../src/models/Transaction')).default;

  const txns = await Transaction.find({
    notes: { $regex: /^JGCC registration payment/ },
    transactionType: 'monthly_support',
    donorId: { $exists: true },
  }).select('_id receiptNumber totalAmount edvSynced edvVoucherId');

  const out = txns.map((t) => ({
    transactionId: String(t._id),
    receiptNumber: t.receiptNumber,
    totalAmount: t.totalAmount,
    edvSynced: t.edvSynced,
    edvVoucherId: t.edvVoucherId,
  }));

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Exported ${out.length} JGCC transaction IDs to ${outPath}`);
  console.log(`Already synced (has a voucher to reverse): ${out.filter((t) => t.edvSynced).length}`);
  console.log(`Never synced (nothing to reverse, just needs re-push): ${out.filter((t) => !t.edvSynced).length}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => mongoose.connection.close());

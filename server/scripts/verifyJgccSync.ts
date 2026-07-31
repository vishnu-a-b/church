import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function main() {
  const entries: { transactionId: string }[] = JSON.parse(fs.readFileSync('/tmp/jgcc-transaction-ids.json', 'utf-8'));
  const ids = entries.map((e) => e.transactionId);

  await mongoose.connect(process.env.MONGODB_URI as string);
  const Transaction = (await import('../src/models/Transaction')).default;

  const txns = await Transaction.find({ _id: { $in: ids } }).select('edvSynced edvVoucherId totalAmount');
  const synced = txns.filter((t) => t.edvSynced);
  const voucherIds = new Set(txns.map((t) => t.edvVoucherId).filter(Boolean));
  const total = txns.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  console.log(`Total transactions checked: ${txns.length}`);
  console.log(`edvSynced=true: ${synced.length}`);
  console.log(`Distinct voucher IDs: ${voucherIds.size}`);
  console.log(`Sum totalAmount: ${total}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => mongoose.connection.close());

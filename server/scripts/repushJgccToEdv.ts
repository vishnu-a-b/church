import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

// One-off: re-push the 283 JGCC transactions through the corrected
// (now liability-treatment) pipeline after the earlier income-classified
// vouchers were reversed on the EDV side and edvSynced was reset.
// Calls the same pushTransactionToEdv() the app itself uses, awaited and
// throttled, to stay well under EDV's rate limit.
async function main() {
  const idsPath = process.argv[2] || path.join(__dirname, '../../../jgcc-transaction-ids.json');
  const entries: { transactionId: string }[] = JSON.parse(fs.readFileSync(idsPath, 'utf-8'));

  await mongoose.connect(process.env.MONGODB_URI as string);
  const Transaction = (await import('../src/models/Transaction')).default;
  const { pushTransactionToEdv } = await import('../src/services/edvBridgeService');

  let ok = 0;
  let failed = 0;
  const errors: { transactionId: string; error: string }[] = [];

  for (const { transactionId } of entries) {
    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      failed++;
      errors.push({ transactionId, error: 'Transaction not found' });
      continue;
    }
    try {
      await pushTransactionToEdv(txn);
      ok++;
      console.log(`OK  ${transactionId} (${ok + failed}/${entries.length})`);
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ transactionId, error: message });
      console.log(`ERR ${transactionId}: ${message} (${ok + failed}/${entries.length})`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\nDone. ok=${ok} failed=${failed} of ${entries.length}`);
  if (errors.length) {
    fs.writeFileSync('/tmp/jgcc-repush-errors.json', JSON.stringify(errors, null, 2));
    console.log('Errors written to /tmp/jgcc-repush-errors.json');
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => mongoose.connection.close());

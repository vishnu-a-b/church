import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// One-off: flip the JGCC Monthly Support plan to liability treatment now
// that EDV is configured with a liability group + personal-ledger auto
// provisioning for this mapping.
async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const MonthlySupportPlan = (await import('../src/models/MonthlySupportPlan')).default;
  const plan = await MonthlySupportPlan.findByIdAndUpdate(
    '6a6b32bdd3ec2cf606b50838',
    { $set: { treatment: 'liability' } },
    { new: true }
  );
  console.log('Updated plan:', plan?.name, 'treatment =', (plan as any)?.treatment);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => mongoose.connection.close());

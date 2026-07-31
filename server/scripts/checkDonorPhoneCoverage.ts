import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const Donor = (await import('../src/models/Donor')).default;

  const total = await Donor.countDocuments();
  const withoutPhone = await Donor.find({ $or: [{ phone: { $exists: false } }, { phone: '' }, { phone: null }] })
    .select('name churchId');
  console.log(`Total donors: ${total}`);
  console.log(`Without phone: ${withoutPhone.length}`);
  if (withoutPhone.length) console.log(JSON.stringify(withoutPhone.slice(0, 20), null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => mongoose.connection.close());

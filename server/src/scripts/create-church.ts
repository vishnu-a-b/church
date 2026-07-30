import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Church from '../models/Church';

dotenv.config();

// Creates a new Church record, purely additive — mirrors the churchNumber/
// uniqueId generation in churchController.createChurch exactly, so it stays
// consistent with what creating one through the app would produce.
//
// Run: npx ts-node-dev --transpile-only src/scripts/create-church.ts "<name>" "<location>"

const createChurch = async () => {
  const [, , name, location] = process.argv;

  if (!name || !location) {
    console.error('Usage: create-church.ts "<name>" "<location>"');
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-wallet';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const existing = await Church.findOne({ name });
    if (existing) {
      console.log(`⚠️  A church named "${name}" already exists (${existing._id}, uniqueId ${existing.uniqueId}) — not creating a duplicate.`);
      process.exit(0);
    }

    const lastChurch = await Church.findOne().sort({ churchNumber: -1 });
    const churchNumber = lastChurch ? lastChurch.churchNumber + 1 : 1;
    const uniqueId = String(churchNumber);

    const church = await Church.create({ name, location, churchNumber, uniqueId });

    console.log('\n✓ Church created');
    console.log(`  Name:       ${church.name}`);
    console.log(`  Location:   ${church.location}`);
    console.log(`  churchNumber: ${church.churchNumber}   uniqueId: ${church.uniqueId}`);
    console.log(`  _id:        ${church._id}`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating church:', error.message);
    process.exit(1);
  }
};

createChurch();

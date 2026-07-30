import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Church from '../models/Church';

dotenv.config();

// Sets settings.edvApiKey on one church, using a dot-path update so the rest
// of `settings` (smsEnabled, smsProvider, smsApiKey, smsSenderId, currency)
// is left untouched. Doing this via PUT /api/churches/:id instead would
// replace the whole `settings` object with whatever partial body was sent.
//
// Run: npx ts-node-dev --transpile-only src/scripts/set-edv-api-key.ts "<churchName>" "<rawApiKey>"

const setEdvApiKey = async () => {
  const [, , churchName, apiKey] = process.argv;

  if (!churchName || !apiKey) {
    console.error('Usage: set-edv-api-key.ts "<churchName>" "<rawApiKey>"');
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-wallet';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const church = await Church.findOneAndUpdate(
      { name: churchName },
      { $set: { 'settings.edvApiKey': apiKey } },
      { new: true }
    );

    if (!church) {
      console.error(`❌ No church found with name "${churchName}"`);
      process.exit(1);
    }

    console.log(`✓ EDV bridge key set for "${church.name}" (${church._id})`);
    console.log('  Make sure EDV_BRIDGE_ENABLED=true and EDV_BRIDGE_API_URL are set in this server\'s .env, then restart it.');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error setting EDV API key:', error.message);
    process.exit(1);
  }
};

setEdvApiKey();

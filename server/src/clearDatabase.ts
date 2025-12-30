import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';
import connectDB from './config/database';

// Import all models
import Church from './models/Church';
import Unit from './models/Unit';
import Bavanakutayima from './models/Bavanakutayima';
import House from './models/House';
import Member from './models/Member';
import User from './models/User';
import Campaign from './models/Campaign';
import Transaction from './models/Transaction';
import Wallet from './models/Wallet';
import SpiritualActivity from './models/SpiritualActivity';
import Stothrakazhcha from './models/Stothrakazhcha';
import StothrakazhchaDue from './models/StothrakazhchaDue';
import News from './models/News';
import Event from './models/Event';
import SMSLog from './models/SMSLog';

dotenv.config();

/**
 * Clear all data from the database
 */
const clearDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('\n⚠️  WARNING: This will DELETE ALL DATA from the database!');
    console.log(`📍 Database: ${process.env.MONGODB_URI}\n`);

    // Ask for confirmation
    const answer = await askQuestion('Are you sure you want to continue? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      process.exit(0);
    }

    console.log('\n🗑️  Clearing all collections...\n');

    // Delete all documents from each collection
    const deletions = await Promise.all([
      Church.deleteMany({}).then(result => ({ model: 'Churches', count: result.deletedCount })),
      Unit.deleteMany({}).then(result => ({ model: 'Units', count: result.deletedCount })),
      Bavanakutayima.deleteMany({}).then(result => ({ model: 'Bavanakutayimas', count: result.deletedCount })),
      House.deleteMany({}).then(result => ({ model: 'Houses', count: result.deletedCount })),
      Member.deleteMany({}).then(result => ({ model: 'Members', count: result.deletedCount })),
      User.deleteMany({}).then(result => ({ model: 'Users', count: result.deletedCount })),
      Campaign.deleteMany({}).then(result => ({ model: 'Campaigns', count: result.deletedCount })),
      Transaction.deleteMany({}).then(result => ({ model: 'Transactions', count: result.deletedCount })),
      Wallet.deleteMany({}).then(result => ({ model: 'Wallets', count: result.deletedCount })),
      SpiritualActivity.deleteMany({}).then(result => ({ model: 'Spiritual Activities', count: result.deletedCount })),
      Stothrakazhcha.deleteMany({}).then(result => ({ model: 'Stothrakazhcha', count: result.deletedCount })),
      StothrakazhchaDue.deleteMany({}).then(result => ({ model: 'Stothrakazhcha Dues', count: result.deletedCount })),
      News.deleteMany({}).then(result => ({ model: 'News', count: result.deletedCount })),
      Event.deleteMany({}).then(result => ({ model: 'Events', count: result.deletedCount })),
      SMSLog.deleteMany({}).then(result => ({ model: 'SMS Logs', count: result.deletedCount })),
    ]);

    // Display results
    console.log('📊 Deletion Summary:');
    console.log('═'.repeat(50));
    deletions.forEach(({ model, count }) => {
      console.log(`   ${model.padEnd(25)} : ${count} deleted`);
    });
    console.log('═'.repeat(50));

    const totalDeleted = deletions.reduce((sum, { count }) => sum + count, 0);
    console.log(`\n✅ Total documents deleted: ${totalDeleted}`);
    console.log('🎉 Database cleared successfully!\n');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed.');
    process.exit(0);
  }
};

/**
 * Ask user for confirmation
 */
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Run the clear function
clearDatabase();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const readline_1 = __importDefault(require("readline"));
const database_1 = __importDefault(require("./config/database"));
// Import all models
const Church_1 = __importDefault(require("./models/Church"));
const Unit_1 = __importDefault(require("./models/Unit"));
const Bavanakutayima_1 = __importDefault(require("./models/Bavanakutayima"));
const House_1 = __importDefault(require("./models/House"));
const Member_1 = __importDefault(require("./models/Member"));
const User_1 = __importDefault(require("./models/User"));
const Campaign_1 = __importDefault(require("./models/Campaign"));
const Transaction_1 = __importDefault(require("./models/Transaction"));
const Wallet_1 = __importDefault(require("./models/Wallet"));
const SpiritualActivity_1 = __importDefault(require("./models/SpiritualActivity"));
const Stothrakazhcha_1 = __importDefault(require("./models/Stothrakazhcha"));
const StothrakazhchaDue_1 = __importDefault(require("./models/StothrakazhchaDue"));
const News_1 = __importDefault(require("./models/News"));
const Event_1 = __importDefault(require("./models/Event"));
const SMSLog_1 = __importDefault(require("./models/SMSLog"));
dotenv_1.default.config();
/**
 * Clear all data from the database
 */
const clearDatabase = async () => {
    try {
        // Connect to database
        await (0, database_1.default)();
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
            Church_1.default.deleteMany({}).then(result => ({ model: 'Churches', count: result.deletedCount })),
            Unit_1.default.deleteMany({}).then(result => ({ model: 'Units', count: result.deletedCount })),
            Bavanakutayima_1.default.deleteMany({}).then(result => ({ model: 'Bavanakutayimas', count: result.deletedCount })),
            House_1.default.deleteMany({}).then(result => ({ model: 'Houses', count: result.deletedCount })),
            Member_1.default.deleteMany({}).then(result => ({ model: 'Members', count: result.deletedCount })),
            User_1.default.deleteMany({}).then(result => ({ model: 'Users', count: result.deletedCount })),
            Campaign_1.default.deleteMany({}).then(result => ({ model: 'Campaigns', count: result.deletedCount })),
            Transaction_1.default.deleteMany({}).then(result => ({ model: 'Transactions', count: result.deletedCount })),
            Wallet_1.default.deleteMany({}).then(result => ({ model: 'Wallets', count: result.deletedCount })),
            SpiritualActivity_1.default.deleteMany({}).then(result => ({ model: 'Spiritual Activities', count: result.deletedCount })),
            Stothrakazhcha_1.default.deleteMany({}).then(result => ({ model: 'Stothrakazhcha', count: result.deletedCount })),
            StothrakazhchaDue_1.default.deleteMany({}).then(result => ({ model: 'Stothrakazhcha Dues', count: result.deletedCount })),
            News_1.default.deleteMany({}).then(result => ({ model: 'News', count: result.deletedCount })),
            Event_1.default.deleteMany({}).then(result => ({ model: 'Events', count: result.deletedCount })),
            SMSLog_1.default.deleteMany({}).then(result => ({ model: 'SMS Logs', count: result.deletedCount })),
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
    }
    catch (error) {
        console.error('❌ Error clearing database:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('👋 Database connection closed.');
        process.exit(0);
    }
};
/**
 * Ask user for confirmation
 */
function askQuestion(query) {
    const rl = readline_1.default.createInterface({
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
//# sourceMappingURL=clearDatabase.js.map
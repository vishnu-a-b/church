"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const Member_1 = __importDefault(require("./models/Member"));
const House_1 = __importDefault(require("./models/House"));
const Bavanakutayima_1 = __importDefault(require("./models/Bavanakutayima"));
const Unit_1 = __importDefault(require("./models/Unit"));
const Church_1 = __importDefault(require("./models/Church"));
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const createMultipleTestMembers = async () => {
    try {
        await (0, database_1.default)();
        console.log('\n🔧 Creating multiple test members with login credentials...\n');
        // Get all houses with their hierarchy
        const houses = await House_1.default.find().limit(5);
        if (houses.length === 0) {
            console.log('❌ No houses found. Please run the seed script first.');
            process.exit(1);
        }
        const testMembers = [
            { username: 'john', password: 'john123', firstName: 'John', lastName: 'Doe' },
            { username: 'mary', password: 'mary123', firstName: 'Mary', lastName: 'Smith' },
            { username: 'thomas', password: 'thomas123', firstName: 'Thomas', lastName: 'Joseph' },
            { username: 'anna', password: 'anna123', firstName: 'Anna', lastName: 'Sebastian' },
            { username: 'peter', password: 'peter123', firstName: 'Peter', lastName: 'Paul' },
        ];
        console.log('📊 Creating test members...\n');
        for (let i = 0; i < Math.min(testMembers.length, houses.length); i++) {
            const house = houses[i];
            const testData = testMembers[i];
            // Get the hierarchy IDs
            const bavanakutayima = await Bavanakutayima_1.default.findById(house.bavanakutayimaId);
            if (!bavanakutayima)
                continue;
            const unit = await Unit_1.default.findById(bavanakutayima.unitId);
            if (!unit)
                continue;
            const church = await Church_1.default.findById(unit.churchId);
            // Check if member already exists
            let member = await Member_1.default.findOne({ username: testData.username });
            if (member) {
                console.log(`  ⚠️  ${testData.username} already exists, skipping...`);
                continue;
            }
            // Get the next member number for this house
            const lastMember = await Member_1.default.findOne({ houseId: house._id }).sort({ memberNumber: -1 });
            const memberNumber = lastMember ? lastMember.memberNumber + 1 : 1;
            // Generate uniqueId
            const uniqueId = `${house.uniqueId}-M${String(memberNumber).padStart(3, '0')}`;
            member = await Member_1.default.create({
                churchId: unit.churchId,
                unitId: bavanakutayima.unitId,
                bavanakutayimaId: house.bavanakutayimaId,
                houseId: house._id,
                memberNumber,
                uniqueId,
                firstName: testData.firstName,
                lastName: testData.lastName,
                dateOfBirth: new Date('1990-01-01'),
                gender: i % 2 === 0 ? 'male' : 'female',
                phone: `999999${String(i).padStart(4, '0')}`,
                email: `${testData.username}@email.com`,
                baptismName: `${testData.firstName} Baptism`,
                relationToHead: 'other',
                username: testData.username,
                password: testData.password,
                role: 'member',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            });
            console.log(`  ✅ Created: ${testData.firstName} ${testData.lastName}`);
            console.log(`     Username: ${testData.username}`);
            console.log(`     Password: ${testData.password}`);
            console.log(`     Church: ${church?.name || 'Unknown'}`);
            console.log(`     Unit: ${unit.name}`);
            console.log(`     Bavanakutayima: ${bavanakutayima.name}`);
            console.log(`     House: ${house.familyName}\n`);
        }
        console.log('✅ All test members created successfully!\n');
        console.log('📋 Summary of Login Credentials:\n');
        console.log('┌────────────┬──────────────┬─────────────────┐');
        console.log('│ Username   │ Password     │ Name            │');
        console.log('├────────────┼──────────────┼─────────────────┤');
        for (const tm of testMembers) {
            console.log(`│ ${tm.username.padEnd(10)} │ ${tm.password.padEnd(12)} │ ${(tm.firstName + ' ' + tm.lastName).padEnd(15)} │`);
        }
        console.log('└────────────┴──────────────┴─────────────────┘\n');
        console.log('🌐 Login URL: http://localhost:3000/member-login\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};
createMultipleTestMembers();
//# sourceMappingURL=createMultipleTestMembers.js.map
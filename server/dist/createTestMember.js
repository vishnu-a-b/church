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
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const createTestMember = async () => {
    try {
        await (0, database_1.default)();
        console.log('\n🔧 Creating test member with login credentials...\n');
        // Get an existing house to assign the member to
        const house = await House_1.default.findOne();
        if (!house) {
            console.log('❌ No houses found. Please run the seed script first.');
            process.exit(1);
        }
        console.log('✅ Found house:', house.uniqueId);
        // Get the hierarchy IDs
        const bavanakutayima = await Bavanakutayima_1.default.findById(house.bavanakutayimaId);
        if (!bavanakutayima) {
            console.log('❌ Bavanakutayima not found.');
            process.exit(1);
        }
        const unit = await Unit_1.default.findById(bavanakutayima.unitId);
        if (!unit) {
            console.log('❌ Unit not found.');
            process.exit(1);
        }
        // Check if member already exists
        let member = await Member_1.default.findOne({ username: 'testmember' });
        if (member) {
            console.log('✅ Test member already exists, updating password...');
            member.password = 'member123';
            member.isActive = true;
            await member.save();
        }
        else {
            // Get the next member number for this house
            const lastMember = await Member_1.default.findOne({ houseId: house._id }).sort({ memberNumber: -1 });
            const memberNumber = lastMember ? lastMember.memberNumber + 1 : 1;
            // Generate uniqueId
            const uniqueId = `${house.uniqueId}-M${String(memberNumber).padStart(3, '0')}`;
            console.log('Creating new test member...');
            member = await Member_1.default.create({
                churchId: unit.churchId,
                unitId: bavanakutayima.unitId,
                bavanakutayimaId: house.bavanakutayimaId,
                houseId: house._id,
                memberNumber,
                uniqueId,
                firstName: 'Test',
                lastName: 'Member',
                dateOfBirth: new Date('1990-01-01'),
                gender: 'male',
                phone: '9999999999',
                email: 'test.member@email.com',
                baptismName: 'Test Baptism',
                relationToHead: 'other',
                username: 'testmember',
                password: 'member123',
                role: 'member',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            });
        }
        console.log('✅ Test member created/updated successfully!');
        // Verify password
        const verifyMember = await Member_1.default.findOne({ username: 'testmember' }).select('+password');
        if (verifyMember) {
            const isMatch = await verifyMember.comparePassword('member123');
            console.log(`✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
        }
        console.log('\n📋 Member Login Credentials:');
        console.log('   Username: testmember');
        console.log('   Password: member123');
        console.log('   Login URL: http://localhost:3000/member-login');
        console.log('\n✅ Test member can now log in!\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};
createTestMember();
//# sourceMappingURL=createTestMember.js.map
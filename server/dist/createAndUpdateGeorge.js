"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const Member_1 = __importDefault(require("./models/Member"));
const User_1 = __importDefault(require("./models/User"));
const Church_1 = __importDefault(require("./models/Church"));
const Unit_1 = __importDefault(require("./models/Unit"));
const Bavanakutayima_1 = __importDefault(require("./models/Bavanakutayima"));
const House_1 = __importDefault(require("./models/House"));
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const createAndUpdateGeorge = async () => {
    try {
        await (0, database_1.default)();
        // Get first church
        const church = await Church_1.default.findOne();
        if (!church) {
            console.error('❌ No church found in database');
            process.exit(1);
        }
        console.log(`✅ Found church: ${church.name}`);
        // Get first unit of this church
        const unit = await Unit_1.default.findOne({ churchId: church._id });
        if (!unit) {
            console.error('❌ No unit found for this church');
            process.exit(1);
        }
        console.log(`✅ Found unit: ${unit.name}`);
        // Get first bavanakutayima of this unit
        const bavanakutayima = await Bavanakutayima_1.default.findOne({ unitId: unit._id });
        if (!bavanakutayima) {
            console.error('❌ No bavanakutayima found for this unit');
            process.exit(1);
        }
        console.log(`✅ Found bavanakutayima: ${bavanakutayima.name}`);
        // Get first house of this bavanakutayima
        const house = await House_1.default.findOne({ bavanakutayimaId: bavanakutayima._id });
        if (!house) {
            console.error('❌ No house found for this bavanakutayima');
            process.exit(1);
        }
        console.log(`✅ Found house: ${house.familyName}`);
        // Find or create George as a Member
        let george = await Member_1.default.findOne({ email: 'george.mathew@email.com' });
        if (!george) {
            console.log('⚠️  George not found, creating new member...');
            // Get the next member number
            const lastMember = await Member_1.default.findOne({ churchId: church._id }).sort({ memberNumber: -1 });
            const memberNumber = lastMember ? lastMember.memberNumber + 1 : 1;
            // Generate uniqueId
            const uniqueId = `${church.uniqueId}-${unit.uniqueId.split('-').pop()}-${bavanakutayima.uniqueId.split('-').pop()}-${house.uniqueId.split('-').pop()}-M${String(memberNumber).padStart(3, '0')}`;
            george = await Member_1.default.create({
                churchId: church._id,
                unitId: unit._id,
                bavanakutayimaId: bavanakutayima._id,
                houseId: house._id,
                memberNumber,
                uniqueId,
                firstName: 'George',
                lastName: 'Mathew',
                email: 'george.mathew@email.com',
                gender: 'male',
                relationToHead: 'head',
                role: 'member',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true
                }
            });
            console.log('✅ Created new member: George Mathew');
        }
        else {
            console.log(`✅ Found existing member: ${george.firstName} ${george.lastName}`);
            // Update George's profile with the IDs
            george.churchId = church._id;
            george.unitId = unit._id;
            george.bavanakutayimaId = bavanakutayima._id;
            george.houseId = house._id;
            await george.save();
            console.log('✅ Updated existing member profile');
        }
        // Also create/update User account for George (for login)
        let georgeUser = await User_1.default.findOne({ email: 'george.mathew@email.com' });
        if (!georgeUser) {
            georgeUser = await User_1.default.create({
                username: 'george.mathew',
                email: 'george.mathew@email.com',
                password: 'password123', // Will be hashed by the model
                role: 'member',
                churchId: church._id,
                unitId: unit._id,
                bavanakutayimaId: bavanakutayima._id,
                memberId: george._id,
                isActive: true
            });
            console.log('✅ Created user account for George');
        }
        else {
            georgeUser.churchId = church._id;
            georgeUser.unitId = unit._id;
            georgeUser.bavanakutayimaId = bavanakutayima._id;
            georgeUser.memberId = george._id;
            await georgeUser.save();
            console.log('✅ Updated user account for George');
        }
        console.log('\n✅ Successfully set up George\'s profile!');
        console.log('\n📋 George\'s Details:');
        console.log(`   Name: ${george.firstName} ${george.lastName}`);
        console.log(`   Email: ${george.email}`);
        console.log(`   Unique ID: ${george.uniqueId}`);
        console.log(`   Church: ${church.name}`);
        console.log(`   Unit: ${unit.name}`);
        console.log(`   Bavanakutayima: ${bavanakutayima.name}`);
        console.log(`   House: ${house.familyName}`);
        console.log(`\n🔐 Login Credentials:`);
        console.log(`   Email: george.mathew@email.com`);
        console.log(`   Password: password123`);
        console.log(`\n✅ George can now login and see all details on his member dashboard!\n`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};
createAndUpdateGeorge();
//# sourceMappingURL=createAndUpdateGeorge.js.map
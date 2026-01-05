"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
const Member_1 = __importDefault(require("./models/Member"));
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const checkGeorgeUser = async () => {
    try {
        await (0, database_1.default)();
        console.log('\n🔍 Checking George\'s User account...\n');
        // Check User collection
        const user = await User_1.default.findOne({ email: 'george.mathew@email.com' });
        if (!user) {
            console.log('❌ No User found with email: george.mathew@email.com');
            console.log('\n📋 All users in database:');
            const allUsers = await User_1.default.find({}).select('email username role');
            allUsers.forEach(u => {
                console.log(`   - ${u.email} (${u.username}) - Role: ${u.role}`);
            });
        }
        else {
            console.log('✅ User found!');
            console.log(`   ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Church ID: ${user.churchId}`);
            console.log(`   Unit ID: ${user.unitId}`);
            console.log(`   Member ID: ${user.memberId}`);
            console.log(`   Is Active: ${user.isActive}`);
            console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
            // Check if linked Member exists
            if (user.memberId) {
                const member = await Member_1.default.findById(user.memberId);
                if (member) {
                    console.log('\n✅ Linked Member found!');
                    console.log(`   Name: ${member.firstName} ${member.lastName}`);
                    console.log(`   Email: ${member.email}`);
                }
                else {
                    console.log('\n❌ Linked Member not found!');
                }
            }
            else {
                console.log('\n⚠️  No memberId linked to User');
            }
            // Test password comparison
            console.log('\n🔐 Testing password...');
            try {
                const userWithPassword = await User_1.default.findOne({ email: 'george.mathew@email.com' }).select('+password');
                if (userWithPassword) {
                    const isMatch = await userWithPassword.comparePassword('password123');
                    console.log(`   Password 'password123' match: ${isMatch ? '✅ Yes' : '❌ No'}`);
                }
            }
            catch (err) {
                console.log('   ❌ Error testing password:', err);
            }
        }
        console.log('\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};
checkGeorgeUser();
//# sourceMappingURL=checkGeorgeUser.js.map
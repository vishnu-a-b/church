"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const fixGeorgePassword = async () => {
    try {
        await (0, database_1.default)();
        console.log('\n🔧 Fixing George\'s password...\n');
        const user = await User_1.default.findOne({ email: 'george.mathew@email.com' }).select('+password');
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }
        console.log('✅ User found:', user.email);
        // Set the password - the pre-save hook will hash it
        user.password = 'password123';
        await user.save();
        console.log('✅ Password updated successfully!');
        // Verify the password works
        const updatedUser = await User_1.default.findOne({ email: 'george.mathew@email.com' }).select('+password');
        if (updatedUser) {
            const isMatch = await updatedUser.comparePassword('password123');
            console.log(`✅ Password verification: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
        }
        console.log('\n📋 Login Credentials:');
        console.log('   Email: george.mathew@email.com');
        console.log('   Password: password123');
        console.log('   Login URL: http://localhost:3000/member');
        console.log('\n✅ George can now log in!\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};
fixGeorgePassword();
//# sourceMappingURL=fixGeorgePassword.js.map
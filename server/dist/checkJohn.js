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
const checkJohn = async () => {
    try {
        await (0, database_1.default)();
        console.log('\n🔍 Checking for john.thomas@email.com...\n');
        const user = await User_1.default.findOne({ email: 'john.thomas@email.com' });
        const member = await Member_1.default.findOne({ email: 'john.thomas@email.com' });
        if (!user && !member) {
            console.log('❌ john.thomas@email.com does NOT exist');
            console.log('\n✅ Available accounts:');
            console.log('   Email: george.mathew@email.com');
            console.log('   Password: password123');
        }
        else {
            console.log('✅ Found account for john.thomas@email.com');
            if (user)
                console.log('   User ID:', user._id);
            if (member)
                console.log('   Member ID:', member._id);
        }
        console.log('\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};
checkJohn();
//# sourceMappingURL=checkJohn.js.map
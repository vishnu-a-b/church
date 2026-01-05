"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const Member_1 = __importDefault(require("./models/Member"));
const Church_1 = __importDefault(require("./models/Church"));
const Unit_1 = __importDefault(require("./models/Unit"));
const Bavanakutayima_1 = __importDefault(require("./models/Bavanakutayima"));
const House_1 = __importDefault(require("./models/House"));
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const updateGeorgeProfile = async () => {
    try {
        await (0, database_1.default)();
        // Find George
        const george = await Member_1.default.findOne({ email: 'george.mathew@email.com' });
        if (!george) {
            console.error('❌ User george.mathew@email.com not found');
            process.exit(1);
        }
        console.log(`✅ Found user: ${george.firstName} ${george.lastName}`);
        console.log(`   Email: ${george.email}`);
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
        // Update George's profile
        george.churchId = church._id;
        george.unitId = unit._id;
        george.bavanakutayimaId = bavanakutayima._id;
        george.houseId = house._id;
        await george.save();
        console.log('\n✅ Successfully updated George\'s profile!');
        console.log('\nUpdated Details:');
        console.log(`   Church: ${church.name}`);
        console.log(`   Unit: ${unit.name}`);
        console.log(`   Bavanakutayima: ${bavanakutayima.name}`);
        console.log(`   House: ${house.familyName}`);
        console.log(`\n✅ George can now see these details on his member dashboard!\n`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error updating George\'s profile:', error);
        process.exit(1);
    }
};
updateGeorgeProfile();
//# sourceMappingURL=updateGeorge.js.map
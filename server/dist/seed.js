"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
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
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config();
const seedDatabase = async () => {
    try {
        // Connect to database
        await (0, database_1.default)();
        console.log('🗑️  Clearing existing data...');
        // Clear existing data
        await Church_1.default.deleteMany({});
        await Unit_1.default.deleteMany({});
        await Bavanakutayima_1.default.deleteMany({});
        await House_1.default.deleteMany({});
        await Member_1.default.deleteMany({});
        await User_1.default.deleteMany({});
        await Campaign_1.default.deleteMany({});
        await Transaction_1.default.deleteMany({});
        await Wallet_1.default.deleteMany({});
        await SpiritualActivity_1.default.deleteMany({});
        console.log('🏛️  Creating Church...');
        // Create Church
        const church = await Church_1.default.create({
            churchNumber: 1,
            uniqueId: '1',
            name: 'St. Mary\'s Cathedral',
            location: 'Kochi, Kerala',
            diocese: 'Ernakulam-Angamaly Archdiocese',
            established: new Date('1990-01-15'),
            contactPerson: 'Fr. Thomas Joseph',
            phone: '9876543210',
            email: 'stmarys@cathedral.org',
            settings: {
                smsEnabled: true,
                smsProvider: 'fast2sms',
                smsSenderId: 'STMARY',
                currency: 'INR',
            },
        });
        console.log('👥 Creating Units...');
        // Create Units with hierarchical IDs
        const units = await Unit_1.default.insertMany([
            {
                churchId: church._id,
                unitNumber: 1,
                uniqueId: `${church.uniqueId}:1`,
                name: 'Sacred Heart Unit',
                unitCode: 'UNIT-001',
            },
            {
                churchId: church._id,
                unitNumber: 2,
                uniqueId: `${church.uniqueId}:2`,
                name: 'Holy Family Unit',
                unitCode: 'UNIT-002',
            },
            {
                churchId: church._id,
                unitNumber: 3,
                uniqueId: `${church.uniqueId}:3`,
                name: 'Divine Mercy Unit',
                unitCode: 'UNIT-003',
            },
        ]);
        console.log('🙏 Creating Bavanakutayimas...');
        // Create Bavanakutayimas (Prayer Groups) with hierarchical IDs
        const bavanakutayimas = await Bavanakutayima_1.default.insertMany([
            {
                unitId: units[0]._id,
                bavanakutayimaNumber: 1,
                uniqueId: `${units[0].uniqueId}:1`,
                name: 'Morning Star Prayer Group',
                leaderName: 'Sebastian Mathew',
            },
            {
                unitId: units[0]._id,
                bavanakutayimaNumber: 2,
                uniqueId: `${units[0].uniqueId}:2`,
                name: 'Holy Cross Prayer Group',
                leaderName: 'Mary Joseph',
            },
            {
                unitId: units[1]._id,
                bavanakutayimaNumber: 1,
                uniqueId: `${units[1].uniqueId}:1`,
                name: 'St. Anthony Prayer Group',
                leaderName: 'John Varghese',
            },
            {
                unitId: units[1]._id,
                bavanakutayimaNumber: 2,
                uniqueId: `${units[1].uniqueId}:2`,
                name: 'Mother Teresa Prayer Group',
                leaderName: 'Anna Thomas',
            },
            {
                unitId: units[2]._id,
                bavanakutayimaNumber: 1,
                uniqueId: `${units[2].uniqueId}:1`,
                name: 'Little Flower Prayer Group',
                leaderName: 'Joseph Abraham',
            },
        ]);
        console.log('🏠 Creating Houses...');
        // Create Houses with hierarchical IDs
        const houses = await House_1.default.insertMany([
            {
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseNumber: 1,
                uniqueId: `${bavanakutayimas[0].uniqueId}:1`,
                familyName: 'Mathew Family',
                headOfFamily: 'George Mathew',
                address: 'House No. 12, MG Road, Kochi',
                phone: '9876543211',
                houseCode: 'H-001',
            },
            {
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseNumber: 2,
                uniqueId: `${bavanakutayimas[0].uniqueId}:2`,
                familyName: 'Thomas Family',
                headOfFamily: 'Antony Thomas',
                address: 'House No. 25, Park Avenue, Kochi',
                phone: '9876543212',
                houseCode: 'H-002',
            },
            {
                bavanakutayimaId: bavanakutayimas[1]._id,
                houseNumber: 1,
                uniqueId: `${bavanakutayimas[1].uniqueId}:1`,
                familyName: 'Joseph Family',
                headOfFamily: 'Paul Joseph',
                address: 'House No. 8, Beach Road, Kochi',
                phone: '9876543213',
                houseCode: 'H-003',
            },
            {
                bavanakutayimaId: bavanakutayimas[2]._id,
                houseNumber: 1,
                uniqueId: `${bavanakutayimas[2].uniqueId}:1`,
                familyName: 'Varghese Family',
                headOfFamily: 'Jacob Varghese',
                address: 'House No. 45, Church Street, Kochi',
                phone: '9876543214',
                houseCode: 'H-004',
            },
            {
                bavanakutayimaId: bavanakutayimas[3]._id,
                houseNumber: 1,
                uniqueId: `${bavanakutayimas[3].uniqueId}:1`,
                familyName: 'Abraham Family',
                headOfFamily: 'Simon Abraham',
                address: 'House No. 33, Hill View, Kochi',
                phone: '9876543215',
                houseCode: 'H-005',
            },
            {
                bavanakutayimaId: bavanakutayimas[4]._id,
                houseNumber: 1,
                uniqueId: `${bavanakutayimas[4].uniqueId}:1`,
                familyName: 'Samuel Family',
                headOfFamily: 'David Samuel',
                address: 'House No. 19, Lake Side, Kochi',
                phone: '9876543216',
                houseCode: 'H-006',
            },
            {
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseNumber: 3,
                uniqueId: `${bavanakutayimas[0].uniqueId}:3`,
                familyName: 'Kurian Family',
                headOfFamily: 'Thomas Kurian',
                address: 'House No. 45, Marine Drive, Kochi',
                phone: '9876543217',
                houseCode: 'H-007',
            },
            {
                bavanakutayimaId: bavanakutayimas[1]._id,
                houseNumber: 2,
                uniqueId: `${bavanakutayimas[1].uniqueId}:2`,
                familyName: 'Xavier Family',
                headOfFamily: 'Francis Xavier',
                address: 'House No. 78, Fort Road, Kochi',
                phone: '9876543218',
                houseCode: 'H-008',
            },
            {
                bavanakutayimaId: bavanakutayimas[2]._id,
                houseNumber: 2,
                uniqueId: `${bavanakutayimas[2].uniqueId}:2`,
                familyName: 'Philip Family',
                headOfFamily: 'James Philip',
                address: 'House No. 32, Broadway, Kochi',
                phone: '9876543219',
                houseCode: 'H-009',
            },
            {
                bavanakutayimaId: bavanakutayimas[3]._id,
                houseNumber: 2,
                uniqueId: `${bavanakutayimas[3].uniqueId}:2`,
                familyName: 'Andrews Family',
                headOfFamily: 'Michael Andrews',
                address: 'House No. 56, Sunset Avenue, Kochi',
                phone: '9876543220',
                houseCode: 'H-010',
            },
        ]);
        console.log('👨‍👩‍👧‍👦 Creating Members...');
        // Create Members for each house
        const members = await Member_1.default.insertMany([
            // Mathew Family
            {
                houseId: houses[0]._id,
                memberNumber: 1,
                uniqueId: `${houses[0].uniqueId}:1`,
                firstName: 'George',
                lastName: 'Mathew',
                dateOfBirth: new Date('1970-05-10'),
                gender: 'male',
                phone: '9876543211', email: 'george.mathew@email.com',
                baptismName: 'George',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[0]._id,
                memberNumber: 2,
                uniqueId: `${houses[0].uniqueId}:2`,
                firstName: 'Maria',
                lastName: 'Mathew',
                dateOfBirth: new Date('1975-08-20'),
                gender: 'female',
                phone: '9876543221', email: 'maria.mathew@email.com',
                baptismName: 'Maria',
                relationToHead: 'spouse',
                isActive: true,
            },
            {
                houseId: houses[0]._id,
                memberNumber: 3,
                uniqueId: `${houses[0].uniqueId}:3`,
                firstName: 'John',
                lastName: 'Mathew',
                dateOfBirth: new Date('2000-03-15'),
                gender: 'male',
                phone: '9876543231', email: 'john.mathew@email.com',
                baptismName: 'John',
                relationToHead: 'child',
                isActive: true,
            },
            {
                houseId: houses[0]._id,
                memberNumber: 4,
                uniqueId: `${houses[0].uniqueId}:4`,
                firstName: 'Sarah',
                lastName: 'Mathew',
                dateOfBirth: new Date('2005-11-22'),
                gender: 'female',
                phone: '9876543241',
                baptismName: 'Sarah',
                relationToHead: 'child',
                isActive: true,
            },
            // Thomas Family
            {
                houseId: houses[1]._id,
                memberNumber: 1,
                uniqueId: `${houses[1].uniqueId}:1`,
                firstName: 'Antony',
                lastName: 'Thomas',
                dateOfBirth: new Date('1968-02-14'),
                gender: 'male',
                phone: '9876543212', email: 'antony.thomas@email.com',
                baptismName: 'Antony',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[1]._id,
                memberNumber: 2,
                uniqueId: `${houses[1].uniqueId}:2`,
                firstName: 'Elizabeth',
                lastName: 'Thomas',
                dateOfBirth: new Date('1972-06-30'),
                gender: 'female',
                phone: '9876543222', email: 'elizabeth.thomas@email.com',
                baptismName: 'Elizabeth',
                relationToHead: 'spouse',
                isActive: true,
            },
            {
                houseId: houses[1]._id,
                memberNumber: 3,
                uniqueId: `${houses[1].uniqueId}:3`,
                firstName: 'Peter',
                lastName: 'Thomas',
                dateOfBirth: new Date('1998-09-05'),
                gender: 'male',
                phone: '9876543232', email: 'peter.thomas@email.com',
                baptismName: 'Peter',
                relationToHead: 'child',
                isActive: true,
            },
            // Joseph Family
            {
                houseId: houses[2]._id,
                memberNumber: 1,
                uniqueId: `${houses[2].uniqueId}:1`,
                firstName: 'Paul',
                lastName: 'Joseph',
                dateOfBirth: new Date('1965-12-25'),
                gender: 'male',
                phone: '9876543213', email: 'paul.joseph@email.com',
                baptismName: 'Paul',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[2]._id,
                memberNumber: 2,
                uniqueId: `${houses[2].uniqueId}:2`,
                firstName: 'Anna',
                lastName: 'Joseph',
                dateOfBirth: new Date('1970-04-18'),
                gender: 'female',
                phone: '9876543223', email: 'anna.joseph@email.com',
                baptismName: 'Anna',
                relationToHead: 'spouse',
                isActive: true,
            },
            {
                houseId: houses[2]._id,
                memberNumber: 3,
                uniqueId: `${houses[2].uniqueId}:3`,
                firstName: 'Grace',
                lastName: 'Joseph',
                dateOfBirth: new Date('2002-07-12'),
                gender: 'female',
                phone: '9876543233', email: 'grace.joseph@email.com',
                baptismName: 'Grace',
                relationToHead: 'child',
                isActive: true,
            },
            // Varghese Family
            {
                houseId: houses[3]._id,
                memberNumber: 1,
                uniqueId: `${houses[3].uniqueId}:1`,
                firstName: 'Jacob',
                lastName: 'Varghese',
                dateOfBirth: new Date('1973-01-08'),
                gender: 'male',
                phone: '9876543214', email: 'jacob.varghese@email.com',
                baptismName: 'Jacob',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[3]._id,
                memberNumber: 2,
                uniqueId: `${houses[3].uniqueId}:2`,
                firstName: 'Rachel',
                lastName: 'Varghese',
                dateOfBirth: new Date('1978-10-16'),
                gender: 'female',
                phone: '9876543224', email: 'rachel.varghese@email.com',
                baptismName: 'Rachel',
                relationToHead: 'spouse',
                isActive: true,
            },
            // Abraham Family
            {
                houseId: houses[4]._id,
                memberNumber: 1,
                uniqueId: `${houses[4].uniqueId}:1`,
                firstName: 'Simon',
                lastName: 'Abraham',
                dateOfBirth: new Date('1976-03-22'),
                gender: 'male',
                phone: '9876543215', email: 'simon.abraham@email.com',
                baptismName: 'Simon',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[4]._id,
                memberNumber: 2,
                uniqueId: `${houses[4].uniqueId}:2`,
                firstName: 'Esther',
                lastName: 'Abraham',
                dateOfBirth: new Date('1980-11-05'),
                gender: 'female',
                phone: '9876543225', email: 'esther.abraham@email.com',
                baptismName: 'Esther',
                relationToHead: 'spouse',
                isActive: true,
            },
            {
                houseId: houses[4]._id,
                memberNumber: 3,
                uniqueId: `${houses[4].uniqueId}:3`,
                firstName: 'Joshua',
                lastName: 'Abraham',
                dateOfBirth: new Date('2003-05-28'),
                gender: 'male',
                phone: '9876543235', email: 'joshua.abraham@email.com',
                baptismName: 'Joshua',
                relationToHead: 'child',
                isActive: true,
            },
            // Samuel Family
            {
                houseId: houses[5]._id,
                memberNumber: 1,
                uniqueId: `${houses[5].uniqueId}:1`,
                firstName: 'David',
                lastName: 'Samuel',
                dateOfBirth: new Date('1969-07-14'),
                gender: 'male',
                phone: '9876543216', email: 'david.samuel@email.com',
                baptismName: 'David',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[5]._id,
                memberNumber: 2,
                uniqueId: `${houses[5].uniqueId}:2`,
                firstName: 'Ruth',
                lastName: 'Samuel',
                dateOfBirth: new Date('1974-09-03'),
                gender: 'female',
                phone: '9876543226', email: 'ruth.samuel@email.com',
                baptismName: 'Ruth',
                relationToHead: 'spouse',
                isActive: true,
            },
            {
                houseId: houses[5]._id,
                memberNumber: 3,
                uniqueId: `${houses[5].uniqueId}:3`,
                firstName: 'Samuel',
                lastName: 'Samuel',
                dateOfBirth: new Date('1999-12-19'),
                gender: 'male',
                phone: '9876543236', email: 'samuel.samuel@email.com',
                baptismName: 'Samuel',
                relationToHead: 'child',
                isActive: true,
            },
            // Kurian Family - House 1:1:1:3 (House 6)
            {
                houseId: houses[6]._id,
                memberNumber: 1,
                uniqueId: `${houses[6].uniqueId}:1`,
                firstName: 'Thomas',
                lastName: 'Kurian',
                dateOfBirth: new Date('1972-08-12'),
                gender: 'male',
                phone: '9876543217',
                email: 'thomas.kurian@email.com',
                baptismName: 'Thomas',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[6]._id,
                memberNumber: 2,
                uniqueId: `${houses[6].uniqueId}:2`,
                firstName: 'Susan',
                lastName: 'Kurian',
                dateOfBirth: new Date('1975-03-18'),
                gender: 'female',
                phone: '9876543227',
                email: 'susan.kurian@email.com',
                baptismName: 'Susan',
                relationToHead: 'spouse',
                isActive: true,
            },
            {
                houseId: houses[6]._id,
                memberNumber: 3,
                uniqueId: `${houses[6].uniqueId}:3`,
                firstName: 'Matthew',
                lastName: 'Kurian',
                dateOfBirth: new Date('2001-06-25'),
                gender: 'male',
                phone: '9876543237',
                baptismName: 'Matthew',
                relationToHead: 'child',
                isActive: true,
            },
            // Xavier Family - House 1:1:2:2 (House 7)
            {
                houseId: houses[7]._id,
                memberNumber: 1,
                uniqueId: `${houses[7].uniqueId}:1`,
                firstName: 'Francis',
                lastName: 'Xavier',
                dateOfBirth: new Date('1967-11-03'),
                gender: 'male',
                phone: '9876543218',
                email: 'francis.xavier@email.com',
                baptismName: 'Francis',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[7]._id,
                memberNumber: 2,
                uniqueId: `${houses[7].uniqueId}:2`,
                firstName: 'Teresa',
                lastName: 'Xavier',
                dateOfBirth: new Date('1970-09-15'),
                gender: 'female',
                phone: '9876543228',
                email: 'teresa.xavier@email.com',
                baptismName: 'Teresa',
                relationToHead: 'spouse',
                isActive: true,
            },
            {
                houseId: houses[7]._id,
                memberNumber: 3,
                uniqueId: `${houses[7].uniqueId}:3`,
                firstName: 'Luke',
                lastName: 'Xavier',
                dateOfBirth: new Date('1995-04-20'),
                gender: 'male',
                phone: '9876543238',
                email: 'luke.xavier@email.com',
                baptismName: 'Luke',
                relationToHead: 'child',
                isActive: true,
            },
            {
                houseId: houses[7]._id,
                memberNumber: 4,
                uniqueId: `${houses[7].uniqueId}:4`,
                firstName: 'Martha',
                lastName: 'Xavier',
                dateOfBirth: new Date('1998-12-10'),
                gender: 'female',
                phone: '9876543248',
                baptismName: 'Martha',
                relationToHead: 'child',
                isActive: true,
            },
            // Philip Family - House 1:2:1:2 (House 8)
            {
                houseId: houses[8]._id,
                memberNumber: 1,
                uniqueId: `${houses[8].uniqueId}:1`,
                firstName: 'James',
                lastName: 'Philip',
                dateOfBirth: new Date('1974-02-28'),
                gender: 'male',
                phone: '9876543219',
                email: 'james.philip@email.com',
                baptismName: 'James',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[8]._id,
                memberNumber: 2,
                uniqueId: `${houses[8].uniqueId}:2`,
                firstName: 'Rebecca',
                lastName: 'Philip',
                dateOfBirth: new Date('1978-07-14'),
                gender: 'female',
                phone: '9876543229',
                email: 'rebecca.philip@email.com',
                baptismName: 'Rebecca',
                relationToHead: 'spouse',
                isActive: true,
            },
            // Andrews Family - House 1:2:2:2 (House 9)
            {
                houseId: houses[9]._id,
                memberNumber: 1,
                uniqueId: `${houses[9].uniqueId}:1`,
                firstName: 'Michael',
                lastName: 'Andrews',
                dateOfBirth: new Date('1969-05-22'),
                gender: 'male',
                phone: '9876543220',
                email: 'michael.andrews@email.com',
                baptismName: 'Michael',
                relationToHead: 'head',
                isActive: true,
            },
            {
                houseId: houses[9]._id,
                memberNumber: 2,
                uniqueId: `${houses[9].uniqueId}:2`,
                firstName: 'Catherine',
                lastName: 'Andrews',
                dateOfBirth: new Date('1973-01-08'),
                gender: 'female',
                phone: '9876543230',
                email: 'catherine.andrews@email.com',
                baptismName: 'Catherine',
                relationToHead: 'spouse',
                isActive: true,
            },
            {
                houseId: houses[9]._id,
                memberNumber: 3,
                uniqueId: `${houses[9].uniqueId}:3`,
                firstName: 'Daniel',
                lastName: 'Andrews',
                dateOfBirth: new Date('2000-10-15'),
                gender: 'male',
                phone: '9876543239',
                baptismName: 'Daniel',
                relationToHead: 'child',
                isActive: true,
            },
            {
                houseId: houses[9]._id,
                memberNumber: 4,
                uniqueId: `${houses[9].uniqueId}:4`,
                firstName: 'Emily',
                lastName: 'Andrews',
                dateOfBirth: new Date('2004-03-30'),
                gender: 'female',
                phone: '9876543249',
                baptismName: 'Emily',
                relationToHead: 'child',
                isActive: true,
            },
        ]);
        console.log('👤 Creating Users...');
        // Create Users (using .create() instead of .insertMany() to trigger password hashing middleware)
        const users = [];
        const adminUser = await User_1.default.create({
            username: 'admin',
            email: 'admin@church.org',
            password: 'admin123',
            role: 'super_admin',
            churchId: church._id,
            isActive: true,
        });
        users.push(adminUser);
        const churchAdmin = await User_1.default.create({
            username: 'churchadmin',
            email: 'churchadmin@church.org',
            password: 'church123',
            role: 'church_admin',
            churchId: church._id,
            isActive: true,
        });
        users.push(churchAdmin);
        const unit1Admin = await User_1.default.create({
            username: 'unit1admin',
            email: 'unit1@church.org',
            password: 'unit123',
            role: 'unit_admin',
            churchId: church._id,
            unitId: units[0]._id,
            isActive: true,
        });
        users.push(unit1Admin);
        const unit2Admin = await User_1.default.create({
            username: 'unit2admin',
            email: 'unit2@church.org',
            password: 'unit123',
            role: 'unit_admin',
            churchId: church._id,
            unitId: units[1]._id,
            isActive: true,
        });
        users.push(unit2Admin);
        const kutayimaAdmin1 = await User_1.default.create({
            username: 'kutayima1admin',
            email: 'kutayima1@church.org',
            password: 'kutayima123',
            role: 'kudumbakutayima_admin',
            churchId: church._id,
            unitId: units[0]._id,
            bavanakutayimaId: bavanakutayimas[0]._id,
            isActive: true,
        });
        users.push(kutayimaAdmin1);
        const kutayimaAdmin2 = await User_1.default.create({
            username: 'kutayima2admin',
            email: 'kutayima2@church.org',
            password: 'kutayima123',
            role: 'kudumbakutayima_admin',
            churchId: church._id,
            unitId: units[0]._id,
            bavanakutayimaId: bavanakutayimas[1]._id,
            isActive: true,
        });
        users.push(kutayimaAdmin2);
        const memberUser = await User_1.default.create({
            username: 'george',
            email: 'george.mathew@email.com',
            password: 'member123',
            role: 'member',
            churchId: church._id,
            unitId: units[0]._id,
            memberId: members[0]._id,
            isActive: true,
        });
        users.push(memberUser);
        console.log('📅 Creating Campaigns...');
        // Create Campaigns
        const campaigns = await Campaign_1.default.insertMany([
            {
                churchId: church._id,
                campaignType: 'stothrakazhcha',
                name: 'Christmas Stothrakazhcha 2024',
                description: 'Annual Christmas contribution campaign',
                fixedAmount: 500,
                amountType: 'per_house',
                startDate: new Date('2024-11-01'),
                endDate: new Date('2024-12-24'),
                dueDate: new Date('2024-12-20'),
                isActive: true,
                totalCollected: 0,
                participantCount: 0,
                createdBy: users[0]._id,
            },
            {
                churchId: church._id,
                campaignType: 'spl_contribution',
                name: 'Church Renovation Fund',
                description: 'Special contribution for church renovation',
                fixedAmount: 1000,
                amountType: 'per_house',
                startDate: new Date('2024-10-01'),
                endDate: new Date('2025-03-31'),
                dueDate: new Date('2025-03-15'),
                isActive: true,
                totalCollected: 0,
                participantCount: 0,
                createdBy: users[0]._id,
            },
            {
                churchId: church._id,
                campaignType: 'stothrakazhcha',
                name: 'Easter Stothrakazhcha 2025',
                description: 'Annual Easter contribution campaign',
                fixedAmount: 300,
                amountType: 'per_member',
                startDate: new Date('2025-03-01'),
                endDate: new Date('2025-04-20'),
                dueDate: new Date('2025-04-15'),
                isActive: false,
                totalCollected: 0,
                participantCount: 0,
                createdBy: users[0]._id,
            },
        ]);
        console.log('💰 Creating Transactions...');
        // Create some sample transactions
        const transactions = await Transaction_1.default.insertMany([
            // Lelam (Auction) transactions
            {
                receiptNumber: 'RCP-2024-001',
                transactionType: 'lelam',
                contributionMode: 'variable',
                distribution: 'house_only',
                houseAmount: 5000,
                totalAmount: 5000,
                houseId: houses[0]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-15'),
                paymentMethod: 'cash',
                notes: 'Annual Christmas Lelam',
                createdBy: users[1]._id,
            },
            {
                receiptNumber: 'RCP-2024-002',
                transactionType: 'lelam',
                contributionMode: 'variable',
                distribution: 'house_only',
                houseAmount: 3500,
                totalAmount: 3500,
                houseId: houses[1]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-15'),
                paymentMethod: 'upi',
                notes: 'Annual Christmas Lelam',
                createdBy: users[1]._id,
            },
            // Thirunnaal Panam (Festival Contribution)
            {
                receiptNumber: 'RCP-2024-003',
                transactionType: 'thirunnaal_panam',
                contributionMode: 'variable',
                distribution: 'member_only',
                memberAmount: 200,
                totalAmount: 200,
                memberId: members[0]._id,
                houseId: houses[0]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-20'),
                paymentMethod: 'cash',
                notes: 'Christmas festival contribution',
                createdBy: users[1]._id,
            },
            {
                receiptNumber: 'RCP-2024-004',
                transactionType: 'thirunnaal_panam',
                contributionMode: 'variable',
                distribution: 'member_only',
                memberAmount: 150,
                totalAmount: 150,
                memberId: members[1]._id,
                houseId: houses[0]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-20'),
                paymentMethod: 'cash',
                notes: 'Christmas festival contribution',
                createdBy: users[1]._id,
            },
            // Dashamansham (Tithe)
            {
                receiptNumber: 'RCP-2024-005',
                transactionType: 'dashamansham',
                contributionMode: 'variable',
                distribution: 'house_only',
                houseAmount: 2000,
                totalAmount: 2000,
                houseId: houses[0]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-01'),
                paymentMethod: 'bank_transfer',
                notes: 'Monthly tithe - November',
                createdBy: users[1]._id,
            },
            {
                receiptNumber: 'RCP-2024-006',
                transactionType: 'dashamansham',
                contributionMode: 'variable',
                distribution: 'house_only',
                houseAmount: 1500,
                totalAmount: 1500,
                houseId: houses[1]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-01'),
                paymentMethod: 'upi',
                notes: 'Monthly tithe - November',
                createdBy: users[1]._id,
            },
            // Campaign contributions
            {
                receiptNumber: 'RCP-2024-007',
                transactionType: 'stothrakazhcha',
                contributionMode: 'fixed',
                campaignId: campaigns[0]._id,
                distribution: 'house_only',
                houseAmount: 500,
                totalAmount: 500,
                houseId: houses[0]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-25'),
                paymentMethod: 'cash',
                notes: 'Christmas Stothrakazhcha contribution',
                createdBy: users[1]._id,
            },
            {
                receiptNumber: 'RCP-2024-008',
                transactionType: 'stothrakazhcha',
                contributionMode: 'fixed',
                campaignId: campaigns[0]._id,
                distribution: 'house_only',
                houseAmount: 500,
                totalAmount: 500,
                houseId: houses[1]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-26'),
                paymentMethod: 'upi',
                notes: 'Christmas Stothrakazhcha contribution',
                createdBy: users[1]._id,
            },
            {
                receiptNumber: 'RCP-2024-009',
                transactionType: 'spl_contribution',
                contributionMode: 'fixed',
                campaignId: campaigns[1]._id,
                distribution: 'house_only',
                houseAmount: 1000,
                totalAmount: 1000,
                houseId: houses[2]._id,
                unitId: units[1]._id,
                churchId: church._id,
                paymentDate: new Date('2024-10-15'),
                paymentMethod: 'cheque',
                notes: 'Church renovation contribution',
                createdBy: users[2]._id,
            },
            // Mixed distribution transactions
            {
                receiptNumber: 'RCP-2024-010',
                transactionType: 'spl_contribution',
                contributionMode: 'variable',
                distribution: 'both',
                memberAmount: 200,
                houseAmount: 800,
                totalAmount: 1000,
                memberId: members[0]._id,
                houseId: houses[0]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-28'),
                paymentMethod: 'cash',
                notes: 'Special offering for parish feast',
                createdBy: users[1]._id,
            },
            // New families transactions
            {
                receiptNumber: 'RCP-2024-011',
                transactionType: 'dashamansham',
                contributionMode: 'variable',
                distribution: 'house_only',
                houseAmount: 1800,
                totalAmount: 1800,
                houseId: houses[6]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-05'),
                paymentMethod: 'upi',
                notes: 'Monthly tithe - November',
                createdBy: users[1]._id,
            },
            {
                receiptNumber: 'RCP-2024-012',
                transactionType: 'lelam',
                contributionMode: 'variable',
                distribution: 'house_only',
                houseAmount: 4200,
                totalAmount: 4200,
                houseId: houses[7]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-15'),
                paymentMethod: 'bank_transfer',
                notes: 'Annual Christmas Lelam',
                createdBy: users[1]._id,
            },
            {
                receiptNumber: 'RCP-2024-013',
                transactionType: 'thirunnaal_panam',
                contributionMode: 'variable',
                distribution: 'member_only',
                memberAmount: 250,
                totalAmount: 250,
                memberId: members[18]._id,
                houseId: houses[6]._id,
                unitId: units[0]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-22'),
                paymentMethod: 'cash',
                notes: 'Christmas festival contribution',
                createdBy: users[1]._id,
            },
            {
                receiptNumber: 'RCP-2024-014',
                transactionType: 'stothrakazhcha',
                contributionMode: 'fixed',
                campaignId: campaigns[0]._id,
                distribution: 'house_only',
                houseAmount: 500,
                totalAmount: 500,
                houseId: houses[8]._id,
                unitId: units[1]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-27'),
                paymentMethod: 'upi',
                notes: 'Christmas Stothrakazhcha contribution',
                createdBy: users[2]._id,
            },
            {
                receiptNumber: 'RCP-2024-015',
                transactionType: 'dashamansham',
                contributionMode: 'variable',
                distribution: 'house_only',
                houseAmount: 2200,
                totalAmount: 2200,
                houseId: houses[9]._id,
                unitId: units[1]._id,
                churchId: church._id,
                paymentDate: new Date('2024-11-08'),
                paymentMethod: 'cheque',
                notes: 'Monthly tithe - November',
                createdBy: users[2]._id,
            },
        ]);
        // Update campaign statistics
        await Campaign_1.default.findByIdAndUpdate(campaigns[0]._id, {
            totalCollected: 1000,
            participantCount: 2,
        });
        await Campaign_1.default.findByIdAndUpdate(campaigns[1]._id, {
            totalCollected: 1000,
            participantCount: 1,
        });
        console.log('💳 Creating Wallets...');
        // Create Wallets for members and houses
        const wallets = [];
        // Member wallets
        for (const member of members) {
            const memberTransactions = transactions.filter((t) => t.memberId?.toString() === member._id.toString());
            let balance = 0;
            const walletTransactions = memberTransactions.map((t) => {
                balance += t.memberAmount || 0;
                return {
                    transactionId: t._id,
                    amount: t.memberAmount || 0,
                    type: t.transactionType,
                    date: t.paymentDate,
                };
            });
            wallets.push({
                walletType: 'member',
                ownerId: member._id,
                ownerModel: 'Member',
                ownerName: `${member.firstName} ${member.lastName}`,
                balance: balance,
                transactions: walletTransactions,
            });
        }
        // House wallets
        for (const house of houses) {
            const houseTransactions = transactions.filter((t) => t.houseId?.toString() === house._id.toString());
            let balance = 0;
            const walletTransactions = houseTransactions.map((t) => {
                balance += t.houseAmount || 0;
                return {
                    transactionId: t._id,
                    amount: t.houseAmount || 0,
                    type: t.transactionType,
                    date: t.paymentDate,
                };
            });
            wallets.push({
                walletType: 'house',
                ownerId: house._id,
                ownerModel: 'House',
                ownerName: house.familyName,
                balance: balance,
                transactions: walletTransactions,
            });
        }
        await Wallet_1.default.insertMany(wallets);
        console.log('⛪ Creating Spiritual Activities...');
        // Create Spiritual Activities for members
        const spiritualActivities = [];
        // Mass attendance records for first week of December
        spiritualActivities.push({
            memberId: members[0]._id,
            activityType: 'mass',
            massDate: new Date('2024-12-01'),
            massAttended: true,
            selfReported: true,
            reportedAt: new Date('2024-12-01'),
        });
        spiritualActivities.push({
            memberId: members[1]._id,
            activityType: 'mass',
            massDate: new Date('2024-12-01'),
            massAttended: true,
            selfReported: true,
            reportedAt: new Date('2024-12-01'),
        });
        spiritualActivities.push({
            memberId: members[4]._id,
            activityType: 'mass',
            massDate: new Date('2024-12-01'),
            massAttended: true,
            selfReported: true,
            reportedAt: new Date('2024-12-01'),
        });
        // Fasting records for Advent
        spiritualActivities.push({
            memberId: members[0]._id,
            activityType: 'fasting',
            fastingWeek: '2024-W48',
            fastingDays: ['monday', 'wednesday', 'friday'],
            selfReported: true,
            reportedAt: new Date('2024-11-30'),
        });
        spiritualActivities.push({
            memberId: members[1]._id,
            activityType: 'fasting',
            fastingWeek: '2024-W48',
            fastingDays: ['wednesday', 'friday'],
            selfReported: true,
            reportedAt: new Date('2024-11-30'),
        });
        spiritualActivities.push({
            memberId: members[7]._id,
            activityType: 'fasting',
            fastingWeek: '2024-W48',
            fastingDays: ['friday'],
            selfReported: true,
            reportedAt: new Date('2024-11-30'),
        });
        // Prayer records
        spiritualActivities.push({
            memberId: members[0]._id,
            activityType: 'prayer',
            prayerType: 'rosary',
            prayerCount: 7,
            prayerWeek: '2024-W48',
            selfReported: true,
            reportedAt: new Date('2024-11-30'),
        });
        spiritualActivities.push({
            memberId: members[1]._id,
            activityType: 'prayer',
            prayerType: 'divine_mercy',
            prayerCount: 5,
            prayerWeek: '2024-W48',
            selfReported: true,
            reportedAt: new Date('2024-11-30'),
        });
        spiritualActivities.push({
            memberId: members[4]._id,
            activityType: 'prayer',
            prayerType: 'rosary',
            prayerCount: 6,
            prayerWeek: '2024-W48',
            selfReported: true,
            reportedAt: new Date('2024-11-30'),
        });
        spiritualActivities.push({
            memberId: members[7]._id,
            activityType: 'prayer',
            prayerType: 'stations',
            prayerCount: 3,
            prayerWeek: '2024-W48',
            selfReported: true,
            reportedAt: new Date('2024-11-30'),
        });
        // Second week activities
        spiritualActivities.push({
            memberId: members[0]._id,
            activityType: 'mass',
            massDate: new Date('2024-12-08'),
            massAttended: true,
            selfReported: true,
            reportedAt: new Date('2024-12-08'),
        });
        spiritualActivities.push({
            memberId: members[2]._id,
            activityType: 'fasting',
            fastingWeek: '2024-W49',
            fastingDays: ['wednesday', 'friday'],
            selfReported: true,
            reportedAt: new Date('2024-12-07'),
        });
        await SpiritualActivity_1.default.insertMany(spiritualActivities);
        console.log('\n✅ Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Churches: 1`);
        console.log(`   Units: ${units.length}`);
        console.log(`   Bavanakutayimas: ${bavanakutayimas.length}`);
        console.log(`   Houses: ${houses.length}`);
        console.log(`   Members: ${members.length}`);
        console.log(`   Users: ${users.length}`);
        console.log(`   Campaigns: ${campaigns.length}`);
        console.log(`   Transactions: ${transactions.length}`);
        console.log(`   Wallets: ${wallets.length}`);
        console.log(`   Spiritual Activities: ${spiritualActivities.length}`);
        console.log('\n🔑 Login Credentials:');
        console.log('   1. Super Admin:');
        console.log('      Email: admin@church.org');
        console.log('      Password: admin123');
        console.log('   2. Church Admin:');
        console.log('      Email: churchadmin@church.org');
        console.log('      Password: church123');
        console.log('   3. Unit Admin:');
        console.log('      Unit 1: unit1@church.org / unit123');
        console.log('      Unit 2: unit2@church.org / unit123');
        console.log('   4. Kudumbakutayima Admin:');
        console.log('      Kutayima 1: kutayima1@church.org / kutayima123');
        console.log('      Kutayima 2: kutayima2@church.org / kutayima123');
        console.log('   5. Member:');
        console.log('      Email: george.mathew@email.com');
        console.log('      Password: member123');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};
seedDatabase();
//# sourceMappingURL=seed.js.map
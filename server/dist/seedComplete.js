"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
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
dotenv_1.default.config();
/**
 * Seed database with comprehensive test data
 */
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seed...\n');
        // Connect to database
        await (0, database_1.default)();
        console.log('🗑️  Clearing existing data...');
        // Clear existing data
        await Promise.all([
            Church_1.default.deleteMany({}),
            Unit_1.default.deleteMany({}),
            Bavanakutayima_1.default.deleteMany({}),
            House_1.default.deleteMany({}),
            Member_1.default.deleteMany({}),
            User_1.default.deleteMany({}),
            Campaign_1.default.deleteMany({}),
            Transaction_1.default.deleteMany({}),
            Wallet_1.default.deleteMany({}),
            SpiritualActivity_1.default.deleteMany({}),
            Stothrakazhcha_1.default.deleteMany({}),
            StothrakazhchaDue_1.default.deleteMany({}),
            News_1.default.deleteMany({}),
            Event_1.default.deleteMany({}),
        ]);
        console.log('✅ Data cleared\n');
        // ========================
        // CREATE CHURCH
        // ========================
        console.log('🏛️  Creating Church...');
        const church = await Church_1.default.create({
            churchNumber: 1,
            uniqueId: 'CH001',
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
        console.log(`   ✓ Created: ${church.name}`);
        // ========================
        // CREATE UNITS
        // ========================
        console.log('\n👥 Creating Units...');
        const units = await Unit_1.default.insertMany([
            {
                churchId: church._id,
                unitNumber: 1,
                uniqueId: 'CH001-U001',
                name: 'Sacred Heart Unit',
                unitCode: 'UNIT-001',
            },
            {
                churchId: church._id,
                unitNumber: 2,
                uniqueId: 'CH001-U002',
                name: 'Holy Family Unit',
                unitCode: 'UNIT-002',
            },
        ]);
        console.log(`   ✓ Created ${units.length} units`);
        // ========================
        // CREATE BAVANAKUTAYIMAS
        // ========================
        console.log('\n🙏 Creating Bavanakutayimas...');
        const bavanakutayimas = await Bavanakutayima_1.default.insertMany([
            {
                unitId: units[0]._id,
                bavanakutayimaNumber: 1,
                uniqueId: 'CH001-U001-B001',
                name: 'Morning Star Prayer Group',
                leaderName: 'Sebastian Mathew',
            },
            {
                unitId: units[0]._id,
                bavanakutayimaNumber: 2,
                uniqueId: 'CH001-U001-B002',
                name: 'Holy Cross Prayer Group',
                leaderName: 'Mary Joseph',
            },
            {
                unitId: units[1]._id,
                bavanakutayimaNumber: 1,
                uniqueId: 'CH001-U002-B001',
                name: 'Divine Mercy Group',
                leaderName: 'John Peter',
            },
        ]);
        console.log(`   ✓ Created ${bavanakutayimas.length} bavanakutayimas`);
        // ========================
        // CREATE HOUSES
        // ========================
        console.log('\n🏠 Creating Houses...');
        const houses = await House_1.default.insertMany([
            {
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseNumber: 1,
                uniqueId: 'CH001-U001-B001-H001',
                familyName: 'Mathew Family',
                headOfFamily: 'Thomas Mathew',
                address: '123 Church Road, Kochi',
                phone: '9876543211',
                houseCode: 'MAT-001',
            },
            {
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseNumber: 2,
                uniqueId: 'CH001-U001-B001-H002',
                familyName: 'Joseph Family',
                headOfFamily: 'John Joseph',
                address: '456 Lake View, Kochi',
                phone: '9876543212',
                houseCode: 'JOS-001',
            },
            {
                bavanakutayimaId: bavanakutayimas[1]._id,
                houseNumber: 1,
                uniqueId: 'CH001-U001-B002-H001',
                familyName: 'Peter Family',
                headOfFamily: 'Simon Peter',
                address: '789 Hill Station, Kochi',
                phone: '9876543213',
                houseCode: 'PET-001',
            },
            {
                bavanakutayimaId: bavanakutayimas[2]._id,
                houseNumber: 1,
                uniqueId: 'CH001-U002-B001-H001',
                familyName: 'Abraham Family',
                headOfFamily: 'Paul Abraham',
                address: '321 River Side, Kochi',
                phone: '9876543214',
                houseCode: 'ABR-001',
            },
        ]);
        console.log(`   ✓ Created ${houses.length} houses`);
        // ========================
        // CREATE MEMBERS
        // ========================
        console.log('\n👨‍👩‍👧‍👦 Creating Members...');
        // Use create() instead of insertMany() to trigger password hashing
        const memberData = [
            // House 1 - Mathew Family
            {
                churchId: church._id,
                unitId: units[0]._id,
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseId: houses[0]._id,
                memberNumber: 1,
                uniqueId: 'CH001-U001-B001-H001-M001',
                firstName: 'Thomas',
                lastName: 'Mathew',
                gender: 'male',
                phone: '9876543211',
                email: 'thomas@example.com',
                relationToHead: 'head',
                isActive: true,
                username: 'thomas',
                password: 'password123', // Will be hashed
                role: 'member',
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            {
                churchId: church._id,
                unitId: units[0]._id,
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseId: houses[0]._id,
                memberNumber: 2,
                uniqueId: 'CH001-U001-B001-H001-M002',
                firstName: 'Anna',
                lastName: 'Mathew',
                gender: 'female',
                phone: '9876543221',
                email: 'anna@example.com',
                relationToHead: 'spouse',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            // House 2 - Joseph Family
            {
                churchId: church._id,
                unitId: units[0]._id,
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseId: houses[1]._id,
                memberNumber: 3,
                uniqueId: 'CH001-U001-B001-H002-M001',
                firstName: 'John',
                lastName: 'Joseph',
                gender: 'male',
                phone: '9876543212',
                email: 'john@example.com',
                relationToHead: 'head',
                isActive: true,
                username: 'john',
                password: 'password123',
                role: 'member',
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            {
                churchId: church._id,
                unitId: units[0]._id,
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseId: houses[1]._id,
                memberNumber: 4,
                uniqueId: 'CH001-U001-B001-H002-M002',
                firstName: 'Mary',
                lastName: 'Joseph',
                gender: 'female',
                phone: '9876543222',
                relationToHead: 'spouse',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            // House 3 - Peter Family
            {
                churchId: church._id,
                unitId: units[0]._id,
                bavanakutayimaId: bavanakutayimas[1]._id,
                houseId: houses[2]._id,
                memberNumber: 5,
                uniqueId: 'CH001-U001-B002-H001-M001',
                firstName: 'Simon',
                lastName: 'Peter',
                gender: 'male',
                phone: '9876543213',
                email: 'simon@example.com',
                relationToHead: 'head',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            // House 3 - Peter Family (spouse)
            {
                churchId: church._id,
                unitId: units[0]._id,
                bavanakutayimaId: bavanakutayimas[1]._id,
                houseId: houses[2]._id,
                memberNumber: 6,
                uniqueId: 'CH001-U001-B002-H001-M002',
                firstName: 'Rachel',
                lastName: 'Peter',
                gender: 'female',
                phone: '9876543223',
                email: 'rachel@example.com',
                relationToHead: 'spouse',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            // House 4 - Abraham Family
            {
                churchId: church._id,
                unitId: units[1]._id,
                bavanakutayimaId: bavanakutayimas[2]._id,
                houseId: houses[3]._id,
                memberNumber: 7,
                uniqueId: 'CH001-U002-B001-H001-M001',
                firstName: 'Paul',
                lastName: 'Abraham',
                gender: 'male',
                phone: '9876543214',
                email: 'paul@example.com',
                relationToHead: 'head',
                isActive: true,
                username: 'paul',
                password: 'password123',
                role: 'church_admin',
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            {
                churchId: church._id,
                unitId: units[1]._id,
                bavanakutayimaId: bavanakutayimas[2]._id,
                houseId: houses[3]._id,
                memberNumber: 8,
                uniqueId: 'CH001-U002-B001-H001-M002',
                firstName: 'Sarah',
                lastName: 'Abraham',
                gender: 'female',
                phone: '9876543224',
                email: 'sarah@example.com',
                relationToHead: 'spouse',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            // Additional members to reach 10+
            {
                churchId: church._id,
                unitId: units[0]._id,
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseId: houses[0]._id,
                memberNumber: 9,
                uniqueId: 'CH001-U001-B001-H001-M003',
                firstName: 'David',
                lastName: 'Mathew',
                gender: 'male',
                phone: '9876543225',
                email: 'david@example.com',
                relationToHead: 'child',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            {
                churchId: church._id,
                unitId: units[0]._id,
                bavanakutayimaId: bavanakutayimas[0]._id,
                houseId: houses[1]._id,
                memberNumber: 10,
                uniqueId: 'CH001-U001-B001-H002-M003',
                firstName: 'Elizabeth',
                lastName: 'Joseph',
                gender: 'female',
                phone: '9876543226',
                email: 'elizabeth@example.com',
                relationToHead: 'child',
                isActive: true,
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
            {
                churchId: church._id,
                unitId: units[1]._id,
                bavanakutayimaId: bavanakutayimas[2]._id,
                houseId: houses[3]._id,
                memberNumber: 11,
                uniqueId: 'CH001-U002-B001-H001-M003',
                firstName: 'James',
                lastName: 'Abraham',
                gender: 'male',
                phone: '9876543227',
                email: 'james@example.com',
                relationToHead: 'child',
                isActive: true,
                username: 'james',
                password: 'password123',
                role: 'member',
                smsPreferences: {
                    enabled: true,
                    paymentNotifications: true,
                    receiptNotifications: true,
                },
            },
        ];
        // Create members one by one to trigger password hashing hooks
        const members = [];
        for (const data of memberData) {
            const member = await Member_1.default.create(data);
            members.push(member);
        }
        console.log(`   ✓ Created ${members.length} members`);
        // ========================
        // CREATE ADMIN USER
        // ========================
        console.log('\n👤 Creating Admin User...');
        const admin = await Member_1.default.create({
            churchId: church._id,
            unitId: units[0]._id,
            bavanakutayimaId: bavanakutayimas[0]._id,
            houseId: houses[0]._id,
            memberNumber: 999,
            uniqueId: 'CH001-ADMIN',
            firstName: 'Admin',
            lastName: 'User',
            gender: 'male',
            phone: '9999999999',
            email: 'admin@example.com',
            relationToHead: 'other',
            isActive: true,
            username: 'admin',
            password: 'admin123',
            role: 'super_admin',
            smsPreferences: {
                enabled: true,
                paymentNotifications: true,
                receiptNotifications: true,
            },
        });
        console.log(`   ✓ Created admin user: ${admin.username}`);
        // ========================
        // CREATE STOTHRAKAZHCHA (Weekly Contributions)
        // ========================
        console.log('\n📅 Creating Stothrakazhcha...');
        const currentWeek = new Date();
        const nextWeek = new Date(currentWeek);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const stothrakazhcha = await Stothrakazhcha_1.default.create({
            churchId: church._id,
            weekNumber: 1,
            year: 2025,
            weekStartDate: currentWeek,
            weekEndDate: nextWeek,
            dueDate: nextWeek,
            defaultAmount: 100,
            amountType: 'per_member',
            status: 'active',
            contributors: [
                {
                    contributorId: members[0]._id,
                    contributorType: 'Member',
                    amount: 100,
                    contributedAt: new Date(),
                },
            ],
            totalCollected: 100,
            totalContributors: 1,
            duesProcessed: false,
            createdBy: admin._id,
        });
        console.log(`   ✓ Created Stothrakazhcha for Week ${stothrakazhcha.weekNumber}`);
        // ========================
        // CREATE STOTHRAKAZHCHA DUES
        // ========================
        console.log('\n💰 Creating Stothrakazhcha Dues...');
        const dues = await StothrakazhchaDue_1.default.insertMany([
            {
                churchId: church._id,
                stothrakazhchaId: stothrakazhcha._id,
                weekNumber: 1,
                year: 2025,
                dueForId: members[1]._id,
                dueForModel: 'Member',
                dueForName: `${members[1].firstName} ${members[1].lastName}`,
                amount: 100,
                balance: 100,
                isPaid: false,
                dueDate: nextWeek,
            },
            {
                churchId: church._id,
                stothrakazhchaId: stothrakazhcha._id,
                weekNumber: 1,
                year: 2025,
                dueForId: members[2]._id,
                dueForModel: 'Member',
                dueForName: `${members[2].firstName} ${members[2].lastName}`,
                amount: 100,
                balance: 50,
                isPaid: false,
                paidAmount: 50,
                dueDate: nextWeek,
            },
        ]);
        console.log(`   ✓ Created ${dues.length} stothrakazhcha dues`);
        // ========================
        // CREATE NEWS
        // ========================
        console.log('\n📰 Creating News...');
        const news = await News_1.default.insertMany([
            {
                churchId: church._id,
                title: 'Christmas Mass Schedule',
                contentType: 'text',
                content: 'Christmas Eve Mass at 11:00 PM. Christmas Day Mass at 7:00 AM and 9:00 AM.',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true,
                createdBy: admin._id,
            },
            {
                churchId: church._id,
                title: 'New Year Celebration',
                contentType: 'text',
                content: 'Join us for New Year thanksgiving mass followed by fellowship.',
                startDate: new Date(),
                endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                isActive: true,
                createdBy: admin._id,
            },
        ]);
        console.log(`   ✓ Created ${news.length} news items`);
        // ========================
        // CREATE EVENTS
        // ========================
        console.log('\n🎉 Creating Events...');
        const events = await Event_1.default.insertMany([
            {
                churchId: church._id,
                title: 'Parish Feast Day',
                contentType: 'text',
                content: 'Annual parish feast day celebration with special mass and cultural programs.',
                location: 'Church Grounds',
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
                isActive: true,
                createdBy: admin._id,
            },
            {
                churchId: church._id,
                title: 'Youth Retreat',
                contentType: 'text',
                content: 'Three-day youth retreat focusing on faith and fellowship.',
                location: 'Retreat Center',
                startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
                isActive: true,
                createdBy: admin._id,
            },
        ]);
        console.log(`   ✓ Created ${events.length} events`);
        // ========================
        // CREATE CAMPAIGNS
        // ========================
        console.log('\n📢 Creating Campaigns...');
        const campaigns = await Campaign_1.default.insertMany([
            {
                churchId: church._id,
                name: 'Church Building Fund',
                description: 'Fundraising for new church building construction',
                targetAmount: 500000,
                currentAmount: 125000,
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                status: 'active',
                campaignType: 'building_fund',
                contributionMode: 'fixed',
                amountType: 'per_member',
                fixedAmount: 5000,
                createdBy: admin._id,
            },
            {
                churchId: church._id,
                name: 'Christmas Celebration Fund',
                description: 'Special collection for Christmas programs and decorations',
                targetAmount: 50000,
                currentAmount: 35000,
                startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                status: 'active',
                campaignType: 'spl_contribution',
                contributionMode: 'fixed',
                amountType: 'per_house',
                fixedAmount: 1000,
                createdBy: admin._id,
            },
            {
                churchId: church._id,
                name: 'Poor Relief Fund',
                description: 'Monthly collection for helping families in need',
                targetAmount: 20000,
                currentAmount: 18500,
                startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
                status: 'active',
                campaignType: 'charity',
                contributionMode: 'variable',
                amountType: 'per_member',
                minimumAmount: 100,
                createdBy: admin._id,
            },
        ]);
        console.log(`   ✓ Created ${campaigns.length} campaigns`);
        // ========================
        // CREATE TRANSACTIONS
        // ========================
        console.log('\n💳 Creating Transactions...');
        const transactions = [];
        // Campaign donations
        const campaignTransactions = [
            { member: members[0], campaign: campaigns[0], amount: 5000 },
            { member: members[2], campaign: campaigns[0], amount: 10000 },
            { member: members[4], campaign: campaigns[0], amount: 7500 },
            { member: members[6], campaign: campaigns[1], amount: 2000 },
            { member: members[0], campaign: campaigns[1], amount: 3000 },
            { member: members[1], campaign: campaigns[2], amount: 1500 },
            { member: members[3], campaign: campaigns[2], amount: 2500 },
        ];
        for (const { member, campaign, amount } of campaignTransactions) {
            const transaction = await Transaction_1.default.create({
                churchId: church._id,
                amount,
                type: 'campaign_contribution',
                paymentMethod: 'cash',
                status: 'completed',
                referenceId: campaign._id,
                referenceModel: 'Campaign',
                paidBy: member._id,
                paidByModel: 'Member',
                paidByName: `${member.firstName} ${member.lastName}`,
                description: `Contribution to ${campaign.name}`,
                date: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
            });
            transactions.push(transaction);
        }
        // Stothrakazhcha payments
        const stothraTransaction = await Transaction_1.default.create({
            churchId: church._id,
            amount: 100,
            type: 'stothrakazhcha_contribution',
            paymentMethod: 'online',
            status: 'completed',
            referenceId: stothrakazhcha._id,
            referenceModel: 'Stothrakazhcha',
            paidBy: members[0]._id,
            paidByModel: 'Member',
            paidByName: `${members[0].firstName} ${members[0].lastName}`,
            description: `Stothrakazhcha Week ${stothrakazhcha.weekNumber}`,
            date: new Date(),
        });
        transactions.push(stothraTransaction);
        // General donations
        const generalDonations = [
            { member: members[1], amount: 500 },
            { member: members[3], amount: 1000 },
            { member: members[5], amount: 750 },
        ];
        for (const { member, amount } of generalDonations) {
            const transaction = await Transaction_1.default.create({
                churchId: church._id,
                amount,
                type: 'donation',
                paymentMethod: Math.random() > 0.5 ? 'cash' : 'online',
                status: 'completed',
                paidBy: member._id,
                paidByModel: 'Member',
                paidByName: `${member.firstName} ${member.lastName}`,
                description: 'General donation',
                date: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
            });
            transactions.push(transaction);
        }
        console.log(`   ✓ Created ${transactions.length} transactions`);
        // ========================
        // CREATE SPIRITUAL ACTIVITIES
        // ========================
        console.log('\n🙏 Creating Spiritual Activities...');
        const activities = [];
        const activityTypes = ['mass_attendance', 'confession', 'holy_communion', 'rosary', 'bible_reading', 'adoration'];
        // Create activities for multiple members
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            const numActivities = Math.floor(Math.random() * 5) + 3; // 3-7 activities per member
            for (let j = 0; j < numActivities; j++) {
                const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
                const daysAgo = Math.floor(Math.random() * 30);
                const activity = await SpiritualActivity_1.default.create({
                    memberId: member._id,
                    activityType,
                    activityDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
                    notes: `${activityType.replace('_', ' ')} on ${new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toDateString()}`,
                });
                activities.push(activity);
            }
        }
        console.log(`   ✓ Created ${activities.length} spiritual activities`);
        // ========================
        // CREATE WALLETS
        // ========================
        console.log('\n💰 Creating Wallets...');
        const wallets = [];
        // Create wallets for members with some balance
        for (let i = 0; i < Math.min(5, members.length); i++) {
            const member = members[i];
            const balance = Math.floor(Math.random() * 500) + 100;
            const wallet = await Wallet_1.default.create({
                ownerId: member._id,
                ownerModel: 'Member',
                ownerName: `${member.firstName} ${member.lastName}`,
                walletType: 'member',
                balance,
                transactions: [
                    {
                        transactionId: null,
                        amount: balance,
                        type: 'initial_balance',
                        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                    },
                ],
            });
            wallets.push(wallet);
        }
        // Create wallets for houses
        for (const house of houses) {
            const balance = Math.floor(Math.random() * 1000) + 200;
            const wallet = await Wallet_1.default.create({
                ownerId: house._id,
                ownerModel: 'House',
                ownerName: house.familyName,
                walletType: 'house',
                balance,
                transactions: [
                    {
                        transactionId: null,
                        amount: balance,
                        type: 'initial_balance',
                        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                    },
                ],
            });
            wallets.push(wallet);
        }
        console.log(`   ✓ Created ${wallets.length} wallets`);
        // ========================
        // SUMMARY
        // ========================
        console.log('\n');
        console.log('═'.repeat(60));
        console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        console.log('═'.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`   Churches            : 1`);
        console.log(`   Units               : ${units.length}`);
        console.log(`   Bavanakutayimas     : ${bavanakutayimas.length}`);
        console.log(`   Houses              : ${houses.length}`);
        console.log(`   Members             : ${members.length + 1} (including admin)`);
        console.log(`   Campaigns           : ${campaigns.length}`);
        console.log(`   Transactions        : ${transactions.length}`);
        console.log(`   Stothrakazhcha      : 1`);
        console.log(`   Stothrakazhcha Dues : ${dues.length}`);
        console.log(`   Spiritual Activities: ${activities.length}`);
        console.log(`   Wallets             : ${wallets.length}`);
        console.log(`   News                : ${news.length}`);
        console.log(`   Events              : ${events.length}`);
        console.log(`\n🔐 Super Admin Credentials:`);
        console.log(`   Username: admin`);
        console.log(`   Password: admin123`);
        console.log(`   Login at: /admin-login (use username)`);
        console.log(`\n👥 Church Admin Credentials:`);
        console.log(`   Email: paul@example.com`);
        console.log(`   Password: password123`);
        console.log(`   Login at: /church-admin-login (use email)`);
        console.log(`\n👤 Member Credentials:`);
        console.log(`   Username: thomas    | Password: password123 | Email: thomas@example.com`);
        console.log(`   Username: john      | Password: password123 | Email: john@example.com`);
        console.log(`   Login at: /member-login (use username)`);
        console.log(`\n💡 Note: Different login pages accept different formats:`);
        console.log(`   - Admin logins use EMAIL`);
        console.log(`   - Member login uses USERNAME`);
        console.log('\n');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.connection.close();
        console.log('👋 Database connection closed.');
        process.exit(0);
    }
};
// Run the seed function
seedDatabase();
//# sourceMappingURL=seedComplete.js.map
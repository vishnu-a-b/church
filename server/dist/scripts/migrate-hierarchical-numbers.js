"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Church_1 = __importDefault(require("../models/Church"));
const Unit_1 = __importDefault(require("../models/Unit"));
const Bavanakutayima_1 = __importDefault(require("../models/Bavanakutayima"));
const House_1 = __importDefault(require("../models/House"));
const Member_1 = __importDefault(require("../models/Member"));
dotenv_1.default.config();
/**
 * Migration script to update uniqueId format to hierarchical numbering
 *
 * Old format:
 * - Church: varies
 * - Unit: "C001-U001"
 * - Bavanakutayima: "C001-U001-BK001"
 * - House: "C001-U001-BK001-H001"
 * - Member: "C001-U001-BK001-H001-M001"
 *
 * New format:
 * - Church: "1", "2", "3"
 * - Unit: "1-1", "1-2"
 * - Bavanakutayima: "1-1-1", "1-1-2"
 * - House: "1-1-1-1", "1-1-1-2"
 * - Member: "1-1-1-1-1", "1-1-1-1-2"
 */
async function migrateChurches() {
    console.log('\n=== Migrating Churches ===');
    const churches = await Church_1.default.find().sort({ churchNumber: 1 });
    console.log(`Found ${churches.length} churches to migrate`);
    for (const church of churches) {
        const oldUniqueId = church.uniqueId;
        const newUniqueId = String(church.churchNumber);
        await Church_1.default.updateOne({ _id: church._id }, { $set: { uniqueId: newUniqueId } });
        console.log(`✓ Church "${church.name}": ${oldUniqueId} → ${newUniqueId}`);
    }
    console.log(`✓ Migrated ${churches.length} churches`);
}
async function migrateUnits() {
    console.log('\n=== Migrating Units ===');
    const units = await Unit_1.default.find().sort({ churchId: 1, unitNumber: 1 });
    console.log(`Found ${units.length} units to migrate`);
    let migrated = 0;
    let skipped = 0;
    for (const unit of units) {
        const church = await Church_1.default.findById(unit.churchId);
        if (!church) {
            console.warn(`⚠ Skipping unit "${unit.name}" - church not found (ID: ${unit.churchId})`);
            skipped++;
            continue;
        }
        const oldUniqueId = unit.uniqueId;
        const newUniqueId = `${church.uniqueId}-${unit.unitNumber}`;
        await Unit_1.default.updateOne({ _id: unit._id }, { $set: { uniqueId: newUniqueId } });
        console.log(`✓ Unit "${unit.name}": ${oldUniqueId} → ${newUniqueId}`);
        migrated++;
    }
    console.log(`✓ Migrated ${migrated} units${skipped > 0 ? ` (skipped ${skipped})` : ''}`);
}
async function migrateBavanakutayimas() {
    console.log('\n=== Migrating Bavanakutayimas ===');
    const bavanakutayimas = await Bavanakutayima_1.default.find().sort({ unitId: 1, bavanakutayimaNumber: 1 });
    console.log(`Found ${bavanakutayimas.length} bavanakutayimas to migrate`);
    let migrated = 0;
    let skipped = 0;
    for (const bk of bavanakutayimas) {
        const unit = await Unit_1.default.findById(bk.unitId);
        if (!unit) {
            console.warn(`⚠ Skipping bavanakutayima "${bk.name}" - unit not found (ID: ${bk.unitId})`);
            skipped++;
            continue;
        }
        const oldUniqueId = bk.uniqueId;
        const newUniqueId = `${unit.uniqueId}-${bk.bavanakutayimaNumber}`;
        await Bavanakutayima_1.default.updateOne({ _id: bk._id }, { $set: { uniqueId: newUniqueId } });
        console.log(`✓ Bavanakutayima "${bk.name}": ${oldUniqueId} → ${newUniqueId}`);
        migrated++;
    }
    console.log(`✓ Migrated ${migrated} bavanakutayimas${skipped > 0 ? ` (skipped ${skipped})` : ''}`);
}
async function migrateHouses() {
    console.log('\n=== Migrating Houses ===');
    const houses = await House_1.default.find().sort({ bavanakutayimaId: 1, houseNumber: 1 });
    console.log(`Found ${houses.length} houses to migrate`);
    let migrated = 0;
    let skipped = 0;
    for (const house of houses) {
        const bk = await Bavanakutayima_1.default.findById(house.bavanakutayimaId);
        if (!bk) {
            console.warn(`⚠ Skipping house "${house.familyName}" - bavanakutayima not found (ID: ${house.bavanakutayimaId})`);
            skipped++;
            continue;
        }
        const oldUniqueId = house.uniqueId;
        const newUniqueId = `${bk.uniqueId}-${house.houseNumber}`;
        await House_1.default.updateOne({ _id: house._id }, { $set: { uniqueId: newUniqueId } });
        console.log(`✓ House "${house.familyName}": ${oldUniqueId} → ${newUniqueId}`);
        migrated++;
    }
    console.log(`✓ Migrated ${migrated} houses${skipped > 0 ? ` (skipped ${skipped})` : ''}`);
}
async function migrateMembers() {
    console.log('\n=== Migrating Members ===');
    const members = await Member_1.default.find().sort({ houseId: 1, memberNumber: 1 });
    console.log(`Found ${members.length} members to migrate`);
    let migrated = 0;
    let skipped = 0;
    for (const member of members) {
        const house = await House_1.default.findById(member.houseId);
        if (!house) {
            console.warn(`⚠ Skipping member "${member.firstName} ${member.lastName || ''}" - house not found (ID: ${member.houseId})`);
            skipped++;
            continue;
        }
        const oldUniqueId = member.uniqueId;
        const newUniqueId = `${house.uniqueId}-${member.memberNumber}`;
        await Member_1.default.updateOne({ _id: member._id }, { $set: { uniqueId: newUniqueId } });
        console.log(`✓ Member "${member.firstName} ${member.lastName || ''}": ${oldUniqueId} → ${newUniqueId}`);
        migrated++;
    }
    console.log(`✓ Migrated ${migrated} members${skipped > 0 ? ` (skipped ${skipped})` : ''}`);
}
async function validateMigration() {
    console.log('\n=== Validating Migration ===');
    // Check for duplicate uniqueIds in each collection
    const collections = [
        { name: 'Churches', model: Church_1.default },
        { name: 'Units', model: Unit_1.default },
        { name: 'Bavanakutayimas', model: Bavanakutayima_1.default },
        { name: 'Houses', model: House_1.default },
        { name: 'Members', model: Member_1.default },
    ];
    for (const { name, model } of collections) {
        const duplicates = await model.aggregate([
            { $group: { _id: '$uniqueId', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        if (duplicates.length > 0) {
            console.error(`✗ Found ${duplicates.length} duplicate uniqueIds in ${name}:`);
            duplicates.forEach(dup => {
                console.error(`  - "${dup._id}" appears ${dup.count} times`);
            });
            throw new Error(`Duplicate uniqueIds found in ${name}`);
        }
        console.log(`✓ ${name}: No duplicates`);
    }
    // Validate format patterns
    console.log('\nValidating format patterns...');
    // Churches should be simple numbers
    const invalidChurches = await Church_1.default.find({ uniqueId: { $not: /^\d+$/ } });
    if (invalidChurches.length > 0) {
        console.error(`✗ Found ${invalidChurches.length} churches with invalid uniqueId format`);
        throw new Error('Invalid church uniqueId format');
    }
    console.log('✓ Churches: Format valid (simple numbers)');
    // Units should be "number-number"
    const invalidUnits = await Unit_1.default.find({ uniqueId: { $not: /^\d+-\d+$/ } });
    if (invalidUnits.length > 0) {
        console.error(`✗ Found ${invalidUnits.length} units with invalid uniqueId format`);
        throw new Error('Invalid unit uniqueId format');
    }
    console.log('✓ Units: Format valid (church-unit)');
    // Bavanakutayimas should be "number-number-number"
    const invalidBKs = await Bavanakutayima_1.default.find({ uniqueId: { $not: /^\d+-\d+-\d+$/ } });
    if (invalidBKs.length > 0) {
        console.error(`✗ Found ${invalidBKs.length} bavanakutayimas with invalid uniqueId format`);
        throw new Error('Invalid bavanakutayima uniqueId format');
    }
    console.log('✓ Bavanakutayimas: Format valid (church-unit-bk)');
    // Houses should be "number-number-number-number"
    const invalidHouses = await House_1.default.find({ uniqueId: { $not: /^\d+-\d+-\d+-\d+$/ } });
    if (invalidHouses.length > 0) {
        console.error(`✗ Found ${invalidHouses.length} houses with invalid uniqueId format`);
        throw new Error('Invalid house uniqueId format');
    }
    console.log('✓ Houses: Format valid (church-unit-bk-house)');
    // Members should be "number-number-number-number-number"
    const invalidMembers = await Member_1.default.find({ uniqueId: { $not: /^\d+-\d+-\d+-\d+-\d+$/ } });
    if (invalidMembers.length > 0) {
        console.error(`✗ Found ${invalidMembers.length} members with invalid uniqueId format`);
        throw new Error('Invalid member uniqueId format');
    }
    console.log('✓ Members: Format valid (full hierarchy)');
    console.log('\n✓ All validations passed!');
}
async function runMigration() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   Hierarchical Numbering System Migration                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n⚠ WARNING: This script will modify all uniqueId values in the database!');
    console.log('⚠ Ensure you have a backup before proceeding.\n');
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(mongoUri);
        console.log('✓ Connected to MongoDB\n');
        // Run migrations in order
        await migrateChurches();
        await migrateUnits();
        await migrateBavanakutayimas();
        await migrateHouses();
        await migrateMembers();
        // Validate results
        await validateMigration();
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║   Migration Completed Successfully! ✓                         ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');
    }
    catch (error) {
        console.error('\n╔════════════════════════════════════════════════════════════════╗');
        console.error('║   Migration Failed! ✗                                         ║');
        console.error('╚════════════════════════════════════════════════════════════════╝\n');
        console.error('Error:', error);
        console.error('\n⚠ Please restore from backup and fix the issue before retrying.\n');
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
// Run the migration
runMigration();
//# sourceMappingURL=migrate-hierarchical-numbers.js.map
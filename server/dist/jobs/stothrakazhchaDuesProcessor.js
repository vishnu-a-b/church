"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDues = exports.scheduleStothrakazhchaDuesProcessing = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Stothrakazhcha_1 = __importDefault(require("../models/Stothrakazhcha"));
const Member_1 = __importDefault(require("../models/Member"));
const House_1 = __importDefault(require("../models/House"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const Unit_1 = __importDefault(require("../models/Unit"));
const Bavanakutayima_1 = __importDefault(require("../models/Bavanakutayima"));
/**
 * Process dues for overdue stothrakazhcha
 * Automatically adds default amount to non-contributors' wallets
 */
const processDues = async () => {
    try {
        console.log('🕐 [CRON] Processing stothrakazhcha dues...');
        const now = new Date();
        const overdueStothrakazhchas = await Stothrakazhcha_1.default.find({
            status: 'active',
            duesProcessed: false,
            dueDate: { $lte: now },
            defaultAmount: { $gt: 0 }
        });
        if (overdueStothrakazhchas.length === 0) {
            console.log('✅ [CRON] No overdue stothrakazhchas to process');
            return;
        }
        console.log(`📊 [CRON] Found ${overdueStothrakazhchas.length} overdue stothrakazhchas`);
        let totalMembersProcessed = 0;
        let totalHousesProcessed = 0;
        for (const stothrakazhcha of overdueStothrakazhchas) {
            try {
                console.log(`  Processing: Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`);
                const contributorIds = (stothrakazhcha.contributors || []).map(c => String(c.contributorId));
                if (stothrakazhcha.amountType === 'per_member') {
                    const allMembers = await Member_1.default.find({
                        churchId: stothrakazhcha.churchId,
                        isActive: true
                    });
                    const nonContributors = allMembers.filter(member => !contributorIds.includes(String(member._id)));
                    console.log(`  Adding ₹${stothrakazhcha.defaultAmount} to ${nonContributors.length} members`);
                    for (const member of nonContributors) {
                        const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();
                        await Wallet_1.default.findOneAndUpdate({ ownerId: member._id, walletType: 'member' }, {
                            $inc: { balance: stothrakazhcha.defaultAmount },
                            $push: {
                                transactions: {
                                    transactionId: null,
                                    amount: stothrakazhcha.defaultAmount,
                                    type: `stothrakazhcha_week${stothrakazhcha.weekNumber}_due`,
                                    date: new Date()
                                }
                            },
                            $setOnInsert: {
                                ownerModel: 'Member',
                                ownerName: ownerName
                            }
                        }, { upsert: true, new: true });
                    }
                    totalMembersProcessed += nonContributors.length;
                }
                else if (stothrakazhcha.amountType === 'per_house') {
                    const units = await Unit_1.default.find({ churchId: stothrakazhcha.churchId });
                    const unitIds = units.map(u => u._id);
                    const bavanakutayimas = await Bavanakutayima_1.default.find({ unitId: { $in: unitIds } });
                    const bavanakutayimaIds = bavanakutayimas.map(b => b._id);
                    const allHouses = await House_1.default.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });
                    const nonContributors = allHouses.filter(house => !contributorIds.includes(String(house._id)));
                    console.log(`  Adding ₹${stothrakazhcha.defaultAmount} to ${nonContributors.length} houses`);
                    for (const house of nonContributors) {
                        await Wallet_1.default.findOneAndUpdate({ ownerId: house._id, walletType: 'house' }, {
                            $inc: { balance: stothrakazhcha.defaultAmount },
                            $push: {
                                transactions: {
                                    transactionId: null,
                                    amount: stothrakazhcha.defaultAmount,
                                    type: `stothrakazhcha_week${stothrakazhcha.weekNumber}_due`,
                                    date: new Date()
                                }
                            },
                            $setOnInsert: {
                                ownerModel: 'House',
                                ownerName: house.familyName
                            }
                        }, { upsert: true, new: true });
                    }
                    totalHousesProcessed += nonContributors.length;
                }
                // Mark as processed
                stothrakazhcha.duesProcessed = true;
                stothrakazhcha.duesProcessedAt = new Date();
                stothrakazhcha.status = 'processed';
                await stothrakazhcha.save();
                console.log(`  ✅ Processed: Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`);
            }
            catch (error) {
                console.error(`  ❌ Error processing stothrakazhcha:`, error);
            }
        }
        console.log(`✅ [CRON] Stothrakazhcha dues processing complete`);
        console.log(`   📊 Members: ${totalMembersProcessed}, Houses: ${totalHousesProcessed}`);
    }
    catch (error) {
        console.error('❌ [CRON] Error in stothrakazhcha dues processing:', error);
    }
};
exports.processDues = processDues;
/**
 * Schedule automatic stothrakazhcha dues processing
 * Runs every day at 7:00 AM (1 hour after campaign dues)
 */
const scheduleStothrakazhchaDuesProcessing = () => {
    // Run every day at 7:00 AM
    node_cron_1.default.schedule('0 7 * * *', async () => {
        await processDues();
    });
    console.log('✅ Stothrakazhcha dues processor scheduled (daily at 7:00 AM)');
};
exports.scheduleStothrakazhchaDuesProcessing = scheduleStothrakazhchaDuesProcessing;
//# sourceMappingURL=stothrakazhchaDuesProcessor.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDues = exports.scheduleCampaignDuesProcessing = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Campaign_1 = __importDefault(require("../models/Campaign"));
const Member_1 = __importDefault(require("../models/Member"));
const House_1 = __importDefault(require("../models/House"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const Unit_1 = __importDefault(require("../models/Unit"));
const Bavanakutayima_1 = __importDefault(require("../models/Bavanakutayima"));
/**
 * Process dues for overdue campaigns with variable contribution mode
 * Automatically adds minimum amount to non-contributors' wallets
 */
const processDues = async () => {
    try {
        console.log('🕐 [CRON] Processing campaign dues...');
        const now = new Date();
        const overdueCampaigns = await Campaign_1.default.find({
            contributionMode: 'variable',
            isActive: true,
            duesProcessed: false,
            dueDate: { $lte: now },
            minimumAmount: { $gt: 0 }
        });
        if (overdueCampaigns.length === 0) {
            console.log('✅ [CRON] No overdue campaigns to process');
            return;
        }
        console.log(`📊 [CRON] Found ${overdueCampaigns.length} overdue campaigns`);
        let totalMembersProcessed = 0;
        let totalHousesProcessed = 0;
        for (const campaign of overdueCampaigns) {
            try {
                console.log(`  Processing: ${campaign.name}`);
                const contributorIds = (campaign.contributors || []).map(c => String(c.contributorId));
                if (campaign.amountType === 'per_member') {
                    // Find all active members who haven't contributed
                    const allMembers = await Member_1.default.find({
                        churchId: campaign.churchId,
                        isActive: true
                    });
                    const nonContributors = allMembers.filter(member => !contributorIds.includes(String(member._id)));
                    console.log(`  Adding ₹${campaign.minimumAmount} to ${nonContributors.length} members`);
                    for (const member of nonContributors) {
                        const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();
                        await Wallet_1.default.findOneAndUpdate({ ownerId: member._id, walletType: 'member' }, {
                            $inc: { balance: campaign.minimumAmount },
                            $push: {
                                transactions: {
                                    transactionId: null,
                                    amount: campaign.minimumAmount,
                                    type: `campaign_${campaign.campaignType}_due`,
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
                else if (campaign.amountType === 'per_house') {
                    // Find all houses who haven't contributed
                    const units = await Unit_1.default.find({ churchId: campaign.churchId });
                    const unitIds = units.map(u => u._id);
                    const bavanakutayimas = await Bavanakutayima_1.default.find({ unitId: { $in: unitIds } });
                    const bavanakutayimaIds = bavanakutayimas.map(b => b._id);
                    const allHouses = await House_1.default.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });
                    const nonContributors = allHouses.filter(house => !contributorIds.includes(String(house._id)));
                    console.log(`  Adding ₹${campaign.minimumAmount} to ${nonContributors.length} houses`);
                    for (const house of nonContributors) {
                        await Wallet_1.default.findOneAndUpdate({ ownerId: house._id, walletType: 'house' }, {
                            $inc: { balance: campaign.minimumAmount },
                            $push: {
                                transactions: {
                                    transactionId: null,
                                    amount: campaign.minimumAmount,
                                    type: `campaign_${campaign.campaignType}_due`,
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
                // Mark campaign as processed
                campaign.duesProcessed = true;
                await campaign.save();
                console.log(`  ✅ Processed: ${campaign.name}`);
            }
            catch (campaignError) {
                console.error(`  ❌ Error processing campaign ${campaign.name}:`, campaignError);
                // Continue with next campaign
            }
        }
        console.log(`✅ [CRON] Campaign dues processing complete`);
        console.log(`   📊 Members: ${totalMembersProcessed}, Houses: ${totalHousesProcessed}`);
    }
    catch (error) {
        console.error('❌ [CRON] Error in campaign dues processing:', error);
    }
};
exports.processDues = processDues;
/**
 * Schedule automatic campaign dues processing
 * Runs every day at 6:00 AM
 */
const scheduleCampaignDuesProcessing = () => {
    // Run every day at 6:00 AM
    node_cron_1.default.schedule('0 6 * * *', async () => {
        await processDues();
    });
    console.log('✅ Campaign dues processor scheduled (daily at 6:00 AM)');
};
exports.scheduleCampaignDuesProcessing = scheduleCampaignDuesProcessing;
//# sourceMappingURL=campaignDuesProcessor.js.map
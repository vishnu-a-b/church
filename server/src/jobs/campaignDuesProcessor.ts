import cron from 'node-cron';
import Campaign from '../models/Campaign';
import Member from '../models/Member';
import House from '../models/House';
import Wallet from '../models/Wallet';
import Unit from '../models/Unit';
import Bavanakutayima from '../models/Bavanakutayima';

/**
 * Process dues for overdue campaigns with variable contribution mode
 * Automatically adds minimum amount to non-contributors' wallets
 */
const processDues = async () => {
  try {
    console.log('🕐 [CRON] Processing campaign dues...');

    const now = new Date();
    const overdueCampaigns = await Campaign.find({
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
          const allMembers = await Member.find({
            churchId: campaign.churchId,
            isActive: true
          });

          const nonContributors = allMembers.filter(member =>
            !contributorIds.includes(String(member._id))
          );

          console.log(`  Adding ₹${campaign.minimumAmount} to ${nonContributors.length} members`);

          for (const member of nonContributors) {
            const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();

            await Wallet.findOneAndUpdate(
              { ownerId: member._id, walletType: 'member' },
              {
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
              },
              { upsert: true, new: true }
            );
          }

          totalMembersProcessed += nonContributors.length;

        } else if (campaign.amountType === 'per_house') {
          // Find all houses who haven't contributed
          const units = await Unit.find({ churchId: campaign.churchId });
          const unitIds = units.map(u => u._id);

          const bavanakutayimas = await Bavanakutayima.find({ unitId: { $in: unitIds } });
          const bavanakutayimaIds = bavanakutayimas.map(b => b._id);

          const allHouses = await House.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });

          const nonContributors = allHouses.filter(house =>
            !contributorIds.includes(String(house._id))
          );

          console.log(`  Adding ₹${campaign.minimumAmount} to ${nonContributors.length} houses`);

          for (const house of nonContributors) {
            await Wallet.findOneAndUpdate(
              { ownerId: house._id, walletType: 'house' },
              {
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
              },
              { upsert: true, new: true }
            );
          }

          totalHousesProcessed += nonContributors.length;
        }

        // Mark campaign as processed
        campaign.duesProcessed = true;
        await campaign.save();

        console.log(`  ✅ Processed: ${campaign.name}`);

      } catch (campaignError) {
        console.error(`  ❌ Error processing campaign ${campaign.name}:`, campaignError);
        // Continue with next campaign
      }
    }

    console.log(`✅ [CRON] Campaign dues processing complete`);
    console.log(`   📊 Members: ${totalMembersProcessed}, Houses: ${totalHousesProcessed}`);

  } catch (error) {
    console.error('❌ [CRON] Error in campaign dues processing:', error);
  }
};

/**
 * Schedule automatic campaign dues processing
 * Runs every day at 6:00 AM
 */
export const scheduleCampaignDuesProcessing = () => {
  // Run every day at 6:00 AM
  cron.schedule('0 6 * * *', async () => {
    await processDues();
  });

  console.log('✅ Campaign dues processor scheduled (daily at 6:00 AM)');
};

// Export for manual execution if needed
export { processDues };

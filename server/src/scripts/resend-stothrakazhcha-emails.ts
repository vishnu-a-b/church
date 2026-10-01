/**
 * Resend stothrakazhcha receipt emails for a specific week.
 *
 * Sends to all approved contributors (non-absent) who have an email address.
 * Bypasses isEmailVerified check — this is an admin-forced resend.
 * No DB changes are made.
 *
 * Usage (from Church/server/):
 *   npx ts-node --transpile-only src/scripts/resend-stothrakazhcha-emails.ts <stothrakazhchaId>
 *
 * Dry-run (no emails sent):
 *   DRY_RUN=1 npx ts-node --transpile-only src/scripts/resend-stothrakazhcha-emails.ts <stothrakazhchaId>
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Stothrakazhcha from '../models/Stothrakazhcha';
import Transaction from '../models/Transaction';
import Member from '../models/Member';
import Church from '../models/Church';
import House from '../models/House';
import SpiritualActivity from '../models/SpiritualActivity';
import { sendTransactionNotification } from '../services/emailService';

const DRY_RUN = process.env.DRY_RUN === '1';
const STOTHRAKAZHCHA_ID = process.argv[2];

const main = async () => {
  if (!STOTHRAKAZHCHA_ID) {
    console.error('Usage: npx ts-node --transpile-only src/scripts/resend-stothrakazhcha-emails.ts <stothrakazhchaId>');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB\n');

  if (DRY_RUN) console.log('DRY RUN — no emails will be sent\n');

  const stothrakazhcha = await Stothrakazhcha.findById(STOTHRAKAZHCHA_ID).lean();
  if (!stothrakazhcha) {
    console.error(`Stothrakazhcha not found: ${STOTHRAKAZHCHA_ID}`);
    process.exit(1);
  }

  const church = await Church.findById(stothrakazhcha.churchId).select('name').lean();
  const churchName = (church as any)?.name || 'St. Mary\'s Church, Elthuruth';

  const { weekNumber, year, weekStartDate, weekEndDate, contributors } = stothrakazhcha as any;
  console.log(`Stothrakazhcha: Week ${weekNumber}, ${year}  (${churchName})`);
  console.log(`Total contributors in record: ${contributors?.length ?? 0}\n`);

  const eligible = (contributors || []).filter(
    (c: any) => c.approvalStatus === 'approved' && c.entryType !== 'absent' && c.transactionId,
  );
  console.log(`Eligible (approved, not absent, has transaction): ${eligible.length}\n`);

  let sent = 0;
  let skipped = 0;
  let noEmail = 0;

  const weekStr = `${year}-W${String(weekNumber).padStart(2, '0')}`;

  for (const contributor of eligible) {
    const member = await Member.findById(contributor.contributorId)
      .select('firstName lastName uniqueId email emailNotificationsEnabled houseId')
      .lean();

    if (!member) {
      console.warn(`  SKIP — member not found: ${contributor.contributorId}`);
      skipped++;
      continue;
    }

    if (!(member as any).email) {
      console.log(`  NO EMAIL — ${(member as any).firstName} ${(member as any).lastName || ''}`);
      noEmail++;
      continue;
    }

    const transaction = await Transaction.findById(contributor.transactionId).lean();
    if (!transaction) {
      console.warn(`  SKIP — transaction not found: ${contributor.transactionId}  member: ${(member as any).firstName}`);
      skipped++;
      continue;
    }

    const house = (member as any).houseId
      ? await House.findById((member as any).houseId).select('familyName').lean()
      : null;

    const activityQuery: any = weekStartDate && weekEndDate
      ? {
          memberId: member._id,
          approvalStatus: { $ne: 'rejected' },
          $or: [
            { activityType: 'mass', massDate: { $gte: weekStartDate, $lte: weekEndDate } },
            { activityType: 'prayer', prayerWeek: weekStr },
            { activityType: 'fasting', fastingWeek: weekStr },
          ],
        }
      : { memberId: member._id, approvalStatus: { $ne: 'rejected' } };

    const activities = await SpiritualActivity.find(activityQuery)
      .select('activityType approvalStatus massDate fastingWeek fastingDays prayerType prayerCount prayerWeek')
      .sort({ massDate: -1, createdAt: -1 })
      .lean();

    const txDetails = {
      receiptNumber: (transaction as any).receiptNumber,
      transactionType: (transaction as any).transactionType,
      amount: (transaction as any).totalAmount,
      paymentMethod: (transaction as any).paymentMethod,
      paymentDate: (transaction as any).paymentDate,
      campaignName: `Stothrakazhcha — Week ${weekNumber}, ${year}`,
      spiritualActivities: activities as any,
      churchName,
      houseName: (house as any)?.familyName,
      memberCode: (member as any).uniqueId,
    };

    const name = `${(member as any).firstName} ${(member as any).lastName || ''}`.trim();
    console.log(`  SEND  ${(member as any).uniqueId}  ${name}  →  ${(member as any).email}`);

    if (!DRY_RUN) {
      // Pass isEmailVerified as undefined (not false) to bypass the verification gate —
      // this is a deliberate admin resend, not a self-service notification.
      await sendTransactionNotification(
        {
          firstName: (member as any).firstName,
          lastName: (member as any).lastName,
          email: (member as any).email,
          isEmailVerified: undefined,
          emailNotificationsEnabled: (member as any).emailNotificationsEnabled,
        },
        txDetails,
      );
    }
    sent++;
  }

  console.log('\n─────────────────────────────────');
  console.log(`Sent:     ${sent}`);
  console.log(`No email: ${noEmail}`);
  console.log(`Skipped:  ${skipped}`);
  if (DRY_RUN) console.log('\n(DRY RUN — nothing was sent)');

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

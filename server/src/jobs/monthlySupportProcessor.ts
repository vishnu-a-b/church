import cron from 'node-cron';
import MonthlySupportPlan from '../models/MonthlySupportPlan';
import MonthlySupportDue from '../models/MonthlySupportDue';
import Member from '../models/Member';
import Donor from '../models/Donor';

const currentPeriodMonth = (now: Date): string => {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Generates this period's MonthlySupportDue records for one plan's active
 * members/donors. Safe to run repeatedly — the {planId, dueForId, periodMonth}
 * unique index means an already-generated due is simply skipped (duplicate
 * key error caught per member). Used by both the daily cron and the
 * admin-facing manual "Generate Dues" action.
 */
const generateDuesForPlan = async (plan: InstanceType<typeof MonthlySupportPlan>, now: Date): Promise<{ created: number; skipped: number }> => {
  const periodMonth = currentPeriodMonth(now);

  const memberIds = plan.members.filter((m) => m.memberId).map((m) => m.memberId);
  const donorIds = plan.members.filter((m) => m.donorId).map((m) => m.donorId);
  const activeMembers = await Member.find({ _id: { $in: memberIds }, isActive: true });
  const activeDonors = await Donor.find({ _id: { $in: donorIds }, isActive: true });
  const activeMemberIds = new Set(activeMembers.map((m) => String(m._id)));
  const activeDonorIds = new Set(activeDonors.map((d) => String(d._id)));

  let created = 0;
  let skipped = 0;

  for (const entry of plan.members) {
    const amount = entry.amount ?? plan.defaultAmount;
    const dueDate = new Date(now.getFullYear(), now.getMonth(), plan.dayOfMonth);

    let dueForId: typeof entry.memberId;
    let dueForModel: 'Member' | 'Donor';
    let dueForName: string;

    if (entry.memberId && activeMemberIds.has(String(entry.memberId))) {
      const member = activeMembers.find((m) => String(m._id) === String(entry.memberId));
      if (!member) continue;
      dueForId = entry.memberId;
      dueForModel = 'Member';
      dueForName = `${member.firstName} ${member.lastName || ''}`.trim();
    } else if (entry.donorId && activeDonorIds.has(String(entry.donorId))) {
      const donor = activeDonors.find((d) => String(d._id) === String(entry.donorId));
      if (!donor) continue;
      dueForId = entry.donorId;
      dueForModel = 'Donor';
      dueForName = donor.name;
    } else {
      continue;
    }

    try {
      await MonthlySupportDue.create({
        churchId: plan.churchId,
        planId: plan._id,
        planName: plan.name,
        periodMonth,
        dueForId,
        dueForModel,
        dueForName,
        amount,
        balance: amount,
        dueDate,
      });
      created++;
    } catch (err: any) {
      if (err?.code === 11000) {
        // Already generated for this plan/member/period — expected on re-runs
        skipped++;
      } else {
        console.error(`  ❌ Error creating due for ${dueForModel} ${String(dueForId)} on plan ${plan.name}:`, err);
      }
    }
  }

  return { created, skipped };
};

/**
 * Generates this month's MonthlySupportDue records for every active plan/member.
 */
const generateMonthlySupportDues = async () => {
  try {
    console.log('🕐 [CRON] Generating monthly support dues...');

    const now = new Date();

    const plans = await MonthlySupportPlan.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }],
    });

    if (plans.length === 0) {
      console.log('✅ [CRON] No active monthly support plans');
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const plan of plans) {
      const result = await generateDuesForPlan(plan, now);
      created += result.created;
      skipped += result.skipped;
    }

    console.log(`✅ [CRON] Monthly support dues generated: ${created} created, ${skipped} already existed`);
  } catch (error) {
    console.error('❌ [CRON] Error generating monthly support dues:', error);
  }
};

/**
 * Schedule automatic monthly support due generation.
 * Runs every day at 7:00 AM (idempotent — only fills in gaps for the current period).
 */
export const scheduleMonthlySupportProcessing = () => {
  cron.schedule('0 7 * * *', generateMonthlySupportDues);
  console.log('📅 Monthly support due generation job scheduled (daily at 7:00 AM)');
};

// Exported for manual/administrative triggering and tests
export { generateMonthlySupportDues, generateDuesForPlan };

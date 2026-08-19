import { Response, NextFunction } from 'express';
import MonthlySupportPlan from '../models/MonthlySupportPlan';
import MonthlySupportDue from '../models/MonthlySupportDue';
import MonthlySupportDraw from '../models/MonthlySupportDraw';
import Member from '../models/Member';
import Donor from '../models/Donor';
import Transaction from '../models/Transaction';
import Wallet from '../models/Wallet';
import { AuthRequest } from '../types';
import { generateDuesForPlan, isPeriodSkippedForEntry, nextPeriodMonth } from '../jobs/monthlySupportProcessor';
import { sendTransactionNotification, TransactionDetails } from '../services/emailService';
import { pushTransactionToEdv } from '../services/edvBridgeService';
import edvBridgeConfig from '../config/edvBridge';

// Validates a plan's members[] array: each entry must have exactly one of
// memberId/donorId, and every referenced Member/Donor must belong to churchId.
async function validatePlanMembers(members: any, churchId: any): Promise<string | null> {
  if (!Array.isArray(members) || members.length === 0) return null;

  const memberIds: any[] = [];
  const donorIds: any[] = [];

  for (const entry of members) {
    const hasMember = !!entry?.memberId;
    const hasDonor = !!entry?.donorId;
    if (hasMember === hasDonor) {
      return 'Each plan member must reference exactly one of memberId or donorId';
    }
    if (hasMember) memberIds.push(entry.memberId);
    else donorIds.push(entry.donorId);
  }

  if (memberIds.length > 0) {
    const validCount = await Member.countDocuments({ _id: { $in: memberIds }, churchId });
    if (validCount !== new Set(memberIds.map(String)).size) {
      return 'One or more members do not belong to this church';
    }
  }

  if (donorIds.length > 0) {
    const validCount = await Donor.countDocuments({ _id: { $in: donorIds }, churchId });
    if (validCount !== new Set(donorIds.map(String)).size) {
      return 'One or more donors do not belong to this church';
    }
  }

  return null;
}

// Create a new monthly support plan
export const createPlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // Church admin restriction: auto-set churchId from their church
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      req.body.churchId = req.user.churchId;
    }

    const { churchId, members } = req.body;

    const validationError = await validatePlanMembers(members, churchId);
    if (validationError) {
      res.status(400).json({ success: false, error: validationError });
      return;
    }

    const plan = await MonthlySupportPlan.create({
      ...req.body,
      createdBy: req.user?._id,
    });

    // Generate the current period's dues immediately so there's something to
    // collect against right away, rather than waiting on tomorrow's 7am cron.
    if (plan.isActive) {
      await generateDuesForPlan(plan, new Date());
    }

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const getAllPlans = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {};

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.query.churchId) {
      filter.churchId = req.query.churchId;
    }

    const plans = await MonthlySupportPlan.find(filter)
      .populate('churchId', 'name')
      .populate('members.memberId', 'firstName lastName')
      .populate('members.donorId', 'name phone notes')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const getPlanById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plan = await MonthlySupportPlan.findById(req.params.id)
      .populate('churchId', 'name')
      .populate('members.memberId', 'firstName lastName email phone')
      .populate('members.donorId', 'name phone email notes');

    if (!plan) {
      res.status(404).json({ success: false, error: 'Monthly support plan not found' });
      return;
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const updatePlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const plan = await MonthlySupportPlan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Monthly support plan not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && String(plan.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Church admins can only update their own church plans' });
      return;
    }

    if ('members' in req.body) {
      const validationError = await validatePlanMembers(req.body.members, plan.churchId);
      if (validationError) {
        res.status(400).json({ success: false, error: validationError });
        return;
      }
    }

    const allowedFields = ['name', 'description', 'defaultAmount', 'treatment', 'dayOfMonth', 'members', 'startDate', 'endDate', 'isActive'];
    for (const field of allowedFields) {
      if (field in req.body) {
        (plan as any)[field] = req.body[field];
      }
    }

    await plan.save();

    // If members were added/changed, generate the current period's dues for
    // them right away rather than waiting on tomorrow's 7am cron.
    if ('members' in req.body && plan.isActive) {
      await generateDuesForPlan(plan, new Date());
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

export const deletePlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const plan = await MonthlySupportPlan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Monthly support plan not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && String(plan.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Church admins can only delete their own church plans' });
      return;
    }

    await plan.deleteOne();
    res.json({ success: true, message: 'Monthly support plan deleted' });
  } catch (error) {
    next(error);
  }
};

// Admin: list dues generated for a given plan
export const getDuesForPlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = { planId: req.params.id };
    if (req.query.unpaidOnly === 'true') {
      filter.isPaid = false;
    }

    const dues = await MonthlySupportDue.find(filter)
      .populate('dueForId', 'firstName lastName name phone')
      .sort({ periodMonth: -1, dueForName: 1 });

    const totalDue = dues.reduce((sum, d) => sum + (d.isPaid ? 0 : d.balance), 0);
    const totalPaid = dues.reduce((sum, d) => sum + d.paidAmount, 0);

    res.json({
      success: true,
      data: dues,
      summary: {
        totalDues: dues.length,
        unpaidDues: dues.filter((d) => !d.isPaid).length,
        paidDues: dues.filter((d) => d.isPaid).length,
        totalDueAmount: totalDue,
        totalPaidAmount: totalPaid,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Manually generate this period's dues for one plan — dues are otherwise only
// created by a daily 7am cron, so a plan created (or edited) after that job
// already ran today would have nothing to collect against until tomorrow.
export const generateDuesNow = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const plan = await MonthlySupportPlan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Plan not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && String(plan.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Church admins can only manage their own church plans' });
      return;
    }

    if (!plan.isActive) {
      res.status(400).json({ success: false, error: 'Plan is not active' });
      return;
    }

    const result = await generateDuesForPlan(plan, new Date());

    res.json({
      success: true,
      message: `Generated ${result.created} due(s)${result.skipped ? `, ${result.skipped} already existed` : ''}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Ensures the due for one member/donor for one specific period exists,
// creating it if missing (scoped to just this one entry — NOT the whole
// plan, which is what generateDuesForPlan does and is too slow to call
// per-payment on a large plan like JGCC's 283 members).
async function ensureDueForPeriod(
  plan: InstanceType<typeof MonthlySupportPlan>,
  dueForId: any,
  contributorType: 'member' | 'donor',
  entry: { amount?: number; drawnAt?: Date; skippedPeriods?: string[] },
  periodMonth: string,
  periodDate: Date
): Promise<{ due: InstanceType<typeof MonthlySupportDue> | null; error?: string }> {
  let due = await MonthlySupportDue.findOne({ planId: plan._id, dueForId, periodMonth });
  if (due) return { due };

  if (isPeriodSkippedForEntry(entry, periodMonth)) {
    return { due: null, error: 'This contributor has this installment waived by a lots draw' };
  }

  let dueForName: string;
  if (contributorType === 'member') {
    const member = await Member.findById(dueForId);
    if (!member || !member.isActive) return { due: null, error: 'Member not found or inactive' };
    dueForName = `${member.firstName} ${member.lastName || ''}`.trim();
  } else {
    const donor = await Donor.findById(dueForId);
    if (!donor || !donor.isActive) return { due: null, error: 'Donor not found or inactive' };
    dueForName = donor.name;
  }

  const dueAmount = entry.amount ?? plan.defaultAmount;
  const dueDate = new Date(periodDate.getFullYear(), periodDate.getMonth(), plan.dayOfMonth);

  try {
    due = await MonthlySupportDue.create({
      churchId: plan.churchId,
      planId: plan._id,
      planName: plan.name,
      periodMonth,
      dueForId,
      dueForModel: contributorType === 'member' ? 'Member' : 'Donor',
      dueForName,
      amount: dueAmount,
      balance: dueAmount,
      dueDate,
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      // Created concurrently by another request (or the daily cron) — reuse it.
      due = await MonthlySupportDue.findOne({ planId: plan._id, dueForId, periodMonth });
    } else {
      throw err;
    }
  }

  return { due };
}

// Record a payment directly for one of a plan's members/donors, without
// requiring the admin to first go find that specific due — used by the
// "Add Payment" action on the Monthly Support list page. Mirrors payDue's
// monthly_support handling (wallet update, email receipt, EDV push), scoped
// to just this one plan/dueType since that's the only case relevant here.
//
// Supports paying several upcoming periods at once (months > 1) for donors
// who pay in advance — each period gets its own due/Transaction/EDV voucher
// (one real transaction per month owed), rather than one lump-sum
// transaction split across periods. Already-fully-paid periods are skipped
// rather than treated as an error, since prepaying 3 months when this
// month's due was already collected elsewhere is a normal case.
export const addPaymentForMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const plan = await MonthlySupportPlan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Plan not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && String(plan.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Church admins can only manage their own church plans' });
      return;
    }

    if (!plan.isActive) {
      res.status(400).json({ success: false, error: 'Plan is not active' });
      return;
    }

    const { memberId, donorId, amount, paymentMethod, referenceNo, paymentDate, months } = req.body;

    if ((!memberId && !donorId) || (memberId && donorId)) {
      res.status(400).json({ success: false, error: 'Specify exactly one of memberId or donorId' });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0 || !paymentMethod) {
      res.status(400).json({ success: false, error: 'Missing or invalid amount/paymentMethod' });
      return;
    }

    const monthsCount = Math.min(Math.max(parseInt(months) || 1, 1), 36);

    let effectivePaymentDate = new Date();
    if (paymentDate) {
      const parsed = new Date(paymentDate);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({ success: false, error: 'Invalid payment date' });
        return;
      }
      effectivePaymentDate = parsed;
    }

    const entry = plan.members.find((m) =>
      (memberId && m.memberId && String(m.memberId) === String(memberId)) ||
      (donorId && m.donorId && String(m.donorId) === String(donorId))
    );
    if (!entry) {
      res.status(400).json({ success: false, error: 'This member/donor is not part of the plan' });
      return;
    }

    const now = new Date();
    const dueForId = memberId || donorId;
    const contributorType: 'member' | 'donor' = memberId ? 'member' : 'donor';

    const recipient = contributorType === 'member'
      ? await Member.findById(dueForId)
      : await Donor.findById(dueForId);

    const results: Array<{ periodMonth: string; status: 'paid' | 'skipped' | 'error'; reason?: string; receiptNumber?: string }> = [];

    for (let i = 0; i < monthsCount; i++) {
      const periodDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const periodMonth = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;

      const { due, error: dueError } = await ensureDueForPeriod(plan, dueForId, contributorType, entry, periodMonth, periodDate);
      if (dueError || !due) {
        results.push({ periodMonth, status: 'error', reason: dueError || 'Could not find/create due' });
        break;
      }

      if (due.isPaid) {
        results.push({ periodMonth, status: 'skipped', reason: 'Already fully paid' });
        continue;
      }

      if (paymentAmount > due.balance) {
        results.push({ periodMonth, status: 'error', reason: `Amount exceeds remaining balance (₹${due.balance}) for this period` });
        break;
      }

      const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}-${i}`;

      const transaction = await Transaction.create({
        receiptNumber,
        churchId: plan.churchId,
        transactionType: 'monthly_support',
        totalAmount: paymentAmount,
        memberAmount: contributorType === 'member' ? paymentAmount : 0,
        houseAmount: 0,
        memberId: contributorType === 'member' ? dueForId : undefined,
        donorId: contributorType === 'donor' ? dueForId : undefined,
        monthlySupportPlanId: plan._id,
        paymentMethod,
        referenceNo: paymentMethod !== 'cash' ? (referenceNo || undefined) : undefined,
        paymentDate: effectivePaymentDate,
        notes: `Monthly support payment for ${due.dueForName} (${periodMonth})`,
        createdBy: req.user?._id,
      });

      due.paidAmount += paymentAmount;
      due.balance -= paymentAmount;
      due.isPaid = due.balance === 0;
      if (due.isPaid) due.paidAt = new Date();
      due.transactionId = transaction._id;
      await due.save();

      // Donors don't have a Wallet (no membership-debt concept for outside supporters)
      if (contributorType === 'member') {
        await Wallet.findOneAndUpdate(
          { ownerId: dueForId, walletType: 'member' },
          { $inc: { balance: -paymentAmount } }
        );
      }

      if (recipient?.email) {
        const transactionDetails: TransactionDetails = {
          receiptNumber,
          transactionType: 'monthly_support',
          amount: paymentAmount,
          paymentMethod,
          paymentDate: effectivePaymentDate,
          campaignName: `${plan.name} (${periodMonth})`,
        };

        sendTransactionNotification(recipient, transactionDetails).catch((error) => {
          console.error('Failed to send monthly support payment receipt email:', error);
        });
      }

      if (edvBridgeConfig.enabled) {
        pushTransactionToEdv(transaction).catch((err) => console.error('EDV bridge push failed:', err));
      }

      results.push({ periodMonth, status: 'paid', receiptNumber });
    }

    const paidCount = results.filter((r) => r.status === 'paid').length;
    const skippedCount = results.filter((r) => r.status === 'skipped').length;
    const errorResult = results.find((r) => r.status === 'error');

    res.json({
      success: paidCount > 0,
      message: `${paidCount} month(s) paid${skippedCount ? `, ${skippedCount} already paid` : ''}${errorResult ? `, stopped at ${errorResult.periodMonth}: ${errorResult.reason}` : ''}`,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};

// Record a "draw of lots" for a liability-treatment plan (e.g. hall booking
// deposits). The actual draw happens manually/in person (names pulled from a
// box at a church event) — this just records who won. Two kinds:
//  - 'complete': the winner's deposit is treated as complete — all
//    installments from the following month onward are waived permanently.
//  - 'skip_next': the winner only skips their next installment, then resumes
//    normal billing — they remain eligible for future draws.
// Only meaningful for liability plans — income/pledge plans have nothing to
// "complete" or "skip".
export const conductDraw = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const plan = await MonthlySupportPlan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Plan not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && String(plan.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Church admins can only manage their own church plans' });
      return;
    }

    if (!plan.isActive) {
      res.status(400).json({ success: false, error: 'Plan is not active' });
      return;
    }

    if (plan.treatment !== 'liability') {
      res.status(400).json({ success: false, error: 'Draw of lots is only available for liability-treatment (deposit) plans' });
      return;
    }

    const drawType: 'complete' | 'skip_next' = req.body.drawType === 'skip_next' ? 'skip_next' : 'complete';

    const winnerIds: string[] = Array.isArray(req.body.winnerIds)
      ? Array.from(new Set(req.body.winnerIds.map(String)))
      : [];
    if (winnerIds.length === 0) {
      res.status(400).json({ success: false, error: 'Select at least one winner to record' });
      return;
    }

    // Undrawn ("complete") pool size *before* this recording, kept as historical context.
    const poolSize = plan.members.filter((m) => !m.drawnAt && (m.memberId || m.donorId)).length;

    const winnerEntries: typeof plan.members = [] as any;
    for (const id of winnerIds) {
      const entry = plan.members.find((m) => String(m.memberId || m.donorId) === id);
      if (!entry) {
        res.status(400).json({ success: false, error: `Contributor ${id} is not part of this plan` });
        return;
      }
      if (entry.drawnAt) {
        res.status(400).json({ success: false, error: 'One or more selected contributors have already completed their deposit and have nothing left to draw for' });
        return;
      }
      winnerEntries.push(entry);
    }

    const now = new Date();
    const skipPeriodMonth = drawType === 'skip_next' ? nextPeriodMonth(now) : undefined;
    const winners: Array<{ dueForId: any; dueForModel: 'Member' | 'Donor'; dueForName: string }> = [];

    for (const entry of winnerEntries) {
      let dueForName: string;
      if (entry.memberId) {
        const member = await Member.findById(entry.memberId);
        dueForName = member ? `${member.firstName} ${member.lastName || ''}`.trim() : 'Unknown Member';
      } else {
        const donor = await Donor.findById(entry.donorId);
        dueForName = donor ? donor.name : 'Unknown Donor';
      }

      winners.push({
        dueForId: entry.memberId || entry.donorId,
        dueForModel: entry.memberId ? 'Member' : 'Donor',
        dueForName,
      });

      if (drawType === 'complete') {
        entry.drawnAt = now;
      } else if (skipPeriodMonth && !entry.skippedPeriods?.includes(skipPeriodMonth)) {
        entry.skippedPeriods = [...(entry.skippedPeriods || []), skipPeriodMonth];
      }
    }

    const draw = await MonthlySupportDraw.create({
      churchId: plan.churchId,
      planId: plan._id,
      planName: plan.name,
      drawnAt: now,
      drawType,
      skipPeriodMonth,
      poolSize,
      winners,
      conductedBy: req.user?._id,
      notes: typeof req.body.notes === 'string' ? req.body.notes.trim() || undefined : undefined,
    });

    if (drawType === 'complete') {
      for (const entry of winnerEntries) {
        entry.drawId = draw._id as any;
      }
    }

    await plan.save();

    res.status(201).json({ success: true, data: draw });
  } catch (error) {
    next(error);
  }
};

// Admin: draw history for a plan
export const getDrawsForPlan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const plan = await MonthlySupportPlan.findById(req.params.id);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Plan not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && String(plan.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Church admins can only view their own church plans' });
      return;
    }

    const draws = await MonthlySupportDraw.find({ planId: req.params.id })
      .populate('conductedBy', 'name email')
      .sort({ drawnAt: -1 });

    res.json({ success: true, data: draws });
  } catch (error) {
    next(error);
  }
};

// Member/Donor self-service: my monthly support dues
export const getMyMonthlySupportDues = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dueForId = req.user?.memberId || req.user?.donorId;

    if (!dueForId) {
      res.status(404).json({ success: false, error: 'Member or donor profile not found for this user' });
      return;
    }

    const dues = await MonthlySupportDue.find({ dueForId })
      .populate('planId', 'name')
      .sort({ periodMonth: -1 });

    res.json({ success: true, data: dues });
  } catch (error) {
    next(error);
  }
};

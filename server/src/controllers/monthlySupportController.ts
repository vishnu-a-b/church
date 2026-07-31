import { Response, NextFunction } from 'express';
import MonthlySupportPlan from '../models/MonthlySupportPlan';
import MonthlySupportDue from '../models/MonthlySupportDue';
import Member from '../models/Member';
import Donor from '../models/Donor';
import Transaction from '../models/Transaction';
import Wallet from '../models/Wallet';
import { AuthRequest } from '../types';
import { generateDuesForPlan } from '../jobs/monthlySupportProcessor';
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
      .populate('members.donorId', 'name phone')
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
      .populate('members.donorId', 'name phone email');

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

// Record a payment directly for one of a plan's members/donors, without
// requiring the admin to first go find that specific due — used by the
// "Add Payment" action on the Monthly Support list page. Mirrors payDue's
// monthly_support handling (wallet update, email receipt, EDV push), scoped
// to just this one plan/dueType since that's the only case relevant here.
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

    const { memberId, donorId, amount, paymentMethod } = req.body;

    if ((!memberId && !donorId) || (memberId && donorId)) {
      res.status(400).json({ success: false, error: 'Specify exactly one of memberId or donorId' });
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0 || !paymentMethod) {
      res.status(400).json({ success: false, error: 'Missing or invalid amount/paymentMethod' });
      return;
    }

    const entry = plan.members.find((m) =>
      (memberId && m.memberId && String(m.memberId) === String(memberId)) ||
      (donorId && m.donorId && String(m.donorId) === String(donorId))
    );
    if (!entry) {
      res.status(400).json({ success: false, error: 'This member/donor is not part of the plan' });
      return;
    }

    // Ensure the current period's due exists (idempotent — safe to call even
    // if it was already generated).
    await generateDuesForPlan(plan, new Date());

    const now = new Date();
    const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const dueForId = memberId || donorId;
    const contributorType: 'member' | 'donor' = memberId ? 'member' : 'donor';

    const due = await MonthlySupportDue.findOne({ planId: plan._id, dueForId, periodMonth });
    if (!due) {
      res.status(404).json({ success: false, error: 'Could not find/create a due for this member — are they active?' });
      return;
    }

    if (paymentAmount > due.balance) {
      res.status(400).json({ success: false, error: 'Amount exceeds remaining balance for this period' });
      return;
    }

    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
      paymentDate: now,
      notes: `Monthly support payment for ${due.dueForName}`,
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

    // Send an email receipt to the payer
    try {
      const recipient = contributorType === 'member'
        ? await Member.findById(dueForId)
        : await Donor.findById(dueForId);

      if (recipient?.email) {
        const transactionDetails: TransactionDetails = {
          receiptNumber,
          transactionType: 'monthly_support',
          amount: paymentAmount,
          paymentMethod,
          paymentDate: now,
          campaignName: plan.name,
        };

        sendTransactionNotification(recipient, transactionDetails).catch((error) => {
          console.error('Failed to send monthly support payment receipt email:', error);
        });
      }
    } catch (emailError) {
      console.error('Error sending monthly support payment receipt email:', emailError);
    }

    // Push into EDV asynchronously (don't block response)
    if (edvBridgeConfig.enabled) {
      pushTransactionToEdv(transaction).catch((err) => console.error('EDV bridge push failed:', err));
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: { transaction, due },
    });
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

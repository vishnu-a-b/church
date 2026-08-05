import { Response, NextFunction } from 'express';
import SpiritualActivity from '../models/SpiritualActivity';
import Stothrakazhcha from '../models/Stothrakazhcha';
import Transaction from '../models/Transaction';
import Member from '../models/Member';
import House from '../models/House';
import { AuthRequest } from '../types';
import { pushTransactionToEdv } from '../services/edvBridgeService';
import edvBridgeConfig from '../config/edvBridge';

// --- Step 1: Mark (kudumbakutayima_admin logs a new entry as pending) ---------------

// Kudumbakutayima Admin logs a new spiritual activity for a member in their group.
// The entry starts as 'pending_approval' and does not count toward anything until
// church management approves it — see approveSpiritualActivity below.
export const markSpiritualActivityPending = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Only kudumbakutayima admins can mark spiritual activities' });
      return;
    }
    if (!req.user.bavanakutayimaId) {
      res.status(403).json({ success: false, error: 'Kudumbakutayima admin must have a bavanakutayima assigned' });
      return;
    }

    const { memberId } = req.body;
    const member = await Member.findById(memberId).select('bavanakutayimaId');
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    if (String(member.bavanakutayimaId) !== String(req.user.bavanakutayimaId)) {
      res.status(403).json({ success: false, error: 'Can only mark activities for members in your own bavanakutayima' });
      return;
    }

    const activity = await SpiritualActivity.create({
      ...req.body,
      selfReported: false,
      approvalStatus: 'pending_approval',
      markedBy: req.user._id,
    });

    const populated = await SpiritualActivity.findById(activity._id).populate('memberId', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// Kudumbakutayima Admin marks a member/house as having contributed to the current
// Stothrakazhcha week. No Transaction is created yet, and the amount is NOT added to
// totalCollected/totalContributors — that only happens on approval, so a pending mark
// can never leak into financial totals or the EDV bridge.
export const markStothrakazhchaContributorPending = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Only kudumbakutayima admins can mark Sthothrakazhcha contributions' });
      return;
    }
    if (!req.user.bavanakutayimaId) {
      res.status(403).json({ success: false, error: 'Kudumbakutayima admin must have a bavanakutayima assigned' });
      return;
    }

    const { stothrakazhchaId } = req.params;
    const { contributorId, contributorType, amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Valid amount is required' });
      return;
    }
    if (!['Member', 'House'].includes(contributorType)) {
      res.status(400).json({ success: false, error: 'contributorType must be "Member" or "House"' });
      return;
    }

    const stothrakazhcha = await Stothrakazhcha.findById(stothrakazhchaId);
    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }
    if (stothrakazhcha.status !== 'active') {
      res.status(400).json({ success: false, error: 'Stothrakazhcha is not active' });
      return;
    }

    if (contributorType === 'Member') {
      const member = await Member.findById(contributorId).select('bavanakutayimaId');
      if (!member || String(member.bavanakutayimaId) !== String(req.user.bavanakutayimaId)) {
        res.status(403).json({ success: false, error: 'Can only mark members in your own bavanakutayima' });
        return;
      }
    } else {
      const house = await House.findById(contributorId).select('bavanakutayimaId');
      if (!house || String(house.bavanakutayimaId) !== String(req.user.bavanakutayimaId)) {
        res.status(403).json({ success: false, error: 'Can only mark houses in your own bavanakutayima' });
        return;
      }
    }

    const alreadyEntered = (stothrakazhcha.contributors || []).some(
      (c: any) => String(c.contributorId) === String(contributorId) && c.approvalStatus !== 'rejected'
    );
    if (alreadyEntered) {
      res.status(400).json({ success: false, error: 'An entry for this contributor already exists (pending or approved) for this week' });
      return;
    }

    stothrakazhcha.contributors = stothrakazhcha.contributors || [];
    stothrakazhcha.contributors.push({
      contributorId,
      contributorType,
      amount,
      contributedAt: new Date(),
      approvalStatus: 'pending_approval',
      markedBy: req.user._id,
    } as any);

    await stothrakazhcha.save();

    res.status(201).json({ success: true, data: stothrakazhcha, message: 'Contribution marked as pending approval' });
  } catch (error) {
    next(error);
  }
};

// --- Step 2: Approve / Reject (church management) -----------------------------------

export const getPendingApprovals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can review pending approvals' });
      return;
    }

    const memberFilter: any = {};
    const stothrakazhchaFilter: any = {};
    if (req.user.role === 'church_admin' && req.user.churchId) {
      memberFilter.churchId = req.user.churchId;
      stothrakazhchaFilter.churchId = req.user.churchId;
    }

    const churchMembers = await Member.find(memberFilter).select('_id');
    const memberIds = churchMembers.map((m) => m._id);

    const pendingActivities = await SpiritualActivity.find({
      memberId: { $in: memberIds },
      approvalStatus: 'pending_approval',
    })
      .populate('memberId', 'firstName lastName')
      .populate('markedBy', 'username email')
      .sort({ createdAt: -1 });

    const stothrakazhchasWithPending = await Stothrakazhcha.find({
      ...stothrakazhchaFilter,
      'contributors.approvalStatus': 'pending_approval',
    })
      .populate('churchId', 'name')
      .lean();

    const pendingContributions: any[] = [];
    for (const s of stothrakazhchasWithPending) {
      for (const c of s.contributors || []) {
        if ((c as any).approvalStatus !== 'pending_approval') continue;
        pendingContributions.push({
          stothrakazhchaId: s._id,
          weekNumber: s.weekNumber,
          year: s.year,
          churchId: s.churchId,
          contributor: c,
        });
      }
    }

    res.json({
      success: true,
      data: {
        spiritualActivities: pendingActivities,
        stothrakazhchaContributions: pendingContributions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveSpiritualActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can approve entries' });
      return;
    }

    const activity = await SpiritualActivity.findById(req.params.id);
    if (!activity) {
      res.status(404).json({ success: false, error: 'Spiritual activity not found' });
      return;
    }
    if (activity.approvalStatus !== 'pending_approval') {
      res.status(400).json({ success: false, error: `Entry is already ${activity.approvalStatus}` });
      return;
    }

    if (req.user.role === 'church_admin') {
      const member = await Member.findById(activity.memberId).select('churchId');
      if (!member || !req.user.churchId || String(member.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only approve entries from their own church' });
        return;
      }
    }

    activity.approvalStatus = 'approved';
    activity.approvedBy = req.user._id as any;
    activity.approvedAt = new Date();
    await activity.save();

    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const rejectSpiritualActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can reject entries' });
      return;
    }

    const activity = await SpiritualActivity.findById(req.params.id);
    if (!activity) {
      res.status(404).json({ success: false, error: 'Spiritual activity not found' });
      return;
    }
    if (activity.approvalStatus !== 'pending_approval') {
      res.status(400).json({ success: false, error: `Entry is already ${activity.approvalStatus}` });
      return;
    }

    if (req.user.role === 'church_admin') {
      const member = await Member.findById(activity.memberId).select('churchId');
      if (!member || !req.user.churchId || String(member.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only reject entries from their own church' });
        return;
      }
    }

    activity.approvalStatus = 'rejected';
    activity.approvedBy = req.user._id as any;
    activity.approvedAt = new Date();
    activity.rejectedReason = req.body.rejectedReason;
    await activity.save();

    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const approveStothrakazhchaContributor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can approve entries' });
      return;
    }

    const { stothrakazhchaId, contributorId } = req.params;
    const stothrakazhcha = await Stothrakazhcha.findById(stothrakazhchaId);
    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }
    if (req.user.role === 'church_admin' && (!req.user.churchId || String(stothrakazhcha.churchId) !== String(req.user.churchId))) {
      res.status(403).json({ success: false, error: 'Church admins can only approve entries from their own church' });
      return;
    }

    const contributor: any = (stothrakazhcha.contributors || []).find((c: any) => String(c._id) === String(contributorId));
    if (!contributor) {
      res.status(404).json({ success: false, error: 'Contributor entry not found' });
      return;
    }
    if (contributor.approvalStatus !== 'pending_approval') {
      res.status(400).json({ success: false, error: `Entry is already ${contributor.approvalStatus}` });
      return;
    }

    // Only now — on approval — does the contribution create a Transaction and count
    // toward totals, so a rejected/still-pending entry can never reach EDV or reports.
    let member: any = null;
    if (contributor.contributorType === 'Member') {
      member = await Member.findById(contributor.contributorId);
    }

    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transaction = await Transaction.create({
      receiptNumber,
      transactionType: 'stothrakazhcha',
      contributionMode: 'variable',
      distribution: contributor.contributorType === 'Member' ? 'member_only' : 'house_only',
      memberAmount: contributor.contributorType === 'Member' ? contributor.amount : 0,
      houseAmount: contributor.contributorType === 'House' ? contributor.amount : 0,
      totalAmount: contributor.amount,
      churchId: stothrakazhcha.churchId,
      unitId: member?.unitId,
      houseId: contributor.contributorType === 'House' ? contributor.contributorId : member?.houseId,
      memberId: contributor.contributorType === 'Member' ? contributor.contributorId : undefined,
      paymentDate: new Date(),
      paymentMethod: 'cash',
      notes: `Stothrakazhcha - Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year} (approved)`,
      createdBy: req.user._id,
    });

    contributor.approvalStatus = 'approved';
    contributor.approvedBy = req.user._id;
    contributor.approvedAt = new Date();
    contributor.transactionId = transaction._id;

    stothrakazhcha.totalCollected = (stothrakazhcha.totalCollected || 0) + contributor.amount;
    stothrakazhcha.totalContributors = (stothrakazhcha.totalContributors || 0) + 1;
    await stothrakazhcha.save();

    if (edvBridgeConfig.enabled) {
      pushTransactionToEdv(transaction).catch((err) => console.error('EDV bridge push failed:', err));
    }

    res.json({ success: true, data: stothrakazhcha });
  } catch (error) {
    next(error);
  }
};

export const rejectStothrakazhchaContributor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can reject entries' });
      return;
    }

    const { stothrakazhchaId, contributorId } = req.params;
    const stothrakazhcha = await Stothrakazhcha.findById(stothrakazhchaId);
    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }
    if (req.user.role === 'church_admin' && (!req.user.churchId || String(stothrakazhcha.churchId) !== String(req.user.churchId))) {
      res.status(403).json({ success: false, error: 'Church admins can only reject entries from their own church' });
      return;
    }

    const contributor: any = (stothrakazhcha.contributors || []).find((c: any) => String(c._id) === String(contributorId));
    if (!contributor) {
      res.status(404).json({ success: false, error: 'Contributor entry not found' });
      return;
    }
    if (contributor.approvalStatus !== 'pending_approval') {
      res.status(400).json({ success: false, error: `Entry is already ${contributor.approvalStatus}` });
      return;
    }

    contributor.approvalStatus = 'rejected';
    contributor.approvedBy = req.user._id;
    contributor.approvedAt = new Date();
    contributor.rejectedReason = req.body.rejectedReason;
    await stothrakazhcha.save();

    res.json({ success: true, data: stothrakazhcha });
  } catch (error) {
    next(error);
  }
};

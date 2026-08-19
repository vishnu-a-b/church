import { Response, NextFunction } from 'express';
import SpiritualActivity from '../models/SpiritualActivity';
import Stothrakazhcha from '../models/Stothrakazhcha';
import Transaction from '../models/Transaction';
import Member from '../models/Member';
import House from '../models/House';
import Bavanakutayima from '../models/Bavanakutayima';
import { AuthRequest } from '../types';
import { pushTransactionToEdv } from '../services/edvBridgeService';
import edvBridgeConfig from '../config/edvBridge';
import { notifyTransactionMember } from '../services/transactionNotifier';

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

    // Collect all contributor IDs for batch lookup
    const allMemberContributorIds: string[] = [];
    const allHouseContributorIds: string[] = [];
    for (const s of stothrakazhchasWithPending) {
      for (const c of s.contributors || []) {
        if ((c as any).approvalStatus !== 'pending_approval') continue;
        if ((c as any).contributorType === 'Member') {
          allMemberContributorIds.push(String((c as any).contributorId));
        } else {
          allHouseContributorIds.push(String((c as any).contributorId));
        }
      }
    }

    // Batch fetch members and houses with their bavanakutayima IDs
    const [membersList, housesList] = await Promise.all([
      Member.find({ _id: { $in: allMemberContributorIds } }).select('_id firstName lastName bavanakutayimaId').lean(),
      House.find({ _id: { $in: allHouseContributorIds } }).select('_id familyName bavanakutayimaId').lean(),
    ]);
    const membersMap: Record<string, any> = Object.fromEntries(membersList.map((m) => [String(m._id), m]));
    const housesMap: Record<string, any> = Object.fromEntries(housesList.map((h) => [String(h._id), h]));

    // Collect unique bavanakutayima IDs
    const bkIds = new Set<string>();
    for (const m of membersList) { if (m.bavanakutayimaId) bkIds.add(String(m.bavanakutayimaId)); }
    for (const h of housesList) { if (h.bavanakutayimaId) bkIds.add(String(h.bavanakutayimaId)); }

    const bkList = await Bavanakutayima.find({ _id: { $in: Array.from(bkIds) } }).select('_id name').lean();
    const bkMap: Record<string, any> = Object.fromEntries(bkList.map((b) => [String(b._id), b]));

    // Build enriched contributions with bavanakutayima grouping
    const pendingContributions: any[] = [];
    for (const s of stothrakazhchasWithPending) {
      for (const c of s.contributors || []) {
        if ((c as any).approvalStatus !== 'pending_approval') continue;
        const contributorId = String((c as any).contributorId);
        let bavanakutayimaId: string | null = null;
        let bavanakutayimaName: string | null = null;
        let contributorName = contributorId;

        if ((c as any).contributorType === 'Member') {
          const m = membersMap[contributorId];
          if (m) {
            contributorName = `${m.firstName} ${m.lastName || ''}`.trim();
            bavanakutayimaId = m.bavanakutayimaId ? String(m.bavanakutayimaId) : null;
          }
        } else {
          const h = housesMap[contributorId];
          if (h) {
            contributorName = h.familyName;
            bavanakutayimaId = h.bavanakutayimaId ? String(h.bavanakutayimaId) : null;
          }
        }

        if (bavanakutayimaId && bkMap[bavanakutayimaId]) {
          bavanakutayimaName = bkMap[bavanakutayimaId].name;
        }

        pendingContributions.push({
          stothrakazhchaId: s._id,
          weekNumber: s.weekNumber,
          year: s.year,
          churchId: s.churchId,
          bavanakutayimaId,
          bavanakutayimaName,
          contributorName,
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

    notifyTransactionMember(transaction, `Stothrakazhcha — Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`);

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

// Church admin edits the amount of a pending contribution before approving
export const updateStothrakazhchaContributorAmount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can edit contributor amounts' });
      return;
    }

    const { stothrakazhchaId, contributorId } = req.params;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: 'Valid amount is required' });
      return;
    }

    const stothrakazhcha = await Stothrakazhcha.findById(stothrakazhchaId);
    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }
    if (req.user.role === 'church_admin' && (!req.user.churchId || String(stothrakazhcha.churchId) !== String(req.user.churchId))) {
      res.status(403).json({ success: false, error: 'Church admins can only edit entries from their own church' });
      return;
    }

    const contributor: any = (stothrakazhcha.contributors || []).find((c: any) => String(c._id) === String(contributorId));
    if (!contributor) {
      res.status(404).json({ success: false, error: 'Contributor entry not found' });
      return;
    }
    if (contributor.approvalStatus !== 'pending_approval') {
      res.status(400).json({ success: false, error: `Cannot edit a ${contributor.approvalStatus} entry` });
      return;
    }

    contributor.amount = Number(amount);
    await stothrakazhcha.save();

    res.json({ success: true, data: stothrakazhcha, message: 'Amount updated' });
  } catch (error) {
    next(error);
  }
};

// Church admin batch-approves all pending contributions from a specific bavanakutayima
export const approveStothrakazhchaByBavanakutayima = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can approve entries' });
      return;
    }

    const { stothrakazhchaId, bkId } = req.params;
    const stothrakazhcha = await Stothrakazhcha.findById(stothrakazhchaId);
    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }
    if (req.user.role === 'church_admin' && (!req.user.churchId || String(stothrakazhcha.churchId) !== String(req.user.churchId))) {
      res.status(403).json({ success: false, error: 'Church admins can only approve entries from their own church' });
      return;
    }

    const pendingContributors: any[] = (stothrakazhcha.contributors || []).filter(
      (c: any) => c.approvalStatus === 'pending_approval'
    );
    if (pendingContributors.length === 0) {
      res.status(400).json({ success: false, error: 'No pending contributions found' });
      return;
    }

    // Look up which pending contributors belong to this bavanakutayima
    const memberIds = pendingContributors.filter((c) => c.contributorType === 'Member').map((c) => c.contributorId);
    const houseIds = pendingContributors.filter((c) => c.contributorType === 'House').map((c) => c.contributorId);

    const [bkMembers, bkHouses] = await Promise.all([
      Member.find({ _id: { $in: memberIds }, bavanakutayimaId: bkId }).select('_id unitId houseId').lean(),
      House.find({ _id: { $in: houseIds }, bavanakutayimaId: bkId }).select('_id').lean(),
    ]);

    const bkMemberIds = new Set(bkMembers.map((m) => String(m._id)));
    const bkHouseIds = new Set(bkHouses.map((h) => String(h._id)));
    const membersById: Record<string, any> = Object.fromEntries(bkMembers.map((m) => [String(m._id), m]));

    const toApprove = pendingContributors.filter((c) => {
      if (c.contributorType === 'Member') return bkMemberIds.has(String(c.contributorId));
      return bkHouseIds.has(String(c.contributorId));
    });

    if (toApprove.length === 0) {
      res.status(400).json({ success: false, error: 'No pending contributions found for this bavanakutayima' });
      return;
    }

    let totalApproved = 0;
    for (const contributor of toApprove) {
      const member = contributor.contributorType === 'Member' ? membersById[String(contributor.contributorId)] : null;
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
        notes: `Stothrakazhcha - Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year} (batch approved)`,
        createdBy: req.user._id,
      });

      contributor.approvalStatus = 'approved';
      contributor.approvedBy = req.user._id;
      contributor.approvedAt = new Date();
      contributor.transactionId = transaction._id;

      stothrakazhcha.totalCollected = (stothrakazhcha.totalCollected || 0) + contributor.amount;
      stothrakazhcha.totalContributors = (stothrakazhcha.totalContributors || 0) + 1;
      totalApproved++;

      if (edvBridgeConfig.enabled) {
        pushTransactionToEdv(transaction).catch((err) => console.error('EDV bridge push failed:', err));
      }

      notifyTransactionMember(transaction, `Stothrakazhcha — Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`);
    }

    await stothrakazhcha.save();

    res.json({ success: true, data: stothrakazhcha, message: `${totalApproved} contribution(s) approved` });
  } catch (error) {
    next(error);
  }
};

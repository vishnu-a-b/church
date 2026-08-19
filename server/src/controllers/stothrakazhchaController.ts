import { Response, NextFunction } from 'express';
import Stothrakazhcha from '../models/Stothrakazhcha';
import Transaction from '../models/Transaction';
import Member from '../models/Member';
import House from '../models/House';
import Bavanakutayima from '../models/Bavanakutayima';
import Wallet from '../models/Wallet';
import { AuthRequest } from '../types';
import { notifyTransactionMember } from '../services/transactionNotifier';
import { pushTransactionToEdv } from '../services/edvBridgeService';
import edvBridgeConfig from '../config/edvBridge';

// Get all Stothrakazhcha
export const getAllStothrakazhcha = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {};

    // Church admin restriction
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    // Explicit filter (super_admin scoping to a selected church in the UI)
    if (req.query.churchId && req.user?.role === 'super_admin') {
      filter.churchId = req.query.churchId;
    }

    const stothrakazhchas = await Stothrakazhcha.find(filter)
      .populate('churchId', 'name')
      .sort({ year: -1, weekNumber: -1 });

    res.json({ success: true, data: stothrakazhchas });
  } catch (error) {
    next(error);
  }
};

// Get Stothrakazhcha by ID
export const getStothrakazhchaById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stothrakazhcha = await Stothrakazhcha.findById(req.params.id)
      .populate('churchId', 'name')
      .lean();

    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }

    // Church admin restriction: can only view stothrakazhcha from their own church
    if (req.user?.role === 'church_admin') {
      const churchId = (stothrakazhcha.churchId as any)?._id ?? stothrakazhcha.churchId;
      if (!req.user.churchId || String(churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only view stothrakazhcha from their own church' });
        return;
      }
    }

    // Populate contributors with member/house details
    if (stothrakazhcha.contributors && stothrakazhcha.contributors.length > 0) {
      const populatedContributors = await Promise.all(
        stothrakazhcha.contributors.map(async (contributor: any) => {
          if (contributor.contributorType === 'Member') {
            const member = await Member.findById(contributor.contributorId)
              .select('firstName lastName email houseId memberNumber')
              .populate({
                path: 'houseId',
                select: 'familyName houseNumber',
                populate: {
                  path: 'bavanakutayimaId',
                  select: 'name bavanakutayimaNumber',
                  populate: {
                    path: 'unitId',
                    select: 'name unitNumber',
                    populate: {
                      path: 'churchId',
                      select: 'name churchNumber'
                    }
                  }
                }
              })
              .lean();

            // Manually compute hierarchical number
            let hierarchicalNumber;
            if (member && typeof member.houseId === 'object' && member.houseId !== null) {
              const house = member.houseId as any;
              if (house.bavanakutayimaId && typeof house.bavanakutayimaId === 'object') {
                const bk = house.bavanakutayimaId;
                if (bk.unitId && typeof bk.unitId === 'object') {
                  const unit = bk.unitId;
                  if (unit.churchId && typeof unit.churchId === 'object') {
                    const church = unit.churchId;
                    hierarchicalNumber = `${church.churchNumber}-${unit.unitNumber}-${bk.bavanakutayimaNumber}-${house.houseNumber}-${member.memberNumber}`;
                  }
                }
              }
            }

            return {
              ...contributor,
              member: {
                ...member,
                hierarchicalNumber
              },
              house: member?.houseId
            };
          } else {
            // It's a House contributor
            const house = await House.findById(contributor.contributorId)
              .select('familyName houseNumber')
              .populate({
                path: 'bavanakutayimaId',
                select: 'name bavanakutayimaNumber',
                populate: {
                  path: 'unitId',
                  select: 'name unitNumber',
                  populate: {
                    path: 'churchId',
                    select: 'name churchNumber'
                  }
                }
              })
              .lean();

            // Manually compute hierarchical number
            let hierarchicalNumber;
            if (house && house.bavanakutayimaId && typeof house.bavanakutayimaId === 'object') {
              const bk = house.bavanakutayimaId as any;
              if (bk.unitId && typeof bk.unitId === 'object') {
                const unit = bk.unitId;
                if (unit.churchId && typeof unit.churchId === 'object') {
                  const church = unit.churchId;
                  hierarchicalNumber = `${church.churchNumber}-${unit.unitNumber}-${bk.bavanakutayimaNumber}-${house.houseNumber}`;
                }
              }
            }

            return {
              ...contributor,
              house: {
                ...house,
                hierarchicalNumber
              }
            };
          }
        })
      );
      stothrakazhcha.contributors = populatedContributors;
    }

    res.json({ success: true, data: stothrakazhcha });
  } catch (error) {
    next(error);
  }
};

// Create Stothrakazhcha
export const createStothrakazhcha = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      req.body.churchId = req.user.churchId;
    }

    // Super admin must specify which church this is for (no churchId of their own)
    if (req.user?.role === 'super_admin' && !req.body.churchId) {
      res.status(400).json({ success: false, error: 'churchId is required' });
      return;
    }

    req.body.createdBy = req.user?._id;

    const stothrakazhcha = await Stothrakazhcha.create(req.body);
    const populated = await Stothrakazhcha.findById(stothrakazhcha._id).populate('churchId', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Stothrakazhcha for this week already exists'
      });
      return;
    }
    next(error);
  }
};

// Update Stothrakazhcha
export const updateStothrakazhcha = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await Stothrakazhcha.findById(req.params.id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }

    // Church admin restriction
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      if (String(existing.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Cannot update stothrakazhcha from another church' });
        return;
      }
    }

    const stothrakazhcha = await Stothrakazhcha.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('churchId', 'name');

    res.json({ success: true, data: stothrakazhcha });
  } catch (error) {
    next(error);
  }
};

// Delete Stothrakazhcha
export const deleteStothrakazhcha = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stothrakazhcha = await Stothrakazhcha.findById(req.params.id);

    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }

    // Church admin restriction
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      if (String(stothrakazhcha.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Cannot delete stothrakazhcha from another church' });
        return;
      }
    }

    await Stothrakazhcha.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Stothrakazhcha deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get current week's Stothrakazhcha
export const getCurrentWeekStothrakazhcha = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();

    const filter: any = {
      weekStartDate: { $lte: now },
      weekEndDate: { $gte: now },
      status: 'active'
    };

    // Filter by user's church if available
    if (req.user?.churchId) {
      filter.churchId = req.user.churchId;
    }

    const stothrakazhcha = await Stothrakazhcha.findOne(filter)
      .populate('churchId', 'name');

    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'No active stothrakazhcha for current week' });
      return;
    }

    res.json({ success: true, data: stothrakazhcha });
  } catch (error) {
    next(error);
  }
};

// Add contribution to Stothrakazhcha (Member or Admin endpoint)
export const addContribution = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, memberId: providedMemberId } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Valid amount is required' });
      return;
    }

    const stothrakazhcha = await Stothrakazhcha.findById(id);

    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }

    if (stothrakazhcha.status !== 'active') {
      res.status(400).json({ success: false, error: 'Stothrakazhcha is not active' });
      return;
    }

    // Get member ID - either from request body (admin) or from user (member)
    const memberId = providedMemberId || req.user?.memberId || req.user?._id;

    if (!memberId) {
      res.status(400).json({ success: false, error: 'Member ID not found' });
      return;
    }

    // Check if already contributed
    const hasContributed = stothrakazhcha.contributors?.some(
      (c: any) => String(c.contributorId) === String(memberId)
    );

    if (hasContributed) {
      res.status(400).json({ success: false, error: 'You have already contributed to this week' });
      return;
    }

    // Get member details
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    // Create transaction record
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transaction = await Transaction.create({
      receiptNumber,
      transactionType: 'stothrakazhcha',
      contributionMode: 'variable',
      distribution: 'member_only',
      memberAmount: amount,
      houseAmount: 0,
      totalAmount: amount,
      churchId: stothrakazhcha.churchId,
      unitId: member.unitId,
      houseId: member.houseId,
      memberId: memberId,
      paymentDate: new Date(),
      paymentMethod: 'cash',
      notes: `Stothrakazhcha - Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`,
      createdBy: req.user?._id
    });

    // Add contribution to Stothrakazhcha
    stothrakazhcha.contributors = stothrakazhcha.contributors || [];
    stothrakazhcha.contributors.push({
      contributorId: memberId,
      contributorType: 'Member',
      amount: amount,
      transactionId: transaction._id,
      contributedAt: new Date()
    } as any);

    stothrakazhcha.totalCollected = (stothrakazhcha.totalCollected || 0) + amount;
    stothrakazhcha.totalContributors = (stothrakazhcha.totalContributors || 0) + 1;

    await stothrakazhcha.save();

    // Update wallet - reduce balance since member paid
    const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();
    await Wallet.findOneAndUpdate(
      { ownerId: memberId, walletType: 'member' },
      {
        $inc: { balance: -amount },
        $push: {
          transactions: {
            transactionId: transaction._id,
            amount: -amount,
            type: `stothrakazhcha_week${stothrakazhcha.weekNumber}_payment`,
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

    const populated = await Stothrakazhcha.findById(stothrakazhcha._id)
      .populate('churchId', 'name')
      .lean();

    // Populate contributors with member/house details
    if (populated && populated.contributors && populated.contributors.length > 0) {
      const populatedContributors = await Promise.all(
        populated.contributors.map(async (contributor: any) => {
          if (contributor.contributorType === 'Member') {
            const memberData = await Member.findById(contributor.contributorId)
              .select('firstName lastName email houseId')
              .populate('houseId', 'familyName')
              .lean();
            return {
              ...contributor,
              member: memberData,
              house: memberData?.houseId
            };
          } else {
            // It's a House contributor
            const houseData = await House.findById(contributor.contributorId)
              .select('familyName')
              .lean();
            return {
              ...contributor,
              house: houseData
            };
          }
        })
      );
      populated.contributors = populatedContributors;
    }

    notifyTransactionMember(transaction, `Stothrakazhcha — Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`);

    // Push into EDV asynchronously (don't block response)
    if (edvBridgeConfig.enabled) {
      pushTransactionToEdv(transaction).catch((err) => console.error('EDV bridge push failed:', err));
    }

    res.json({ success: true, data: populated, message: 'Contribution added successfully' });
  } catch (error) {
    next(error);
  }
};

// Get a Stothrakazhcha week's contributors grouped by Bavanakutayima (church admin portal view)
export const getStothrakazhchaByBavanakutayima = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stothrakazhcha = await Stothrakazhcha.findById(req.params.id).lean();
    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
    }
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      if (String(stothrakazhcha.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Access denied' });
        return;
      }
    }

    const contributors = stothrakazhcha.contributors || [];
    const memberIds = contributors.filter((c: any) => c.contributorType === 'Member').map((c: any) => c.contributorId);
    const houseIds = contributors.filter((c: any) => c.contributorType === 'House').map((c: any) => c.contributorId);

    const [membersList, housesList] = await Promise.all([
      Member.find({ _id: { $in: memberIds } }).select('_id firstName lastName bavanakutayimaId').lean(),
      House.find({ _id: { $in: houseIds } }).select('_id familyName bavanakutayimaId').lean(),
    ]);

    const membersMap: Record<string, any> = Object.fromEntries(membersList.map((m) => [String(m._id), m]));
    const housesMap: Record<string, any> = Object.fromEntries(housesList.map((h) => [String(h._id), h]));

    const bkIds = new Set<string>();
    for (const m of membersList) { if (m.bavanakutayimaId) bkIds.add(String(m.bavanakutayimaId)); }
    for (const h of housesList) { if (h.bavanakutayimaId) bkIds.add(String(h.bavanakutayimaId)); }

    const bkList = await Bavanakutayima.find({ _id: { $in: Array.from(bkIds) } }).select('_id name').lean();
    const bkMap: Record<string, any> = Object.fromEntries(bkList.map((b) => [String(b._id), b]));

    const groups: Record<string, any> = {};
    for (const c of contributors) {
      const cAny = c as any;
      const contributorId = String(cAny.contributorId);
      let bkId: string | null = null;
      let contributorName = contributorId;

      if (cAny.contributorType === 'Member') {
        const m = membersMap[contributorId];
        if (m) {
          contributorName = `${m.firstName} ${m.lastName || ''}`.trim();
          bkId = m.bavanakutayimaId ? String(m.bavanakutayimaId) : null;
        }
      } else {
        const h = housesMap[contributorId];
        if (h) {
          contributorName = h.familyName;
          bkId = h.bavanakutayimaId ? String(h.bavanakutayimaId) : null;
        }
      }

      const bkName = bkId && bkMap[bkId] ? bkMap[bkId].name : 'Unknown Group';
      const key = bkId || 'unknown';

      if (!groups[key]) {
        groups[key] = {
          bavanakutayimaId: bkId,
          bavanakutayimaName: bkName,
          entries: [],
          totalAmount: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
        };
      }

      groups[key].entries.push({ ...cAny, contributorName });
      if (cAny.approvalStatus !== 'rejected') groups[key].totalAmount += cAny.amount;
      if (cAny.approvalStatus === 'pending_approval') groups[key].pendingCount++;
      else if (cAny.approvalStatus === 'approved') groups[key].approvedCount++;
      else if (cAny.approvalStatus === 'rejected') groups[key].rejectedCount++;
    }

    res.json({
      success: true,
      data: {
        _id: stothrakazhcha._id,
        weekNumber: stothrakazhcha.weekNumber,
        year: stothrakazhcha.year,
        status: stothrakazhcha.status,
        defaultAmount: stothrakazhcha.defaultAmount,
        amountType: stothrakazhcha.amountType,
        totalCollected: stothrakazhcha.totalCollected,
        totalContributors: stothrakazhcha.totalContributors,
        groups: Object.values(groups),
      },
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import Stothrakazhcha from '../models/Stothrakazhcha';
import Transaction from '../models/Transaction';
import Member from '../models/Member';
import Wallet from '../models/Wallet';
import { AuthRequest } from '../types';

// Get all Stothrakazhcha
export const getAllStothrakazhcha = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {};

    // Church admin restriction
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
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
      .populate('churchId', 'name');

    if (!stothrakazhcha) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
      return;
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
    const transaction = await Transaction.create({
      churchId: stothrakazhcha.churchId,
      unitId: member.unitId,
      bavanakutayimaId: member.bavanakutayimaId,
      houseId: member.houseId,
      memberId: memberId,
      type: 'income',
      category: 'stothrakazhcha',
      amount: amount,
      description: `Stothrakazhcha - Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`,
      date: new Date(),
      paymentMethod: 'other',
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

    const populated = await Stothrakazhcha.findById(stothrakazhcha._id).populate('churchId', 'name');

    res.json({ success: true, data: populated, message: 'Contribution added successfully' });
  } catch (error) {
    next(error);
  }
};

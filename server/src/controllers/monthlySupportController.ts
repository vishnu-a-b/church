import { Response, NextFunction } from 'express';
import MonthlySupportPlan from '../models/MonthlySupportPlan';
import MonthlySupportDue from '../models/MonthlySupportDue';
import Member from '../models/Member';
import Donor from '../models/Donor';
import { AuthRequest } from '../types';

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

    const allowedFields = ['name', 'description', 'defaultAmount', 'dayOfMonth', 'members', 'startDate', 'endDate', 'isActive'];
    for (const field of allowedFields) {
      if (field in req.body) {
        (plan as any)[field] = req.body[field];
      }
    }

    await plan.save();
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

// Member self-service: my monthly support dues
export const getMyMonthlySupportDues = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user?.memberId;

    if (!memberId) {
      res.status(404).json({ success: false, error: 'Member profile not found for this user' });
      return;
    }

    const dues = await MonthlySupportDue.find({ dueForId: memberId })
      .populate('planId', 'name')
      .sort({ periodMonth: -1 });

    res.json({ success: true, data: dues });
  } catch (error) {
    next(error);
  }
};

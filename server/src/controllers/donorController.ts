import { Response, NextFunction } from 'express';
import Donor from '../models/Donor';
import { AuthRequest } from '../types';

// Create a new donor (outside supporter — not part of the church membership hierarchy)
export const createDonor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      req.body.churchId = req.user.churchId;
    }

    const donor = await Donor.create({
      ...req.body,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: donor });
  } catch (error) {
    next(error);
  }
};

export const getAllDonors = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {};

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.query.churchId) {
      filter.churchId = req.query.churchId;
    }

    if (req.query.search) {
      const search = String(req.query.search);
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const donors = await Donor.find(filter).sort({ name: 1 });
    res.json({ success: true, data: donors });
  } catch (error) {
    next(error);
  }
};

export const getDonorById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      res.status(404).json({ success: false, error: 'Donor not found' });
      return;
    }
    res.json({ success: true, data: donor });
  } catch (error) {
    next(error);
  }
};

export const updateDonor = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      res.status(404).json({ success: false, error: 'Donor not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && String(donor.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Church admins can only update their own church donors' });
      return;
    }

    const allowedFields = ['name', 'phone', 'email', 'notes', 'isActive'];
    for (const field of allowedFields) {
      if (field in req.body) {
        (donor as any)[field] = req.body[field];
      }
    }

    await donor.save();
    res.json({ success: true, data: donor });
  } catch (error) {
    next(error);
  }
};

// Donor self-service: view own profile
export const getMyDonorProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const donorId = req.user?.donorId;

    if (!donorId) {
      res.status(404).json({ success: false, error: 'Donor profile not found for this user' });
      return;
    }

    const donor = await Donor.findById(donorId).populate('churchId', 'name uniqueId');

    if (!donor) {
      res.status(404).json({ success: false, error: 'Donor not found' });
      return;
    }

    res.json({ success: true, data: donor });
  } catch (error) {
    next(error);
  }
};

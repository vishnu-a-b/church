import { Response, NextFunction } from 'express';
import ThirukkarmangalRite from '../models/ThirukkarmangalRite';
import { AuthRequest } from '../types';
import { thirukkarmangalDefaultRites } from '../data/thirukkarmangalDefaultRites';

// Get all rites (optionally filtered by category), scoped by church
export const getAllRites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {};

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    if (req.query.churchId && req.user?.role === 'super_admin') {
      filter.churchId = req.query.churchId;
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.includeInactive !== 'true') {
      filter.isActive = true;
    }

    const rites = await ThirukkarmangalRite.find(filter).sort({ category: 1, sortOrder: 1 });
    res.json({ success: true, data: rites });
  } catch (error) {
    next(error);
  }
};

export const getRiteById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rite = await ThirukkarmangalRite.findById(req.params.id);
    if (!rite) {
      res.status(404).json({ success: false, error: 'Rite not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && (!req.user.churchId || String(rite.churchId) !== String(req.user.churchId))) {
      res.status(403).json({ success: false, error: 'Church admins can only view rites from their own church' });
      return;
    }

    res.json({ success: true, data: rite });
  } catch (error) {
    next(error);
  }
};

export const createRite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      req.body.churchId = req.user.churchId;
    }

    if (req.user?.role === 'super_admin' && !req.body.churchId) {
      res.status(400).json({ success: false, error: 'churchId is required' });
      return;
    }

    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can manage the rite list' });
      return;
    }

    req.body.createdBy = req.user?._id;
    const rite = await ThirukkarmangalRite.create(req.body);
    res.status(201).json({ success: true, data: rite });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, error: 'A rite with this code already exists for this church' });
      return;
    }
    next(error);
  }
};

export const updateRite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await ThirukkarmangalRite.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Rite not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && (!req.user.churchId || String(existing.churchId) !== String(req.user.churchId))) {
      res.status(403).json({ success: false, error: 'Church admins can only update rites from their own church' });
      return;
    }

    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can manage the rite list' });
      return;
    }

    // Amount/name/category edits go through this endpoint; split changes go through updateRiteSplit
    // so the sum-to-100 validation always runs.
    const { split, splitConfigured, ...rest } = req.body;

    const rite = await ThirukkarmangalRite.findByIdAndUpdate(req.params.id, rest, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: rite });
  } catch (error) {
    next(error);
  }
};

// Configure (or clear) a rite's recipient split. This is the only path that may
// change `split`/`splitConfigured` — validation here is what makes item 5 safe.
export const updateRiteSplit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await ThirukkarmangalRite.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Rite not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && (!req.user.churchId || String(existing.churchId) !== String(req.user.churchId))) {
      res.status(403).json({ success: false, error: 'Church admins can only update rites from their own church' });
      return;
    }

    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can manage rite splits' });
      return;
    }

    const split = Array.isArray(req.body.split) ? req.body.split : [];

    if (split.length > 0) {
      for (const entry of split) {
        if (!entry.recipientLabel || typeof entry.percent !== 'number') {
          res.status(400).json({ success: false, error: 'Each split entry needs a recipientLabel and a numeric percent' });
          return;
        }
      }

      const total = split.reduce((sum: number, entry: { percent: number }) => sum + entry.percent, 0);
      // Never normalize or guess — church management must supply a breakdown that sums to exactly 100.
      if (Math.round(total * 100) / 100 !== 100) {
        res.status(400).json({ success: false, error: `Split percentages must sum to exactly 100 (got ${total})` });
        return;
      }
    }

    existing.split = split;
    existing.splitConfigured = split.length > 0;
    await existing.save();

    res.json({ success: true, data: existing });
  } catch (error) {
    next(error);
  }
};

export const deleteRite = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await ThirukkarmangalRite.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Rite not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && (!req.user.churchId || String(existing.churchId) !== String(req.user.churchId))) {
      res.status(403).json({ success: false, error: 'Church admins can only delete rites from their own church' });
      return;
    }

    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can manage the rite list' });
      return;
    }

    // Soft delete — past Transactions still need to resolve the rite's name in reports.
    existing.isActive = false;
    await existing.save();

    res.json({ success: true, message: 'Rite deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// One-shot bulk insert of the fixed 23-rite fixture for a church that hasn't set up its rate list yet.
export const seedDefaultRites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let churchId: string | undefined;

    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      churchId = String(req.user.churchId);
    } else if (req.user?.role === 'super_admin') {
      churchId = req.body.churchId;
      if (!churchId) {
        res.status(400).json({ success: false, error: 'churchId is required' });
        return;
      }
    } else {
      res.status(403).json({ success: false, error: 'Only church admins can manage the rite list' });
      return;
    }

    const existingCodes = new Set(
      (await ThirukkarmangalRite.find({ churchId }).select('code')).map((r) => r.code)
    );

    const toInsert = thirukkarmangalDefaultRites
      .filter((fixture) => !existingCodes.has(fixture.code))
      .map((fixture) => ({
        churchId,
        category: fixture.category,
        code: fixture.code,
        nameMalayalam: fixture.nameMalayalam,
        nameEnglish: fixture.nameEnglish,
        amount: fixture.amount,
        sortOrder: fixture.sortOrder,
        split: fixture.split || [],
        splitConfigured: !!fixture.split && fixture.split.length > 0,
        createdBy: req.user?._id,
      }));

    if (toInsert.length === 0) {
      res.json({ success: true, message: 'All default rites already exist for this church', data: [] });
      return;
    }

    const created = await ThirukkarmangalRite.insertMany(toInsert);
    res.status(201).json({ success: true, message: `${created.length} default rites seeded`, data: created });
  } catch (error) {
    next(error);
  }
};

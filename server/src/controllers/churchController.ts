import { Response, NextFunction } from 'express';
import Church from '../models/Church';
import { AuthRequest } from '../types';

export const getAllChurches = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const churches = await Church.find().sort({ churchNumber: 1 });
    res.json({
      success: true,
      data: churches,
    });
  } catch (error) {
    next(error);
  }
};

export const getChurchById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const church = await Church.findById(req.params.id);
    if (!church) {
      res.status(404).json({
        success: false,
        error: 'Church not found',
      });
      return;
    }
    res.json({
      success: true,
      data: church,
    });
  } catch (error) {
    next(error);
  }
};

export const createChurch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the next church number
    const lastChurch = await Church.findOne().sort({ churchNumber: -1 });
    const churchNumber = lastChurch ? lastChurch.churchNumber + 1 : 1;

    // Generate simple numeric uniqueId
    const uniqueId = String(churchNumber);

    // Extract admin creation fields
    const { createAdmin, adminUsername, adminEmail, adminPassword, adminFirstName, adminLastName, ...churchData } = req.body;

    // Create church with generated fields
    const church = await Church.create({
      ...churchData,
      churchNumber,
      uniqueId,
    });

    // If createAdmin is true, create a church admin user
    if (createAdmin && adminUsername && adminEmail && adminPassword) {
      const User = (await import('../models/User')).default;

      try {
        await User.create({
          username: adminUsername,
          email: adminEmail,
          password: adminPassword,
          role: 'church_admin',
          churchId: church._id,
          isActive: true,
        });

        console.log(`✅ Created church admin user: ${adminUsername} for church: ${church.name}`);
      } catch (adminError: any) {
        console.error('⚠️ Error creating church admin:', adminError);
        // Don't fail the church creation if admin creation fails
        // but log it for awareness
      }
    }

    res.status(201).json({
      success: true,
      data: church,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChurch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const church = await Church.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!church) {
      res.status(404).json({
        success: false,
        error: 'Church not found',
      });
      return;
    }
    res.json({
      success: true,
      data: church,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChurch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const church = await Church.findByIdAndDelete(req.params.id);
    if (!church) {
      res.status(404).json({
        success: false,
        error: 'Church not found',
      });
      return;
    }
    res.json({
      success: true,
      message: 'Church deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
// ── EDV Bridge ──────────────────────────────────────────────────────────────
// Manages the per-church EDV bridge connection (settings.edvApiKey) and
// reports on how well transactions are syncing. Restricted to roles with
// church-wide authority since this is a financial integration credential.

const canManageEdvBridge = (req: AuthRequest): boolean =>
  req.user?.role === 'super_admin' || req.user?.role === 'church_admin';

export const setEdvBridgeKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!canManageEdvBridge(req)) {
      res.status(403).json({ success: false, error: 'Only Super Admin or Church Admin can manage the EDV bridge' });
      return;
    }

    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      res.status(400).json({ success: false, error: 'apiKey is required' });
      return;
    }

    // Dot-path $set so the rest of `settings` (smsEnabled, smsProvider, ...)
    // is left untouched, unlike a plain findByIdAndUpdate(id, { settings }).
    const church = await Church.findByIdAndUpdate(
      req.params.id,
      { $set: { 'settings.edvApiKey': apiKey.trim() } },
      { new: true, runValidators: true }
    );

    if (!church) {
      res.status(404).json({ success: false, error: 'Church not found' });
      return;
    }

    res.json({ success: true, data: { connected: true } });
  } catch (error) {
    next(error);
  }
};

export const removeEdvBridgeKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!canManageEdvBridge(req)) {
      res.status(403).json({ success: false, error: 'Only Super Admin or Church Admin can manage the EDV bridge' });
      return;
    }

    const church = await Church.findByIdAndUpdate(
      req.params.id,
      { $unset: { 'settings.edvApiKey': 1 } },
      { new: true }
    );

    if (!church) {
      res.status(404).json({ success: false, error: 'Church not found' });
      return;
    }

    res.json({ success: true, data: { connected: false } });
  } catch (error) {
    next(error);
  }
};

export const getEdvBridgeStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!canManageEdvBridge(req)) {
      res.status(403).json({ success: false, error: 'Only Super Admin or Church Admin can view the EDV bridge status' });
      return;
    }

    const church = await Church.findById(req.params.id).select('+settings.edvApiKey');
    if (!church) {
      res.status(404).json({ success: false, error: 'Church not found' });
      return;
    }

    const Transaction = (await import('../models/Transaction')).default;
    const churchId = church._id;

    const [syncedCount, failedCount, recentFailures, lastSynced] = await Promise.all([
      Transaction.countDocuments({ churchId, edvSynced: true }),
      Transaction.countDocuments({ churchId, edvSynced: false }),
      Transaction.find({ churchId, edvSynced: false, edvSyncError: { $exists: true, $ne: null } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('receiptNumber transactionType totalAmount paymentDate edvSyncError'),
      Transaction.findOne({ churchId, edvSynced: true }).sort({ edvSyncedAt: -1 }).select('edvSyncedAt'),
    ]);

    res.json({
      success: true,
      data: {
        connected: !!church.settings?.edvApiKey,
        syncedCount,
        failedCount,
        lastSyncedAt: lastSynced?.edvSyncedAt ?? null,
        recentFailures,
      },
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import ThirukkarmangalRite from '../models/ThirukkarmangalRite';
import ThirukkarmangalBooking from '../models/ThirukkarmangalBooking';
import Transaction from '../models/Transaction';
import Member from '../models/Member';
import { AuthRequest } from '../types';
import { thirukkarmangalDefaultRites } from '../data/thirukkarmangalDefaultRites';
import { computeSplitAmounts } from '../services/thirukkarmangalSplitService';
import { pushTransactionToEdv } from '../services/edvBridgeService';
import edvBridgeConfig from '../config/edvBridge';
import { notifyTransactionMember } from '../services/transactionNotifier';

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

// Book a Thirukkarmangal rite against a specific member, creating a Transaction record.
// Church admin supplies riteId + memberId; houseId/unitId are resolved automatically from the member.
// Super admin must also supply churchId in the request body.
export const bookThirukkarmangal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can book Thirukkarmangal rites' });
      return;
    }

    let churchId: string;
    if (req.user.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      churchId = String(req.user.churchId);
    } else {
      // super_admin must pass churchId in body
      if (!req.body.churchId) {
        res.status(400).json({ success: false, error: 'churchId is required' });
        return;
      }
      churchId = String(req.body.churchId);
    }

    const { riteId, memberId, totalAmount, paymentMethod, paymentDate, referenceNo, notes, edvOverrideLedgerId, receivingLedgerId } = req.body;

    if (!riteId || !memberId) {
      res.status(400).json({ success: false, error: 'riteId and memberId are required' });
      return;
    }

    // Validate rite belongs to this church
    const rite = await ThirukkarmangalRite.findById(riteId);
    if (!rite || !rite.isActive) {
      res.status(400).json({ success: false, error: 'Rite not found or inactive' });
      return;
    }
    if (String(rite.churchId) !== churchId) {
      res.status(403).json({ success: false, error: 'Rite does not belong to this church' });
      return;
    }

    // Validate member belongs to this church; pull houseId/unitId from member (denormalized)
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(400).json({ success: false, error: 'Member not found' });
      return;
    }
    if (String(member.churchId) !== churchId) {
      res.status(403).json({ success: false, error: 'Member does not belong to this church' });
      return;
    }

    const amountPaid = typeof totalAmount === 'number' ? totalAmount : rite.amount;
    const splitBreakdown = computeSplitAmounts(rite, amountPaid);

    const transaction = await Transaction.create({
      transactionType: 'thirukkarmangal',
      riteId: rite._id,
      memberId: member._id,
      houseId: member.houseId,
      unitId: member.unitId,
      churchId,
      totalAmount: amountPaid,
      memberAmount: amountPaid,
      houseAmount: 0,
      distribution: 'member_only',
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      referenceNo: referenceNo || undefined,
      notes: notes || undefined,
      edvOverrideLedgerId: edvOverrideLedgerId || undefined,
      receivingLedgerId: receivingLedgerId || undefined,
      splitBreakdown: splitBreakdown.length > 0 ? splitBreakdown : undefined,
      receiptNumber: `TKM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdBy: req.user._id,
    });

    if (edvBridgeConfig.enabled) {
      pushTransactionToEdv(transaction).catch((err) => console.error('EDV bridge push failed (thirukkarmangal booking):', err));
    }

    notifyTransactionMember(transaction, rite.nameEnglish || rite.nameMalayalam || 'Thirukkarmangal');

    const populated = await Transaction.findById(transaction._id)
      .populate('memberId', 'firstName lastName uniqueId')
      .populate('houseId', 'familyName houseCode')
      .populate('unitId', 'name')
      .populate('riteId', 'nameMalayalam nameEnglish code category amount');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// List Thirukkarmangal bookings (Transaction records with transactionType 'thirukkarmangal').
// Filterable by memberId, houseId, unitId, riteId, and date range (from/to).
export const getThirukkarmangalBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = { transactionType: 'thirukkarmangal' };

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.user?.role === 'super_admin' && req.query.churchId) {
      filter.churchId = req.query.churchId;
    }

    if (req.query.memberId) filter.memberId = req.query.memberId;
    if (req.query.houseId) filter.houseId = req.query.houseId;
    if (req.query.unitId) filter.unitId = req.query.unitId;
    if (req.query.riteId) filter.riteId = req.query.riteId;

    if (req.query.from || req.query.to) {
      filter.paymentDate = {};
      if (req.query.from) filter.paymentDate.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.paymentDate.$lte = new Date(req.query.to as string);
    }

    const bookings = await Transaction.find(filter)
      .sort({ paymentDate: -1 })
      .populate('memberId', 'firstName lastName uniqueId')
      .populate('houseId', 'familyName houseCode')
      .populate('unitId', 'name')
      .populate('riteId', 'nameMalayalam nameEnglish code category amount');

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

// Member self-service: get the logged-in member's own Thirukkarmangal history.
export const getMyThirukkarmangalHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = { transactionType: 'thirukkarmangal', memberId: req.user?._id };

    if (req.query.from || req.query.to) {
      filter.paymentDate = {};
      if (req.query.from) filter.paymentDate.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.paymentDate.$lte = new Date(req.query.to as string);
    }

    const bookings = await Transaction.find(filter)
      .sort({ paymentDate: -1 })
      .populate('riteId', 'nameMalayalam nameEnglish code category amount');

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

// Get a specific member's Thirukkarmangal booking history.
// Accessible by: church_admin (any member in their church), or the member themselves.
export const getMemberThirukkarmangalHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { memberId } = req.params;

    // Members can only view their own history
    if (req.user?.role === 'member') {
      if (String(req.user._id) !== memberId) {
        res.status(403).json({ success: false, error: 'Members can only view their own Thirukkarmangal history' });
        return;
      }
    } else if (req.user?.role !== 'church_admin') {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Validate member exists and belongs to this church
    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      if (String(member.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Member does not belong to your church' });
        return;
      }
    }

    const filter: any = { transactionType: 'thirukkarmangal', memberId };

    if (req.query.from || req.query.to) {
      filter.paymentDate = {};
      if (req.query.from) filter.paymentDate.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.paymentDate.$lte = new Date(req.query.to as string);
    }

    const bookings = await Transaction.find(filter)
      .sort({ paymentDate: -1 })
      .populate('riteId', 'nameMalayalam nameEnglish code category amount')
      .populate('houseId', 'familyName houseCode')
      .populate('unitId', 'name');

    res.json({ success: true, count: bookings.length, data: bookings });
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

// ─── Scheduled Bookings (two-step: book first, pay later) ─────────────────────

export const createScheduledBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can create bookings' });
      return;
    }

    let churchId: string;
    if (req.user.role === 'church_admin') {
      if (!req.user.churchId) { res.status(403).json({ success: false, error: 'Church admin must have a church assigned' }); return; }
      churchId = String(req.user.churchId);
    } else {
      if (!req.body.churchId) { res.status(400).json({ success: false, error: 'churchId is required' }); return; }
      churchId = String(req.body.churchId);
    }

    const { riteId, memberId, scheduledDate, notes } = req.body;
    if (!riteId || !memberId || !scheduledDate) {
      res.status(400).json({ success: false, error: 'riteId, memberId and scheduledDate are required' });
      return;
    }

    const rite = await ThirukkarmangalRite.findById(riteId);
    if (!rite || !rite.isActive || String(rite.churchId) !== churchId) {
      res.status(400).json({ success: false, error: 'Rite not found or inactive' });
      return;
    }

    const member = await Member.findById(memberId);
    if (!member || String(member.churchId) !== churchId) {
      res.status(400).json({ success: false, error: 'Member not found' });
      return;
    }

    const booking = await ThirukkarmangalBooking.create({
      churchId,
      riteId: rite._id,
      memberId: member._id,
      houseId: member.houseId,
      unitId: member.unitId,
      bavanakutayimaId: member.bavanakutayimaId,
      scheduledDate: new Date(scheduledDate),
      notes: notes || undefined,
      status: 'pending',
      createdBy: req.user._id,
    });

    const populated = await ThirukkarmangalBooking.findById(booking._id)
      .populate('riteId', 'nameMalayalam nameEnglish code category amount')
      .populate('memberId', 'firstName lastName uniqueId')
      .populate('houseId', 'familyName houseCode')
      .populate('unitId', 'name');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const getScheduledBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {};

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.user?.role === 'super_admin' && req.query.churchId) {
      filter.churchId = req.query.churchId;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.riteId) filter.riteId = req.query.riteId;
    if (req.query.memberId) filter.memberId = req.query.memberId;

    if (req.query.from || req.query.to) {
      filter.scheduledDate = {};
      if (req.query.from) filter.scheduledDate.$gte = new Date(req.query.from as string);
      if (req.query.to) {
        const to = new Date(req.query.to as string);
        to.setHours(23, 59, 59, 999);
        filter.scheduledDate.$lte = to;
      }
    }

    const bookings = await ThirukkarmangalBooking.find(filter)
      .sort({ scheduledDate: 1 })
      .populate('riteId', 'nameMalayalam nameEnglish code category amount')
      .populate('memberId', 'firstName lastName uniqueId')
      .populate('houseId', 'familyName houseCode')
      .populate('unitId', 'name')
      .populate('transactionId', 'receiptNumber totalAmount paymentMethod paymentDate');

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

export const addPaymentToBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can record payments' });
      return;
    }

    const booking = await ThirukkarmangalBooking.findById(req.params.id);
    if (!booking) { res.status(404).json({ success: false, error: 'Booking not found' }); return; }

    if (req.user.role === 'church_admin' && req.user.churchId && String(booking.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Booking does not belong to your church' }); return;
    }
    if (booking.status === 'paid') { res.status(400).json({ success: false, error: 'Booking already paid' }); return; }
    if (booking.status === 'cancelled') { res.status(400).json({ success: false, error: 'Cannot pay a cancelled booking' }); return; }

    const rite = await ThirukkarmangalRite.findById(booking.riteId);
    if (!rite) { res.status(400).json({ success: false, error: 'Rite not found' }); return; }

    const { totalAmount, paymentMethod, paymentDate, referenceNo, notes, receivingLedgerId } = req.body;
    const amountPaid = typeof totalAmount === 'number' ? totalAmount : rite.amount;
    const splitBreakdown = computeSplitAmounts(rite, amountPaid);

    const transaction = await Transaction.create({
      transactionType: 'thirukkarmangal',
      riteId: booking.riteId,
      memberId: booking.memberId,
      houseId: booking.houseId,
      unitId: booking.unitId,
      churchId: booking.churchId,
      totalAmount: amountPaid,
      memberAmount: amountPaid,
      houseAmount: 0,
      distribution: 'member_only',
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      referenceNo: referenceNo || undefined,
      notes: notes || `Thirukkarmangal: ${rite.nameEnglish}`,
      receivingLedgerId: receivingLedgerId || undefined,
      splitBreakdown: splitBreakdown.length > 0 ? splitBreakdown : undefined,
      receiptNumber: `TKM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdBy: req.user._id,
    });

    booking.status = 'paid';
    booking.transactionId = transaction._id as any;
    await booking.save();

    if (edvBridgeConfig.enabled) {
      pushTransactionToEdv(transaction).catch((err) => console.error('EDV bridge push failed (booking payment):', err));
    }
    notifyTransactionMember(transaction, rite.nameEnglish || rite.nameMalayalam || 'Thirukkarmangal');

    const populated = await ThirukkarmangalBooking.findById(booking._id)
      .populate('riteId', 'nameMalayalam nameEnglish code category amount')
      .populate('memberId', 'firstName lastName uniqueId')
      .populate('houseId', 'familyName houseCode')
      .populate('unitId', 'name')
      .populate('transactionId', 'receiptNumber totalAmount paymentMethod paymentDate');

    res.json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const cancelScheduledBooking = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'church_admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, error: 'Only church admins can cancel bookings' });
      return;
    }

    const booking = await ThirukkarmangalBooking.findById(req.params.id);
    if (!booking) { res.status(404).json({ success: false, error: 'Booking not found' }); return; }

    if (req.user.role === 'church_admin' && req.user.churchId && String(booking.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Booking does not belong to your church' }); return;
    }
    if (booking.status === 'paid') { res.status(400).json({ success: false, error: 'Cannot cancel a paid booking' }); return; }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

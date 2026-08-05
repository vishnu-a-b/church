import { Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import Member from '../models/Member';
import { AuthRequest } from '../types';
import { pushTransactionToEdv } from '../services/edvBridgeService';
import edvBridgeConfig from '../config/edvBridge';

// Pathavarm (Tithe) is per-member, one-time, and optional — there is no due to
// chase and no recurring schedule, so this is a thin self-service create-and-record
// endpoint rather than a full feature like Stothrakazhcha. Church admins recording
// a contribution on a member's behalf use the generic POST /transactions endpoint.
export const createMyPathavarmContribution = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user?.memberId;
    if (!memberId) {
      res.status(404).json({ success: false, error: 'Member profile not found for this user' });
      return;
    }

    const { amount, paymentMethod, referenceNo, notes } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Valid amount is required' });
      return;
    }

    const member = await Member.findById(memberId);
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }

    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transaction = await Transaction.create({
      receiptNumber,
      transactionType: 'pathavarm',
      distribution: 'member_only',
      memberAmount: amount,
      houseAmount: 0,
      totalAmount: amount,
      churchId: member.churchId,
      unitId: member.unitId,
      houseId: member.houseId,
      memberId: member._id,
      paymentDate: new Date(),
      paymentMethod: paymentMethod || 'cash',
      referenceNo,
      notes: notes || 'Pathavarm (Tithe)',
      createdBy: req.user?._id,
    });

    if (edvBridgeConfig.enabled) {
      pushTransactionToEdv(transaction).catch((err) => console.error('EDV bridge push failed:', err));
    }

    res.status(201).json({ success: true, data: transaction, message: 'Pathavarm contribution recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMyPathavarmHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user?.memberId;
    if (!memberId) {
      res.status(404).json({ success: false, error: 'Member profile not found for this user' });
      return;
    }

    const transactions = await Transaction.find({ memberId, transactionType: 'pathavarm' }).sort({ paymentDate: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

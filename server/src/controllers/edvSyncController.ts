import { Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import { pushTransactionToEdv } from '../services/edvBridgeService';
import { AuthRequest } from '../types';

// List transactions that haven't synced to EDV yet, for the manual Sync admin page.
export const listUnsyncedTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = { edvSynced: false };

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.query.churchId) {
      filter.churchId = req.query.churchId;
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .select('receiptNumber transactionType totalAmount paymentMethod paymentDate notes edvSyncError createdAt churchId');

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

// Retry a single transaction's push — awaited, so the admin sees the real
// outcome immediately instead of the usual fire-and-forget behavior.
export const retrySync = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    if (req.user?.role === 'church_admin' && String(transaction.churchId) !== String(req.user.churchId)) {
      res.status(403).json({ success: false, error: 'Cannot retry a transaction from another church' });
      return;
    }

    try {
      await pushTransactionToEdv(transaction);
      res.json({ success: true, data: { edvSynced: true } });
    } catch (err: any) {
      res.status(502).json({ success: false, error: err.message || 'EDV push failed' });
    }
  } catch (error) {
    next(error);
  }
};

// Retry every pending transaction in scope, one at a time, and report totals —
// this is what "Retry All" on the Sync page calls.
export const retrySyncAll = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = { edvSynced: false };

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.body.churchId) {
      filter.churchId = req.body.churchId;
    }

    const pending = await Transaction.find(filter).limit(500);
    const results: { ok: number; failed: number; errors: Array<{ id: string; receiptNumber: string; error: string }> } = {
      ok: 0,
      failed: 0,
      errors: [],
    };

    for (const transaction of pending) {
      try {
        await pushTransactionToEdv(transaction);
        results.ok++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ id: String(transaction._id), receiptNumber: transaction.receiptNumber, error: err.message || 'Unknown error' });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import Donor from '../models/Donor';
import Transaction from '../models/Transaction';
import MonthlySupportDue from '../models/MonthlySupportDue';

// Public endpoint — no auth required.
// Looks up a donor by their registered phone number and returns their
// recent monthly-support transactions so they can view/download receipts.
export const lookupDonorByPhone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone || !String(phone).trim()) {
      res.status(400).json({ success: false, error: 'Phone number is required' });
      return;
    }

    const donor = await Donor.findOne({ phone: String(phone).trim(), isActive: true })
      .populate('churchId', 'name');

    if (!donor) {
      res.status(404).json({ success: false, error: 'No supporter found with this phone number' });
      return;
    }

    const transactions = await Transaction.find({
      donorId: donor._id,
      transactionType: 'monthly_support',
    })
      .populate('monthlySupportPlanId', 'name')
      .sort({ paymentDate: -1 })
      .limit(50)
      .select('receiptNumber transactionType totalAmount paymentMethod paymentDate notes monthlySupportPlanId createdAt');

    const dues = await MonthlySupportDue.find({
      dueForId: donor._id,
      dueForModel: 'Donor',
    })
      .sort({ periodMonth: -1 })
      .limit(24)
      .select('planId planName periodMonth amount paidAmount balance isPaid dueDate paidAt');

    res.json({
      success: true,
      data: {
        donor: {
          name: donor.name,
          phone: donor.phone,
          church: donor.churchId,
        },
        transactions,
        dues,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/public/donor/:id — lookup by donor _id (used by QR-code links)
export const lookupDonorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const donor = await Donor.findOne({ _id: id, isActive: true }).populate('churchId', 'name');

    if (!donor) {
      res.status(404).json({ success: false, error: 'No supporter found' });
      return;
    }

    const [transactions, dues] = await Promise.all([
      Transaction.find({ donorId: donor._id, transactionType: 'monthly_support' })
        .populate('monthlySupportPlanId', 'name')
        .sort({ paymentDate: -1 })
        .limit(50)
        .select('receiptNumber transactionType totalAmount paymentMethod paymentDate notes monthlySupportPlanId createdAt'),
      MonthlySupportDue.find({ dueForId: donor._id, dueForModel: 'Donor' })
        .sort({ periodMonth: -1 })
        .limit(24)
        .select('planId planName periodMonth amount paidAmount balance isPaid dueDate paidAt'),
    ]);

    res.json({
      success: true,
      data: {
        donor: {
          name: donor.name,
          phone: donor.phone,
          church: donor.churchId,
        },
        transactions,
        dues,
      },
    });
  } catch (error) {
    next(error);
  }
};

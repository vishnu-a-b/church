import mongoose, { Schema } from 'mongoose';
import { IMonthlySupportDue } from '../types';

const monthlySupportDueSchema = new Schema<IMonthlySupportDue>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'MonthlySupportPlan',
      required: [true, 'Plan ID is required'],
      index: true,
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    periodMonth: {
      type: String,
      required: [true, 'Period month is required'],
    },
    dueForId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Due for ID is required'],
      refPath: 'dueForModel',
    },
    dueForModel: {
      type: String,
      required: true,
      enum: ['Member', 'Donor'],
      default: 'Member',
    },
    dueForName: {
      type: String,
      required: [true, 'Due for name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    paidAt: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One due per member per plan per calendar month
monthlySupportDueSchema.index(
  { planId: 1, dueForId: 1, periodMonth: 1 },
  { unique: true }
);

monthlySupportDueSchema.index({ isPaid: 1, dueDate: 1 });
monthlySupportDueSchema.index({ dueForId: 1 });
monthlySupportDueSchema.index({ churchId: 1, isPaid: 1 });

export default mongoose.model<IMonthlySupportDue>('MonthlySupportDue', monthlySupportDueSchema);

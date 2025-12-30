import mongoose, { Schema } from 'mongoose';
import { ITransaction } from '../types';

const transactionSchema = new Schema<ITransaction>(
  {
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
    },
    transactionType: {
      type: String,
      enum: ['lelam', 'thirunnaal_panam', 'dashamansham', 'spl_contribution', 'stothrakazhcha'],
      required: [true, 'Transaction type is required'],
    },
    contributionMode: {
      type: String,
      enum: ['fixed', 'variable'],
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    distribution: {
      type: String,
      enum: ['member_only', 'house_only', 'both'],
    },
    memberAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    houseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
    },
    houseId: {
      type: Schema.Types.ObjectId,
      ref: 'House',
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
    },
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'upi', 'cheque'],
      default: 'cash',
    },
    notes: {
      type: String,
      trim: true,
    },
    smsNotificationSent: {
      type: Boolean,
      default: false,
    },
    smsLogId: {
      type: Schema.Types.ObjectId,
      ref: 'SMSLog',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast filtering and search
transactionSchema.index({ receiptNumber: 1 });
transactionSchema.index({ churchId: 1 });
transactionSchema.index({ unitId: 1 });
transactionSchema.index({ houseId: 1 });
transactionSchema.index({ memberId: 1 });

// Compound indexes for hierarchical filtering and date-based queries
transactionSchema.index({ churchId: 1, paymentDate: -1 });
transactionSchema.index({ churchId: 1, unitId: 1 });
transactionSchema.index({ churchId: 1, unitId: 1, houseId: 1 });
transactionSchema.index({ churchId: 1, transactionType: 1, paymentDate: -1 });

// Indexes for reporting and analytics
transactionSchema.index({ transactionType: 1, paymentDate: -1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ campaignId: 1 });
transactionSchema.index({ paymentDate: -1 });
transactionSchema.index({ createdBy: 1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);

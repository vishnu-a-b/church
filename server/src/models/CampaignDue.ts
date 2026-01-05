import mongoose, { Schema } from 'mongoose';
import { ICampaignDue } from '../types';

const campaignDueSchema = new Schema<ICampaignDue>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Campaign ID is required'],
      index: true,
    },
    campaignName: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    dueForId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Due for ID is required'],
      refPath: 'dueForModel',
    },
    dueForModel: {
      type: String,
      required: true,
      enum: ['Member', 'House'],
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

// Compound index to ensure one due per member/house per campaign
campaignDueSchema.index(
  { campaignId: 1, dueForId: 1 },
  { unique: true }
);

// Index for finding unpaid dues
campaignDueSchema.index({ isPaid: 1, dueDate: 1 });

// Index for finding dues by member/house
campaignDueSchema.index({ dueForId: 1, dueForModel: 1 });

// Index for church-level queries
campaignDueSchema.index({ churchId: 1, isPaid: 1 });

export default mongoose.model<ICampaignDue>('CampaignDue', campaignDueSchema);

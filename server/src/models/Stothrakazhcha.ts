import mongoose, { Schema } from 'mongoose';
import { IStothrakazhcha } from '../types';

const stothrakazhchaSchema = new Schema<IStothrakazhcha>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
      index: true,
    },
    weekNumber: {
      type: Number,
      required: [true, 'Week number is required'],
      min: 1,
      max: 53,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
    },
    weekEndDate: {
      type: Date,
      required: [true, 'Week end date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    defaultAmount: {
      type: Number,
      required: [true, 'Default amount is required'],
      min: 0,
    },
    amountType: {
      type: String,
      enum: ['per_member', 'per_house'],
      default: 'per_member',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'processed'],
      default: 'active',
    },
    contributors: [{
      contributorId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      contributorType: {
        type: String,
        enum: ['Member', 'House'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
      },
      contributedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    totalCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalContributors: {
      type: Number,
      default: 0,
      min: 0,
    },
    duesProcessed: {
      type: Boolean,
      default: false,
    },
    duesProcessedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique week per church per year
stothrakazhchaSchema.index({ churchId: 1, year: 1, weekNumber: 1 }, { unique: true });

// Index for finding active stothrakazhcha
stothrakazhchaSchema.index({ status: 1, dueDate: 1 });

export default mongoose.model<IStothrakazhcha>('Stothrakazhcha', stothrakazhchaSchema);

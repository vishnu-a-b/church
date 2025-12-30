import mongoose, { Schema } from 'mongoose';
import { IStothrakazhchaDue } from '../types';

const stothrakazhchaDueSchema = new Schema<IStothrakazhchaDue>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
      index: true,
    },
    stothrakazhchaId: {
      type: Schema.Types.ObjectId,
      ref: 'Stothrakazhcha',
      required: [true, 'Stothrakazhcha ID is required'],
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

// Compound index to ensure one due per member/house per stothrakazhcha
stothrakazhchaDueSchema.index(
  { stothrakazhchaId: 1, dueForId: 1 },
  { unique: true }
);

// Index for finding unpaid dues
stothrakazhchaDueSchema.index({ isPaid: 1, dueDate: 1 });

// Index for finding dues by member/house
stothrakazhchaDueSchema.index({ dueForId: 1, dueForModel: 1 });

// Index for church-level queries
stothrakazhchaDueSchema.index({ churchId: 1, isPaid: 1 });

// Index for week-based queries
stothrakazhchaDueSchema.index({ churchId: 1, year: 1, weekNumber: 1 });

export default mongoose.model<IStothrakazhchaDue>('StothrakazhchaDue', stothrakazhchaDueSchema);

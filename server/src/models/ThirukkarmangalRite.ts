import mongoose, { Schema } from 'mongoose';
import { IThirukkarmangalRite } from '../types';

const riteSplitSchema = new Schema(
  {
    recipientLabel: {
      type: String,
      required: [true, 'Recipient label is required'],
      trim: true,
    },
    percent: {
      type: Number,
      required: [true, 'Percent is required'],
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const thirukkarmangalRiteSchema = new Schema<IThirukkarmangalRite>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    category: {
      type: String,
      enum: ['holy_masses', 'feast_day_rites', 'blessings', 'deceased_rites', 'other_rites'],
      required: [true, 'Category is required'],
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
      trim: true,
    },
    nameMalayalam: {
      type: String,
      required: [true, 'Malayalam name is required'],
      trim: true,
    },
    nameEnglish: {
      type: String,
      required: [true, 'English name is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    split: {
      type: [riteSplitSchema],
      default: [],
    },
    splitConfigured: {
      type: Boolean,
      default: false,
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

// A rite's machine-readable code is unique per church
thirukkarmangalRiteSchema.index({ churchId: 1, code: 1 }, { unique: true });
thirukkarmangalRiteSchema.index({ churchId: 1, category: 1, sortOrder: 1 });

export default mongoose.model<IThirukkarmangalRite>('ThirukkarmangalRite', thirukkarmangalRiteSchema);

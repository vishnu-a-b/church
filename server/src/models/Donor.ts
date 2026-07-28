import mongoose, { Schema } from 'mongoose';
import { IDonor } from '../types';

const donorSchema = new Schema<IDonor>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

donorSchema.index({ churchId: 1, isActive: 1 });
donorSchema.index({ churchId: 1, name: 1 });

export default mongoose.model<IDonor>('Donor', donorSchema);

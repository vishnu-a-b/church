import mongoose, { Schema } from 'mongoose';
import { IChurch } from '../types';

const churchSchema = new Schema<IChurch>(
  {
    churchNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Church name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    diocese: {
      type: String,
      trim: true,
    },
    established: {
      type: Date,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    settings: {
      smsEnabled: {
        type: Boolean,
        default: true,
      },
      smsProvider: {
        type: String,
        enum: ['fast2sms', 'msg91'],
        default: 'fast2sms',
      },
      smsApiKey: {
        type: String,
        select: false,
      },
      smsSenderId: {
        type: String,
        default: 'CHURCH',
      },
      currency: {
        type: String,
        default: 'INR',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for hierarchical number (just the church number)
churchSchema.virtual('hierarchicalNumber').get(function() {
  return String(this.churchNumber);
});

// Ensure virtuals are included in JSON
churchSchema.set('toJSON', { virtuals: true });
churchSchema.set('toObject', { virtuals: true });

export default mongoose.model<IChurch>('Church', churchSchema);

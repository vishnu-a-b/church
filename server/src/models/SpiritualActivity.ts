import mongoose, { Schema } from 'mongoose';
import { ISpiritualActivity } from '../types';

const spiritualActivitySchema = new Schema<ISpiritualActivity>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member ID is required'],
    },
    activityType: {
      type: String,
      enum: ['mass', 'fasting', 'prayer'],
      required: [true, 'Activity type is required'],
    },
    massDate: {
      type: Date,
    },
    massAttended: {
      type: Boolean,
      default: false,
    },
    fastingWeek: {
      type: String,
    },
    fastingDays: [
      {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      },
    ],
    prayerType: {
      type: String,
      enum: ['rosary', 'divine_mercy', 'stations', 'other'],
    },
    prayerCount: {
      type: Number,
      min: 0,
    },
    prayerWeek: {
      type: String,
    },
    selfReported: {
      type: Boolean,
      default: false,
    },
    reportedAt: {
      type: Date,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast filtering and search
spiritualActivitySchema.index({ memberId: 1 });
spiritualActivitySchema.index({ activityType: 1 });
spiritualActivitySchema.index({ memberId: 1, activityType: 1 });

// Date-based indexes for reporting
spiritualActivitySchema.index({ massDate: 1 });
spiritualActivitySchema.index({ massDate: -1 });
spiritualActivitySchema.index({ fastingWeek: 1 });
spiritualActivitySchema.index({ prayerWeek: 1 });

// Compound indexes for common queries
spiritualActivitySchema.index({ activityType: 1, massDate: -1 });
spiritualActivitySchema.index({ activityType: 1, selfReported: 1 });
spiritualActivitySchema.index({ memberId: 1, createdAt: -1 });

// Verification indexes
spiritualActivitySchema.index({ verifiedBy: 1 });
spiritualActivitySchema.index({ selfReported: 1, verifiedAt: 1 });

export default mongoose.model<ISpiritualActivity>('SpiritualActivity', spiritualActivitySchema);

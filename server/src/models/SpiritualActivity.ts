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
    // Deprecated — never wired to any enforcement logic. Superseded by approvalStatus/
    // markedBy/approvedBy/approvedAt below. Left in place rather than removed in case
    // anything still populates/reads it via the client.
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    // Approval flow (docs/NEW_FEATURES_2026.html, item 2). Defaults to 'approved' so
    // pre-existing rows and entries created outside the kudumbakutayima_admin "mark"
    // flow keep counting exactly as they did before this field existed.
    approvalStatus: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected'],
      default: 'approved',
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    rejectedReason: {
      type: String,
      trim: true,
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

// Approval flow indexes
spiritualActivitySchema.index({ approvalStatus: 1 });
spiritualActivitySchema.index({ markedBy: 1 });

export default mongoose.model<ISpiritualActivity>('SpiritualActivity', spiritualActivitySchema);

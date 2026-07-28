import mongoose, { Schema } from 'mongoose';
import { IMonthlySupportPlan } from '../types';

const monthlySupportPlanSchema = new Schema<IMonthlySupportPlan>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    defaultAmount: {
      type: Number,
      required: [true, 'Default amount is required'],
      min: 0,
    },
    dayOfMonth: {
      type: Number,
      required: [true, 'Day of month is required'],
      min: 1,
      max: 28,
    },
    members: [{
      memberId: {
        type: Schema.Types.ObjectId,
        ref: 'Member',
      },
      donorId: {
        type: Schema.Types.ObjectId,
        ref: 'Donor',
      },
      amount: {
        type: Number,
        min: 0,
      },
    }],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
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

monthlySupportPlanSchema.index({ churchId: 1, isActive: 1 });

export default mongoose.model<IMonthlySupportPlan>('MonthlySupportPlan', monthlySupportPlanSchema);

import mongoose, { Schema } from 'mongoose';
import { ICampaign } from '../types';

const campaignSchema = new Schema<ICampaign>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    campaignType: {
      type: String,
      enum: ['stothrakazhcha', 'spl_contribution', 'general_fund', 'building_fund', 'charity', 'other'],
      required: [true, 'Campaign type is required'],
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    contributionMode: {
      type: String,
      enum: ['fixed', 'variable'],
      default: 'fixed',
      required: [true, 'Contribution mode is required'],
    },
    fixedAmount: {
      type: Number,
      required: function(this: ICampaign) {
        return this.contributionMode === 'fixed';
      },
      min: 0,
    },
    minimumAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    amountType: {
      type: String,
      enum: ['per_house', 'per_member', 'flexible'],
      required: [true, 'Amount type is required'],
    },
    contributors: [{
      contributorId: {
        type: Schema.Types.ObjectId,
        refPath: 'amountType',
      },
      contributedAmount: {
        type: Number,
        default: 0,
      },
      contributedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    duesProcessed: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalCollected: {
      type: Number,
      default: 0,
    },
    participantCount: {
      type: Number,
      default: 0,
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

campaignSchema.index({ churchId: 1, isActive: 1 });

export default mongoose.model<ICampaign>('Campaign', campaignSchema);

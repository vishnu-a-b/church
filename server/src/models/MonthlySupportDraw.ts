import mongoose, { Schema } from 'mongoose';
import { IMonthlySupportDraw } from '../types';

const monthlySupportDrawSchema = new Schema<IMonthlySupportDraw>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'MonthlySupportPlan',
      required: [true, 'Plan ID is required'],
      index: true,
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    drawnAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    drawType: {
      type: String,
      enum: ['complete', 'skip_next'],
      required: true,
      default: 'complete',
    },
    skipPeriodMonth: {
      type: String,
    },
    poolSize: {
      type: Number,
      required: true,
      min: 0,
    },
    winners: [{
      dueForId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'dueForModel',
      },
      dueForModel: {
        type: String,
        required: true,
        enum: ['Member', 'Donor'],
      },
      dueForName: {
        type: String,
        required: true,
        trim: true,
      },
    }],
    conductedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

monthlySupportDrawSchema.index({ planId: 1, drawnAt: -1 });

export default mongoose.model<IMonthlySupportDraw>('MonthlySupportDraw', monthlySupportDrawSchema);

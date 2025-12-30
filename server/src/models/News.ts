import mongoose, { Schema } from 'mongoose';
import { INews } from '../types';

const newsSchema = new Schema<INews>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    title: {
      type: String,
      required: [true, 'News title is required'],
      trim: true,
    },
    contentType: {
      type: String,
      enum: ['text', 'image', 'video'],
      required: [true, 'Content type is required'],
      default: 'text',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by church and date range
newsSchema.index({ churchId: 1, startDate: 1, endDate: 1 });
newsSchema.index({ churchId: 1, isActive: 1 });

export default mongoose.model<INews>('News', newsSchema);

import mongoose, { Schema } from 'mongoose';
import { IEvent } from '../types';

const eventSchema = new Schema<IEvent>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
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
    location: {
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
eventSchema.index({ churchId: 1, startDate: 1, endDate: 1 });
eventSchema.index({ churchId: 1, isActive: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);

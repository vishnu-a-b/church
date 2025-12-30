import mongoose, { Schema } from 'mongoose';
import { IUnit } from '../types';

const unitSchema = new Schema<IUnit>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    unitNumber: {
      type: Number,
      required: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Unit name is required'],
      trim: true,
    },
    unitCode: {
      type: String,
      trim: true,
    },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

unitSchema.index({ churchId: 1 });

export default mongoose.model<IUnit>('Unit', unitSchema);

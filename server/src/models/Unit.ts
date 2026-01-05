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

// Virtual field for hierarchical number
// Will be computed as: churchNumber-unitNumber
// The church data needs to be populated for this to work
unitSchema.virtual('hierarchicalNumber').get(function() {
  if (this.populated('churchId') && typeof this.churchId === 'object' && 'churchNumber' in this.churchId) {
    return `${this.churchId.churchNumber}-${this.unitNumber}`;
  }
  return String(this.unitNumber);
});

// Ensure virtuals are included in JSON
unitSchema.set('toJSON', { virtuals: true });
unitSchema.set('toObject', { virtuals: true });

export default mongoose.model<IUnit>('Unit', unitSchema);

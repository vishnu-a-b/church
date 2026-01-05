import mongoose, { Schema } from 'mongoose';
import { IBavanakutayima } from '../types';

const bavanakutayimaSchema = new Schema<IBavanakutayima>(
  {
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: [true, 'Unit ID is required'],
    },
    bavanakutayimaNumber: {
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
      required: [true, 'Bavanakutayima name is required'],
      trim: true,
    },
    leaderName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

bavanakutayimaSchema.index({ unitId: 1 });

// Virtual field for hierarchical number
// Will be computed as: churchNumber-unitNumber-bavanakutayimaNumber
// The unit.churchId data needs to be populated for this to work
bavanakutayimaSchema.virtual('hierarchicalNumber').get(function() {
  if (this.populated('unitId') && typeof this.unitId === 'object' && 'unitNumber' in this.unitId) {
    const unit = this.unitId as any;
    if (unit.populated && unit.populated('churchId') && typeof unit.churchId === 'object' && 'churchNumber' in unit.churchId) {
      return `${unit.churchId.churchNumber}-${unit.unitNumber}-${this.bavanakutayimaNumber}`;
    } else if (unit.churchId && typeof unit.churchId === 'object' && 'churchNumber' in unit.churchId) {
      return `${unit.churchId.churchNumber}-${unit.unitNumber}-${this.bavanakutayimaNumber}`;
    }
    return String(this.bavanakutayimaNumber);
  }
  return String(this.bavanakutayimaNumber);
});

// Ensure virtuals are included in JSON
bavanakutayimaSchema.set('toJSON', { virtuals: true });
bavanakutayimaSchema.set('toObject', { virtuals: true });

export default mongoose.model<IBavanakutayima>('Bavanakutayima', bavanakutayimaSchema);

import mongoose, { Schema } from 'mongoose';
import { IHouse } from '../types';

const houseSchema = new Schema<IHouse>(
  {
    bavanakutayimaId: {
      type: Schema.Types.ObjectId,
      ref: 'Bavanakutayima',
      required: [true, 'Bavanakutayima ID is required'],
    },
    houseNumber: {
      type: Number,
      required: true,
    },
    uniqueId: {
      type: String,
      required: true,
      unique: true,
    },
    familyName: {
      type: String,
      required: [true, 'Family name is required'],
      trim: true,
    },
    headOfFamily: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    houseCode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

houseSchema.index({ bavanakutayimaId: 1 });

// Virtual field for hierarchical number
// Will be computed as: churchNumber-unitNumber-bavanakutayimaNumber-houseNumber
// The bavanakutayima.unitId.churchId data needs to be populated for this to work
houseSchema.virtual('hierarchicalNumber').get(function() {
  if (this.populated('bavanakutayimaId') && typeof this.bavanakutayimaId === 'object' && 'bavanakutayimaNumber' in this.bavanakutayimaId) {
    const bk = this.bavanakutayimaId as any;
    if (bk.unitId && typeof bk.unitId === 'object' && 'unitNumber' in bk.unitId) {
      const unit = bk.unitId;
      if (unit.churchId && typeof unit.churchId === 'object' && 'churchNumber' in unit.churchId) {
        return `${unit.churchId.churchNumber}-${unit.unitNumber}-${bk.bavanakutayimaNumber}-${this.houseNumber}`;
      }
    }
  }
  return String(this.houseNumber);
});

// Ensure virtuals are included in JSON
houseSchema.set('toJSON', { virtuals: true });
houseSchema.set('toObject', { virtuals: true });

export default mongoose.model<IHouse>('House', houseSchema);

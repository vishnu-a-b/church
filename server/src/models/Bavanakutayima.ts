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

export default mongoose.model<IBavanakutayima>('Bavanakutayima', bavanakutayimaSchema);

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

export default mongoose.model<IHouse>('House', houseSchema);

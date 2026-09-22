import mongoose, { Schema } from 'mongoose';
import { IThirukkarmangalBooking } from '../types';

const thirukkarmangalBookingSchema = new Schema<IThirukkarmangalBooking>(
  {
    churchId: { type: Schema.Types.ObjectId, ref: 'Church', required: true },
    riteId: { type: Schema.Types.ObjectId, ref: 'ThirukkarmangalRite', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    houseId: { type: Schema.Types.ObjectId, ref: 'House', required: true },
    unitId: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    bavanakutayimaId: { type: Schema.Types.ObjectId, ref: 'Bavanakutayima' },
    scheduledDate: { type: Date, required: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Member' },
  },
  { timestamps: true }
);

thirukkarmangalBookingSchema.index({ churchId: 1, scheduledDate: -1 });
thirukkarmangalBookingSchema.index({ churchId: 1, status: 1 });
thirukkarmangalBookingSchema.index({ churchId: 1, memberId: 1 });

export default mongoose.model<IThirukkarmangalBooking>('ThirukkarmangalBooking', thirukkarmangalBookingSchema);

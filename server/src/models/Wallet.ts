import mongoose, { Schema } from 'mongoose';
import { IWallet } from '../types';

const walletSchema = new Schema<IWallet>(
  {
    walletType: {
      type: String,
      enum: ['member', 'house'],
      required: [true, 'Wallet type is required'],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Owner ID is required'],
      refPath: 'ownerModel',
    },
    ownerModel: {
      type: String,
      required: true,
      enum: ['Member', 'House'],
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [
      {
        transactionId: {
          type: Schema.Types.ObjectId,
          ref: 'Transaction',
        },
        amount: {
          type: Number,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

walletSchema.index({ ownerId: 1, walletType: 1 }, { unique: true });

export default mongoose.model<IWallet>('Wallet', walletSchema);

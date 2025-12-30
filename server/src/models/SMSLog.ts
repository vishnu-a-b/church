import mongoose, { Schema } from 'mongoose';
import { ISMSLog } from '../types';

const smsLogSchema = new Schema<ISMSLog>(
  {
    recipientType: {
      type: String,
      enum: ['member', 'house_head'],
      required: [true, 'Recipient type is required'],
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Recipient ID is required'],
      refPath: 'recipientModel',
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['Member', 'House'],
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    messageType: {
      type: String,
      enum: ['payment_added', 'receipt_confirmation'],
      required: [true, 'Message type is required'],
    },
    templateUsed: {
      type: String,
      trim: true,
    },
    messageContent: {
      type: String,
      required: [true, 'Message content is required'],
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent',
    },
    deliveryStatus: {
      sentTo: {
        type: String,
      },
      messageId: {
        type: String,
      },
      deliveredAt: {
        type: Date,
      },
      failureReason: {
        type: String,
      },
    },
    cost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

smsLogSchema.index({ transactionId: 1 });
smsLogSchema.index({ phoneNumber: 1 });
smsLogSchema.index({ sentAt: -1 });

export default mongoose.model<ISMSLog>('SMSLog', smsLogSchema);

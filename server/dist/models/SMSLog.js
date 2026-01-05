"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const smsLogSchema = new mongoose_1.Schema({
    recipientType: {
        type: String,
        enum: ['member', 'house_head'],
        required: [true, 'Recipient type is required'],
    },
    recipientId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
smsLogSchema.index({ transactionId: 1 });
smsLogSchema.index({ phoneNumber: 1 });
smsLogSchema.index({ sentAt: -1 });
exports.default = mongoose_1.default.model('SMSLog', smsLogSchema);
//# sourceMappingURL=SMSLog.js.map
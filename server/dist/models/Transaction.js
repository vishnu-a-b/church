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
const transactionSchema = new mongoose_1.Schema({
    receiptNumber: {
        type: String,
        required: [true, 'Receipt number is required'],
        unique: true,
        trim: true,
    },
    transactionType: {
        type: String,
        enum: ['lelam', 'thirunnaal_panam', 'dashamansham', 'spl_contribution', 'stothrakazhcha'],
        required: [true, 'Transaction type is required'],
    },
    contributionMode: {
        type: String,
        enum: ['fixed', 'variable'],
    },
    campaignId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Campaign',
    },
    distribution: {
        type: String,
        enum: ['member_only', 'house_only', 'both'],
    },
    memberAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    houseAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: 0,
    },
    memberId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Member',
    },
    houseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'House',
    },
    unitId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Unit',
    },
    churchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Church',
        required: [true, 'Church ID is required'],
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'upi', 'cheque'],
        default: 'cash',
    },
    notes: {
        type: String,
        trim: true,
    },
    smsNotificationSent: {
        type: Boolean,
        default: false,
    },
    smsLogId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'SMSLog',
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by is required'],
    },
}, {
    timestamps: true,
});
// Indexes for fast filtering and search
transactionSchema.index({ receiptNumber: 1 });
transactionSchema.index({ churchId: 1 });
transactionSchema.index({ unitId: 1 });
transactionSchema.index({ houseId: 1 });
transactionSchema.index({ memberId: 1 });
// Compound indexes for hierarchical filtering and date-based queries
transactionSchema.index({ churchId: 1, paymentDate: -1 });
transactionSchema.index({ churchId: 1, unitId: 1 });
transactionSchema.index({ churchId: 1, unitId: 1, houseId: 1 });
transactionSchema.index({ churchId: 1, transactionType: 1, paymentDate: -1 });
// Indexes for reporting and analytics
transactionSchema.index({ transactionType: 1, paymentDate: -1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ campaignId: 1 });
transactionSchema.index({ paymentDate: -1 });
transactionSchema.index({ createdBy: 1 });
exports.default = mongoose_1.default.model('Transaction', transactionSchema);
//# sourceMappingURL=Transaction.js.map
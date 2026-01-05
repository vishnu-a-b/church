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
const campaignDueSchema = new mongoose_1.Schema({
    churchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Church',
        required: [true, 'Church ID is required'],
        index: true,
    },
    campaignId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: [true, 'Campaign ID is required'],
        index: true,
    },
    campaignName: {
        type: String,
        required: [true, 'Campaign name is required'],
        trim: true,
    },
    dueForId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Due for ID is required'],
        refPath: 'dueForModel',
    },
    dueForModel: {
        type: String,
        required: true,
        enum: ['Member', 'House'],
    },
    dueForName: {
        type: String,
        required: [true, 'Due for name is required'],
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: 0,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
    },
    transactionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Transaction',
    },
    paidAt: {
        type: Date,
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
// Compound index to ensure one due per member/house per campaign
campaignDueSchema.index({ campaignId: 1, dueForId: 1 }, { unique: true });
// Index for finding unpaid dues
campaignDueSchema.index({ isPaid: 1, dueDate: 1 });
// Index for finding dues by member/house
campaignDueSchema.index({ dueForId: 1, dueForModel: 1 });
// Index for church-level queries
campaignDueSchema.index({ churchId: 1, isPaid: 1 });
exports.default = mongoose_1.default.model('CampaignDue', campaignDueSchema);
//# sourceMappingURL=CampaignDue.js.map
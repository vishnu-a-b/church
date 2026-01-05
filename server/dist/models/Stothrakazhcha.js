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
const stothrakazhchaSchema = new mongoose_1.Schema({
    churchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Church',
        required: [true, 'Church ID is required'],
        index: true,
    },
    weekNumber: {
        type: Number,
        required: [true, 'Week number is required'],
        min: 1,
        max: 53,
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
    },
    weekStartDate: {
        type: Date,
        required: [true, 'Week start date is required'],
    },
    weekEndDate: {
        type: Date,
        required: [true, 'Week end date is required'],
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    defaultAmount: {
        type: Number,
        required: [true, 'Default amount is required'],
        min: 0,
    },
    amountType: {
        type: String,
        enum: ['per_member', 'per_house'],
        default: 'per_member',
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'processed'],
        default: 'active',
    },
    contributors: [{
            contributorId: {
                type: mongoose_1.Schema.Types.ObjectId,
                required: true,
            },
            contributorType: {
                type: String,
                enum: ['Member', 'House'],
                required: true,
            },
            amount: {
                type: Number,
                required: true,
                min: 0,
            },
            transactionId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Transaction',
            },
            contributedAt: {
                type: Date,
                default: Date.now,
            },
        }],
    totalCollected: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalContributors: {
        type: Number,
        default: 0,
        min: 0,
    },
    duesProcessed: {
        type: Boolean,
        default: false,
    },
    duesProcessedAt: {
        type: Date,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
// Compound index for unique week per church per year
stothrakazhchaSchema.index({ churchId: 1, year: 1, weekNumber: 1 }, { unique: true });
// Index for finding active stothrakazhcha
stothrakazhchaSchema.index({ status: 1, dueDate: 1 });
exports.default = mongoose_1.default.model('Stothrakazhcha', stothrakazhchaSchema);
//# sourceMappingURL=Stothrakazhcha.js.map
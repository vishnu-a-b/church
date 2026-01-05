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
const spiritualActivitySchema = new mongoose_1.Schema({
    memberId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'Member ID is required'],
    },
    activityType: {
        type: String,
        enum: ['mass', 'fasting', 'prayer'],
        required: [true, 'Activity type is required'],
    },
    massDate: {
        type: Date,
    },
    massAttended: {
        type: Boolean,
        default: false,
    },
    fastingWeek: {
        type: String,
    },
    fastingDays: [
        {
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
    ],
    prayerType: {
        type: String,
        enum: ['rosary', 'divine_mercy', 'stations', 'other'],
    },
    prayerCount: {
        type: Number,
        min: 0,
    },
    prayerWeek: {
        type: String,
    },
    selfReported: {
        type: Boolean,
        default: false,
    },
    reportedAt: {
        type: Date,
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Indexes for fast filtering and search
spiritualActivitySchema.index({ memberId: 1 });
spiritualActivitySchema.index({ activityType: 1 });
spiritualActivitySchema.index({ memberId: 1, activityType: 1 });
// Date-based indexes for reporting
spiritualActivitySchema.index({ massDate: 1 });
spiritualActivitySchema.index({ massDate: -1 });
spiritualActivitySchema.index({ fastingWeek: 1 });
spiritualActivitySchema.index({ prayerWeek: 1 });
// Compound indexes for common queries
spiritualActivitySchema.index({ activityType: 1, massDate: -1 });
spiritualActivitySchema.index({ activityType: 1, selfReported: 1 });
spiritualActivitySchema.index({ memberId: 1, createdAt: -1 });
// Verification indexes
spiritualActivitySchema.index({ verifiedBy: 1 });
spiritualActivitySchema.index({ selfReported: 1, verifiedAt: 1 });
exports.default = mongoose_1.default.model('SpiritualActivity', spiritualActivitySchema);
//# sourceMappingURL=SpiritualActivity.js.map
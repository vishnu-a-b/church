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
const churchSchema = new mongoose_1.Schema({
    churchNumber: {
        type: Number,
        required: true,
        unique: true,
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Church name is required'],
        trim: true,
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
    },
    diocese: {
        type: String,
        trim: true,
    },
    established: {
        type: Date,
    },
    contactPerson: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    settings: {
        smsEnabled: {
            type: Boolean,
            default: true,
        },
        smsProvider: {
            type: String,
            enum: ['fast2sms', 'msg91'],
            default: 'fast2sms',
        },
        smsApiKey: {
            type: String,
            select: false,
        },
        smsSenderId: {
            type: String,
            default: 'CHURCH',
        },
        currency: {
            type: String,
            default: 'INR',
        },
    },
}, {
    timestamps: true,
});
// Virtual field for hierarchical number (just the church number)
churchSchema.virtual('hierarchicalNumber').get(function () {
    return String(this.churchNumber);
});
// Ensure virtuals are included in JSON
churchSchema.set('toJSON', { virtuals: true });
churchSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('Church', churchSchema);
//# sourceMappingURL=Church.js.map
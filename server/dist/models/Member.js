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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const memberSchema = new mongoose_1.Schema({
    // Hierarchy references for fast filtering (denormalized for performance)
    churchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Church',
        required: [true, 'Church ID is required'],
    },
    unitId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Unit',
        required: [true, 'Unit ID is required'],
    },
    bavanakutayimaId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Bavanakutayima',
        required: [true, 'Bavanakutayima ID is required'],
    },
    houseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'House',
        required: [true, 'House ID is required'],
    },
    // Member identification
    memberNumber: {
        type: Number,
        required: true,
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true,
    },
    // Personal information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: [true, 'Gender is required'],
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
        unique: true,
        sparse: true, // Allows multiple null values
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    baptismName: {
        type: String,
        trim: true,
    },
    relationToHead: {
        type: String,
        enum: ['head', 'spouse', 'child', 'parent', 'other'],
        default: 'other',
    },
    // Login credentials (merged from User model)
    username: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values (not all members need login)
        trim: true,
        minlength: 3,
    },
    password: {
        type: String,
        minlength: 6,
        select: false, // Don't return password by default
    },
    role: {
        type: String,
        enum: ['super_admin', 'church_admin', 'unit_admin', 'kudumbakutayima_admin', 'member'],
        default: 'member',
    },
    lastLogin: {
        type: Date,
    },
    refreshToken: {
        type: String,
        select: false,
    },
    // Status and preferences
    isActive: {
        type: Boolean,
        default: true,
    },
    smsPreferences: {
        enabled: {
            type: Boolean,
            default: true,
        },
        paymentNotifications: {
            type: Boolean,
            default: true,
        },
        receiptNotifications: {
            type: Boolean,
            default: true,
        },
    },
}, {
    timestamps: true,
});
// Hash password before saving
memberSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    try {
        const salt = await bcrypt_1.default.genSalt(10);
        this.password = await bcrypt_1.default.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Method to compare passwords
memberSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt_1.default.compare(candidatePassword, this.password);
};
// Indexes for fast filtering and search (1:1:1:1 hierarchy)
memberSchema.index({ churchId: 1 });
memberSchema.index({ unitId: 1 });
memberSchema.index({ bavanakutayimaId: 1 });
memberSchema.index({ houseId: 1 });
// Compound indexes for hierarchical filtering
memberSchema.index({ churchId: 1, unitId: 1 });
memberSchema.index({ churchId: 1, unitId: 1, bavanakutayimaId: 1 });
memberSchema.index({ churchId: 1, unitId: 1, bavanakutayimaId: 1, houseId: 1 });
// Additional indexes for common queries
memberSchema.index({ phone: 1 });
memberSchema.index({ email: 1 });
memberSchema.index({ username: 1 });
memberSchema.index({ uniqueId: 1 });
memberSchema.index({ firstName: 1, lastName: 1 });
memberSchema.index({ isActive: 1 });
// Virtual field for hierarchical number
// Will be computed as: churchNumber-unitNumber-bavanakutayimaNumber-houseNumber-memberNumber
// The house.bavanakutayimaId.unitId.churchId data needs to be populated for this to work
memberSchema.virtual('hierarchicalNumber').get(function () {
    if (this.populated('houseId') && typeof this.houseId === 'object' && 'houseNumber' in this.houseId) {
        const house = this.houseId;
        if (house.bavanakutayimaId && typeof house.bavanakutayimaId === 'object' && 'bavanakutayimaNumber' in house.bavanakutayimaId) {
            const bk = house.bavanakutayimaId;
            if (bk.unitId && typeof bk.unitId === 'object' && 'unitNumber' in bk.unitId) {
                const unit = bk.unitId;
                if (unit.churchId && typeof unit.churchId === 'object' && 'churchNumber' in unit.churchId) {
                    return `${unit.churchId.churchNumber}-${unit.unitNumber}-${bk.bavanakutayimaNumber}-${house.houseNumber}-${this.memberNumber}`;
                }
            }
        }
    }
    return String(this.memberNumber);
});
// Ensure virtuals are included in JSON
memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('Member', memberSchema);
//# sourceMappingURL=Member.js.map
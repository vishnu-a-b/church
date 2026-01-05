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
const houseSchema = new mongoose_1.Schema({
    bavanakutayimaId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Bavanakutayima',
        required: [true, 'Bavanakutayima ID is required'],
    },
    houseNumber: {
        type: Number,
        required: true,
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true,
    },
    familyName: {
        type: String,
        required: [true, 'Family name is required'],
        trim: true,
    },
    headOfFamily: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    houseCode: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
houseSchema.index({ bavanakutayimaId: 1 });
// Virtual field for hierarchical number
// Will be computed as: churchNumber-unitNumber-bavanakutayimaNumber-houseNumber
// The bavanakutayima.unitId.churchId data needs to be populated for this to work
houseSchema.virtual('hierarchicalNumber').get(function () {
    if (this.populated('bavanakutayimaId') && typeof this.bavanakutayimaId === 'object' && 'bavanakutayimaNumber' in this.bavanakutayimaId) {
        const bk = this.bavanakutayimaId;
        if (bk.unitId && typeof bk.unitId === 'object' && 'unitNumber' in bk.unitId) {
            const unit = bk.unitId;
            if (unit.churchId && typeof unit.churchId === 'object' && 'churchNumber' in unit.churchId) {
                return `${unit.churchId.churchNumber}-${unit.unitNumber}-${bk.bavanakutayimaNumber}-${this.houseNumber}`;
            }
        }
    }
    return String(this.houseNumber);
});
// Ensure virtuals are included in JSON
houseSchema.set('toJSON', { virtuals: true });
houseSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('House', houseSchema);
//# sourceMappingURL=House.js.map
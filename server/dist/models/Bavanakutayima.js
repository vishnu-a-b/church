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
const bavanakutayimaSchema = new mongoose_1.Schema({
    unitId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Unit',
        required: [true, 'Unit ID is required'],
    },
    bavanakutayimaNumber: {
        type: Number,
        required: true,
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Bavanakutayima name is required'],
        trim: true,
    },
    leaderName: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});
bavanakutayimaSchema.index({ unitId: 1 });
// Virtual field for hierarchical number
// Will be computed as: churchNumber-unitNumber-bavanakutayimaNumber
// The unit.churchId data needs to be populated for this to work
bavanakutayimaSchema.virtual('hierarchicalNumber').get(function () {
    if (this.populated('unitId') && typeof this.unitId === 'object' && 'unitNumber' in this.unitId) {
        const unit = this.unitId;
        if (unit.populated && unit.populated('churchId') && typeof unit.churchId === 'object' && 'churchNumber' in unit.churchId) {
            return `${unit.churchId.churchNumber}-${unit.unitNumber}-${this.bavanakutayimaNumber}`;
        }
        else if (unit.churchId && typeof unit.churchId === 'object' && 'churchNumber' in unit.churchId) {
            return `${unit.churchId.churchNumber}-${unit.unitNumber}-${this.bavanakutayimaNumber}`;
        }
        return String(this.bavanakutayimaNumber);
    }
    return String(this.bavanakutayimaNumber);
});
// Ensure virtuals are included in JSON
bavanakutayimaSchema.set('toJSON', { virtuals: true });
bavanakutayimaSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('Bavanakutayima', bavanakutayimaSchema);
//# sourceMappingURL=Bavanakutayima.js.map
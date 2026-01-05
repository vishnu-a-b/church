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
const unitSchema = new mongoose_1.Schema({
    churchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Church',
        required: [true, 'Church ID is required'],
    },
    unitNumber: {
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
        required: [true, 'Unit name is required'],
        trim: true,
    },
    unitCode: {
        type: String,
        trim: true,
    },
    adminUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
unitSchema.index({ churchId: 1 });
// Virtual field for hierarchical number
// Will be computed as: churchNumber-unitNumber
// The church data needs to be populated for this to work
unitSchema.virtual('hierarchicalNumber').get(function () {
    if (this.populated('churchId') && typeof this.churchId === 'object' && 'churchNumber' in this.churchId) {
        return `${this.churchId.churchNumber}-${this.unitNumber}`;
    }
    return String(this.unitNumber);
});
// Ensure virtuals are included in JSON
unitSchema.set('toJSON', { virtuals: true });
unitSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('Unit', unitSchema);
//# sourceMappingURL=Unit.js.map
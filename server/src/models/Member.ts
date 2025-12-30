import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IMember } from '../types';

const memberSchema = new Schema<IMember>(
  {
    // Hierarchy references for fast filtering (denormalized for performance)
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: [true, 'Unit ID is required'],
    },
    bavanakutayimaId: {
      type: Schema.Types.ObjectId,
      ref: 'Bavanakutayima',
      required: [true, 'Bavanakutayima ID is required'],
    },
    houseId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
memberSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
memberSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
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

export default mongoose.model<IMember>('Member', memberSchema);

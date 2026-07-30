import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IDonor } from '../types';

const donorSchema = new Schema<IDonor>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'Church ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Login credentials (mirrors Member — not all donors need login)
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['donor'],
      default: 'donor',
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

donorSchema.index({ churchId: 1, isActive: 1 });
donorSchema.index({ churchId: 1, name: 1 });
donorSchema.index({ username: 1 });

// Hash password before saving
donorSchema.pre('save', async function (next) {
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
donorSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IDonor>('Donor', donorSchema);

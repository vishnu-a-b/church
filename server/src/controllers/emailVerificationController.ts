import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import Member from '../models/Member';

/**
 * Verify email using verification token
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Verification token is required',
      });
      return;
    }

    // Find member with this verification token
    const member = await Member.findOne({
      emailVerificationToken: token,
      isActive: true,
    }).select('+emailVerificationToken');

    if (!member) {
      res.status(404).json({
        success: false,
        error: 'Invalid or expired verification token',
      });
      return;
    }

    // Check if already verified
    if (member.isEmailVerified) {
      res.json({
        success: true,
        message: 'Email already verified',
        member: {
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          isEmailVerified: member.isEmailVerified,
          emailNotificationsEnabled: member.emailNotificationsEnabled,
        },
      });
      return;
    }

    // Update member verification status
    member.isEmailVerified = true;
    member.emailVerificationToken = undefined; // Clear the token
    await member.save();

    console.log(`✅ Email verified for member: ${member.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
      member: {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        isEmailVerified: member.isEmailVerified,
        emailNotificationsEnabled: member.emailNotificationsEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update email notification preferences
 */
export const updateEmailPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query;
    const { emailNotificationsEnabled } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Verification token is required',
      });
      return;
    }

    if (typeof emailNotificationsEnabled !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'emailNotificationsEnabled must be a boolean',
      });
      return;
    }

    // Find verified member with this verification token
    const member = await Member.findOne({
      emailVerificationToken: token,
      isEmailVerified: true,
      isActive: true,
    }).select('+emailVerificationToken');

    if (!member) {
      res.status(404).json({
        success: false,
        error: 'Invalid token or email not verified',
      });
      return;
    }

    // Update email notification preferences
    member.emailNotificationsEnabled = emailNotificationsEnabled;
    await member.save();

    console.log(`✅ Email preferences updated for member: ${member.email} - ${emailNotificationsEnabled ? 'Enabled' : 'Disabled'}`);

    res.json({
      success: true,
      message: 'Email notification preferences updated successfully',
      member: {
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        isEmailVerified: member.isEmailVerified,
        emailNotificationsEnabled: member.emailNotificationsEnabled,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a new verification token for a member
 * (Admin use only - for resending verification emails)
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export default {
  verifyEmail,
  updateEmailPreferences,
  generateVerificationToken,
};

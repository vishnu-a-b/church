import { Response, NextFunction } from 'express';
import User from '../models/User';
import Member from '../models/Member';
import Donor from '../models/Donor';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt';
import { AuthRequest } from '../types';

export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password, role, churchId, unitId, memberId } = req.body;

    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      res.status(400).json({
        success: false,
        error: 'User with this email or username already exists',
      });
      return;
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || 'member',
      churchId,
      unitId,
      memberId,
    });

    // Generate both access and refresh tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        churchId: user.churchId,
        unitId: user.unitId,
        memberId: user.memberId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, username, password } = req.body;
    const loginField = email || username;

    if (!loginField || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide email/username and password',
      });
      return;
    }

    const user = await User.findOne({
      $or: [{ email: loginField }, { username: loginField }],
    }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate both access and refresh tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        churchId: user.churchId,
        unitId: user.unitId,
        memberId: user.memberId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const memberLogin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide username/email/phone and password',
      });
      return;
    }

    // Find candidates by username, email, OR phone with populated hierarchy.
    // Phone is not unique (family members often share a household number), so
    // more than one member can match — disambiguate by trying each one's password.
    const candidates = await Member.find({
      $or: [
        { username: username },
        { email: username },
        { phone: username }
      ]
    })
      .select('+password')
      .populate('churchId', 'name uniqueId')
      .populate('unitId', 'name uniqueId')
      .populate('bavanakutayimaId', 'name uniqueId')
      .populate('houseId', 'familyName uniqueId');

    if (candidates.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    const loginableCandidates = candidates.filter((candidate) => !!candidate.password);

    if (loginableCandidates.length === 0) {
      res.status(401).json({
        success: false,
        error: 'This member account does not have login access',
      });
      return;
    }

    let member = null;
    for (const candidate of loginableCandidates) {
      if (await candidate.comparePassword(password)) {
        member = candidate;
        break;
      }
    }

    if (!member) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    if (!member.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
      return;
    }

    // Update last login
    member.lastLogin = new Date();

    // Generate both access and refresh tokens
    const accessToken = generateAccessToken(member._id.toString());
    const refreshToken = generateRefreshToken(member._id.toString());

    // Save refresh token to database
    member.refreshToken = refreshToken;
    await member.save();

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: member._id,
        username: member.username,
        email: member.email,
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        churchId: typeof member.churchId === 'object' && member.churchId ? (member.churchId as any)._id : member.churchId,
        unitId: typeof member.unitId === 'object' && member.unitId ? (member.unitId as any)._id : member.unitId,
        bavanakutayimaId: typeof member.bavanakutayimaId === 'object' && member.bavanakutayimaId ? (member.bavanakutayimaId as any)._id : member.bavanakutayimaId,
        houseId: typeof member.houseId === 'object' && member.houseId ? (member.houseId as any)._id : member.houseId,
        isActive: member.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const donorLogin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide username/email/phone and password',
      });
      return;
    }

    // Phone is not unique (family members often share a household number), so
    // more than one donor can match — disambiguate by trying each one's password.
    const candidates = await Donor.find({
      $or: [{ username: username }, { email: username }, { phone: username }],
    })
      .select('+password')
      .populate('churchId', 'name uniqueId');

    if (candidates.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    const loginableCandidates = candidates.filter((candidate) => !!candidate.password);

    if (loginableCandidates.length === 0) {
      res.status(401).json({
        success: false,
        error: 'This donor account does not have login access',
      });
      return;
    }

    let donor = null;
    for (const candidate of loginableCandidates) {
      if (await candidate.comparePassword(password)) {
        donor = candidate;
        break;
      }
    }

    if (!donor) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    if (!donor.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
      return;
    }

    donor.lastLogin = new Date();

    const accessToken = generateAccessToken(donor._id.toString());
    const refreshTokenValue = generateRefreshToken(donor._id.toString());

    donor.refreshToken = refreshTokenValue;
    await donor.save();

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: donor._id,
        username: donor.username,
        email: donor.email,
        name: donor.name,
        role: donor.role,
        churchId: typeof donor.churchId === 'object' && donor.churchId ? (donor.churchId as any)._id : donor.churchId,
        isActive: donor.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
      return;
    }

    // Try to find in User model first
    let user = await User.findById(decoded.id).select('+refreshToken');
    let isMember = false;
    let isDonor = false;

    // If not found in User, try Member model
    if (!user) {
      user = await Member.findById(decoded.id).select('+refreshToken') as any;
      isMember = true;
    }

    // If not found in Member either, try Donor model
    if (!user) {
      user = await Donor.findById(decoded.id).select('+refreshToken') as any;
      isMember = false;
      isDonor = true;
    }

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
      return;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      userType: isDonor ? 'donor' : isMember ? 'member' : 'user', // For debugging
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id)
      .populate('churchId', 'name location')
      .populate('unitId', 'name unitNumber')
      .populate('memberId', 'firstName lastName phone');

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Remove refresh token from database
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Please provide current and new password',
      });
      return;
    }

    const user = await User.findById(req.user?.id).select('+password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    // Update password
    user.password = newPassword;

    // Invalidate all refresh tokens on password change
    user.refreshToken = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    next(error);
  }
};

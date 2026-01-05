import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

type UserRole = 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member';

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Role '${req.user.role}' is not authorized to access this route`,
      });
      return;
    }

    next();
  };
};

export const isSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      error: 'Only super admins can access this route',
    });
    return;
  }
  next();
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !['super_admin', 'unit_admin'].includes(req.user.role)) {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }
  next();
};

export const canAccessChurch = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const churchId = req.params.churchId || req.body.churchId;

  if (req.user?.role === 'super_admin') {
    return next();
  }

  if (req.user?.churchId && req.user.churchId.toString() === churchId) {
    return next();
  }

  res.status(403).json({
    success: false,
    error: 'Not authorized to access this church',
  });
};

export const canAccessUnit = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const unitId = req.params.unitId || req.body.unitId;

  if (req.user?.role === 'super_admin') {
    return next();
  }

  if (req.user?.role === 'unit_admin' && req.user.unitId && req.user.unitId.toString() === unitId) {
    return next();
  }

  res.status(403).json({
    success: false,
    error: 'Not authorized to access this unit',
  });
};

export const canAccessMember = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const memberId = req.params.memberId || req.body.memberId;

  if (req.user && ['super_admin', 'unit_admin'].includes(req.user.role)) {
    return next();
  }

  if (req.user?.role === 'member' && req.user.memberId && req.user.memberId.toString() === memberId) {
    return next();
  }

  res.status(403).json({
    success: false,
    error: 'Not authorized to access this member',
  });
};

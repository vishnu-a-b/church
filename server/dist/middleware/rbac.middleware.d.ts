import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
type UserRole = 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin' | 'member';
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const isSuperAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const isAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const canAccessChurch: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const canAccessUnit: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const canAccessMember: (req: AuthRequest, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=rbac.middleware.d.ts.map
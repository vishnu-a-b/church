import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getAllStothrakazhcha: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStothrakazhchaById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createStothrakazhcha: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateStothrakazhcha: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteStothrakazhcha: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getCurrentWeekStothrakazhcha: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const addContribution: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=stothrakazhchaController.d.ts.map
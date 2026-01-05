import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getAllChurches: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getChurchById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createChurch: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateChurch: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteChurch: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=churchController.d.ts.map
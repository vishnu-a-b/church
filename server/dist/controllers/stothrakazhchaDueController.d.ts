import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const getAllStothrakazhchaDues: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getStothrakazhchaDueById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getDuesForEntity: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const processStothrakazhchaDues: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const markDueAsPaid: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteStothrakazhchaDue: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=stothrakazhchaDueController.d.ts.map
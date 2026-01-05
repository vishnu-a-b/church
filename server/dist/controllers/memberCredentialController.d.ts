import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare const generateMemberCredentials: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const resetMemberPassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMembersWithCredentials: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMembersWithoutCredentials: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const bulkGenerateCredentials: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const removeMemberCredentials: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const exportCredentialsList: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=memberCredentialController.d.ts.map
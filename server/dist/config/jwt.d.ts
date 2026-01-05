interface TokenPayload {
    id: string;
}
export declare const generateAccessToken: (userId: string) => string;
export declare const generateRefreshToken: (userId: string) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload | null;
export declare const verifyRefreshToken: (token: string) => TokenPayload | null;
export declare const generateToken: (userId: string) => string;
export declare const verifyToken: (token: string) => TokenPayload | null;
export {};
//# sourceMappingURL=jwt.d.ts.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken = (userId) => {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRE || '15m';
    return jsonwebtoken_1.default.sign({ id: userId }, secret, { expiresIn });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    const secret = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-change-in-production';
    const expiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRE || '7d';
    return jsonwebtoken_1.default.sign({ id: userId }, secret, { expiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    try {
        const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
        const result = jsonwebtoken_1.default.verify(token, secret);
        console.log('[JWT] Token verified successfully for user:', result.id);
        return result;
    }
    catch (error) {
        console.error('[JWT] Token verification failed:', error.message);
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        const secret = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-change-in-production';
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
// Backward compatibility - keeping old function name
exports.generateToken = exports.generateAccessToken;
exports.verifyToken = exports.verifyAccessToken;
//# sourceMappingURL=jwt.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jwt_1 = require("../config/jwt");
const User_1 = __importDefault(require("../models/User"));
const Member_1 = __importDefault(require("../models/Member"));
const protect = async (req, res, next) => {
    try {
        console.log('[AUTH] Protecting route:', req.method, req.path);
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('[AUTH] Token received, length:', token.length);
        }
        else {
            console.log('[AUTH] No Authorization header or invalid format');
        }
        if (!token) {
            console.log('[AUTH] ❌ No token found');
            res.status(401).json({
                success: false,
                error: 'Not authorized to access this route',
            });
            return;
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        if (!decoded) {
            console.log('[AUTH] ❌ Token verification failed');
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
            return;
        }
        console.log('[AUTH] ✓ Token verified for ID:', decoded.id);
        // Try to find as User first
        let user = await User_1.default.findById(decoded.id).select('-password');
        // If not found as User, try to find as Member
        if (!user) {
            console.log('[AUTH] Not found in User collection, checking Member collection...');
            const member = await Member_1.default.findById(decoded.id).select('-password');
            if (member) {
                console.log('[AUTH] ✓ Found as Member:', member.username, member.role);
                // Convert member to user-like object for compatibility
                req.user = {
                    _id: member._id,
                    email: member.email,
                    username: member.username,
                    role: member.role,
                    isActive: member.isActive,
                    churchId: member.churchId,
                    unitId: member.unitId,
                    bavanakutayimaId: member.bavanakutayimaId,
                    memberId: member._id, // For getMyProfile
                };
                next();
                return;
            }
            console.log('[AUTH] ❌ Not found in User or Member collection:', decoded.id);
            res.status(401).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        if (!user.isActive) {
            console.log('[AUTH] ❌ User account is deactivated');
            res.status(401).json({
                success: false,
                error: 'Account is deactivated',
            });
            return;
        }
        console.log('[AUTH] ✓ Auth successful for:', user.email, user.role);
        req.user = user;
        next();
    }
    catch (error) {
        console.error('[AUTH] ❌ Exception in protect middleware:', error);
        res.status(401).json({
            success: false,
            error: 'Not authorized to access this route',
        });
    }
};
exports.protect = protect;
//# sourceMappingURL=auth.middleware.js.map
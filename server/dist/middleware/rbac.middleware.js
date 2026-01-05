"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessMember = exports.canAccessUnit = exports.canAccessChurch = exports.isAdmin = exports.isSuperAdmin = exports.authorize = void 0;
const authorize = (...roles) => {
    return (req, res, next) => {
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
exports.authorize = authorize;
const isSuperAdmin = (req, res, next) => {
    if (req.user?.role !== 'super_admin') {
        res.status(403).json({
            success: false,
            error: 'Only super admins can access this route',
        });
        return;
    }
    next();
};
exports.isSuperAdmin = isSuperAdmin;
const isAdmin = (req, res, next) => {
    if (!req.user || !['super_admin', 'unit_admin'].includes(req.user.role)) {
        res.status(403).json({
            success: false,
            error: 'Admin access required',
        });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
const canAccessChurch = (req, res, next) => {
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
exports.canAccessChurch = canAccessChurch;
const canAccessUnit = (req, res, next) => {
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
exports.canAccessUnit = canAccessUnit;
const canAccessMember = (req, res, next) => {
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
exports.canAccessMember = canAccessMember;
//# sourceMappingURL=rbac.middleware.js.map
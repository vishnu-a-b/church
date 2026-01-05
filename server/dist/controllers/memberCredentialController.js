"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCredentialsList = exports.removeMemberCredentials = exports.bulkGenerateCredentials = exports.getMembersWithoutCredentials = exports.getMembersWithCredentials = exports.resetMemberPassword = exports.generateMemberCredentials = void 0;
const Member_1 = __importDefault(require("../models/Member"));
// Generate default credentials for a member
const generateMemberCredentials = async (req, res, next) => {
    try {
        const { id } = req.params;
        const member = await Member_1.default.findById(id);
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        // Church admin restriction
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(member.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Cannot generate credentials for member from another church' });
                return;
            }
        }
        // Check if member already has credentials
        if (member.username) {
            res.status(400).json({
                success: false,
                error: 'Member already has credentials. Use reset password instead.'
            });
            return;
        }
        // Generate username from uniqueId or phone
        const username = member.uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Generate default password (member phone number or uniqueId)
        const defaultPassword = member.phone || member.uniqueId.replace(/[^0-9]/g, '').slice(-6);
        // Update member with credentials
        member.username = username;
        member.password = defaultPassword; // Will be hashed by pre-save hook
        member.role = member.role || 'member';
        await member.save();
        res.json({
            success: true,
            message: 'Credentials generated successfully',
            data: {
                username,
                tempPassword: defaultPassword, // Return only once, won't be retrievable later
                memberId: member._id,
                memberName: `${member.firstName} ${member.lastName || ''}`.trim()
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.generateMemberCredentials = generateMemberCredentials;
// Reset member password
const resetMemberPassword = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
            return;
        }
        const member = await Member_1.default.findById(id);
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        // Church admin restriction
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(member.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Cannot reset password for member from another church' });
                return;
            }
        }
        if (!member.username) {
            res.status(400).json({
                success: false,
                error: 'Member does not have login credentials. Generate credentials first.'
            });
            return;
        }
        // Update password
        member.password = newPassword; // Will be hashed by pre-save hook
        await member.save();
        res.json({
            success: true,
            message: 'Password reset successfully',
            data: {
                username: member.username,
                newPassword: newPassword, // Return only once
                memberId: member._id
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetMemberPassword = resetMemberPassword;
// Get all members with credentials (username only, no passwords)
const getMembersWithCredentials = async (req, res, next) => {
    try {
        const filter = { username: { $exists: true, $ne: null } };
        // Church admin restriction
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const members = await Member_1.default.find(filter)
            .select('uniqueId firstName lastName username role phone email isActive churchId unitId bavanakutayimaId houseId')
            .populate('churchId', 'name')
            .populate('unitId', 'name')
            .populate('bavanakutayimaId', 'name')
            .populate('houseId', 'familyName')
            .sort({ firstName: 1, lastName: 1 });
        res.json({
            success: true,
            count: members.length,
            data: members
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMembersWithCredentials = getMembersWithCredentials;
// Get members WITHOUT credentials
const getMembersWithoutCredentials = async (req, res, next) => {
    try {
        const filter = {
            $or: [
                { username: { $exists: false } },
                { username: null }
            ],
            isActive: true
        };
        // Church admin restriction
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const members = await Member_1.default.find(filter)
            .select('uniqueId firstName lastName phone email isActive churchId unitId bavanakutayimaId houseId')
            .populate('churchId', 'name')
            .populate('unitId', 'name')
            .populate('bavanakutayimaId', 'name')
            .populate('houseId', 'familyName')
            .sort({ firstName: 1, lastName: 1 });
        res.json({
            success: true,
            count: members.length,
            data: members
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMembersWithoutCredentials = getMembersWithoutCredentials;
// Bulk generate credentials for all members without login
const bulkGenerateCredentials = async (req, res, next) => {
    try {
        // Only allow super_admin or church_admin
        if (!['super_admin', 'church_admin'].includes(req.user?.role || '')) {
            res.status(403).json({
                success: false,
                error: 'Only admins can bulk generate credentials'
            });
            return;
        }
        const filter = {
            $or: [
                { username: { $exists: false } },
                { username: null }
            ],
            isActive: true
        };
        // Church admin restriction
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const members = await Member_1.default.find(filter);
        const generatedCredentials = [];
        for (const member of members) {
            try {
                // Generate username from uniqueId
                const username = member.uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '');
                // Generate default password (phone or last 6 digits of uniqueId)
                const defaultPassword = member.phone || member.uniqueId.replace(/[^0-9]/g, '').slice(-6);
                member.username = username;
                member.password = defaultPassword;
                member.role = member.role || 'member';
                await member.save();
                generatedCredentials.push({
                    memberId: member._id,
                    memberName: `${member.firstName} ${member.lastName || ''}`.trim(),
                    uniqueId: member.uniqueId,
                    username,
                    tempPassword: defaultPassword
                });
            }
            catch (error) {
                console.error(`Error generating credentials for member ${member._id}:`, error);
            }
        }
        res.json({
            success: true,
            message: `Credentials generated for ${generatedCredentials.length} members`,
            count: generatedCredentials.length,
            data: generatedCredentials
        });
    }
    catch (error) {
        next(error);
    }
};
exports.bulkGenerateCredentials = bulkGenerateCredentials;
// Remove/disable member login credentials
const removeMemberCredentials = async (req, res, next) => {
    try {
        const { id } = req.params;
        const member = await Member_1.default.findById(id);
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        // Church admin restriction
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(member.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Cannot remove credentials for member from another church' });
                return;
            }
        }
        // Clear credentials
        member.username = undefined;
        member.password = undefined;
        member.refreshToken = undefined;
        await member.save();
        res.json({
            success: true,
            message: 'Member credentials removed successfully',
            data: {
                memberId: member._id,
                memberName: `${member.firstName} ${member.lastName || ''}`.trim()
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.removeMemberCredentials = removeMemberCredentials;
// Export credentials list (for printing/distribution)
const exportCredentialsList = async (req, res, next) => {
    try {
        const filter = { username: { $exists: true, $ne: null } };
        // Church admin restriction
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const members = await Member_1.default.find(filter)
            .select('uniqueId firstName lastName username role phone churchId unitId bavanakutayimaId houseId')
            .populate('churchId', 'name')
            .populate('unitId', 'name')
            .populate('bavanakutayimaId', 'name')
            .populate('houseId', 'familyName')
            .sort({ firstName: 1, lastName: 1 });
        // Format for export
        const exportData = members.map(member => ({
            UniqueID: member.uniqueId,
            Name: `${member.firstName} ${member.lastName || ''}`.trim(),
            Username: member.username,
            Role: member.role,
            Phone: member.phone || 'N/A',
            Church: member.churchId?.name || 'N/A',
            Unit: member.unitId?.name || 'N/A',
            Bavanakutayima: member.bavanakutayimaId?.name || 'N/A',
            House: member.houseId?.familyName || 'N/A'
        }));
        res.json({
            success: true,
            count: exportData.length,
            data: exportData
        });
    }
    catch (error) {
        next(error);
    }
};
exports.exportCredentialsList = exportCredentialsList;
//# sourceMappingURL=memberCredentialController.js.map
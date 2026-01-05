"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addContribution = exports.getCurrentWeekStothrakazhcha = exports.deleteStothrakazhcha = exports.updateStothrakazhcha = exports.createStothrakazhcha = exports.getStothrakazhchaById = exports.getAllStothrakazhcha = void 0;
const Stothrakazhcha_1 = __importDefault(require("../models/Stothrakazhcha"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Member_1 = __importDefault(require("../models/Member"));
const House_1 = __importDefault(require("../models/House"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
// Get all Stothrakazhcha
const getAllStothrakazhcha = async (req, res, next) => {
    try {
        const filter = {};
        // Church admin restriction
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const stothrakazhchas = await Stothrakazhcha_1.default.find(filter)
            .populate('churchId', 'name')
            .sort({ year: -1, weekNumber: -1 });
        res.json({ success: true, data: stothrakazhchas });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllStothrakazhcha = getAllStothrakazhcha;
// Get Stothrakazhcha by ID
const getStothrakazhchaById = async (req, res, next) => {
    try {
        const stothrakazhcha = await Stothrakazhcha_1.default.findById(req.params.id)
            .populate('churchId', 'name')
            .lean();
        if (!stothrakazhcha) {
            res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
            return;
        }
        // Populate contributors with member/house details
        if (stothrakazhcha.contributors && stothrakazhcha.contributors.length > 0) {
            const populatedContributors = await Promise.all(stothrakazhcha.contributors.map(async (contributor) => {
                if (contributor.contributorType === 'Member') {
                    const member = await Member_1.default.findById(contributor.contributorId)
                        .select('firstName lastName email houseId memberNumber')
                        .populate({
                        path: 'houseId',
                        select: 'familyName houseNumber',
                        populate: {
                            path: 'bavanakutayimaId',
                            select: 'name bavanakutayimaNumber',
                            populate: {
                                path: 'unitId',
                                select: 'name unitNumber',
                                populate: {
                                    path: 'churchId',
                                    select: 'name churchNumber'
                                }
                            }
                        }
                    })
                        .lean();
                    // Manually compute hierarchical number
                    let hierarchicalNumber;
                    if (member && typeof member.houseId === 'object' && member.houseId !== null) {
                        const house = member.houseId;
                        if (house.bavanakutayimaId && typeof house.bavanakutayimaId === 'object') {
                            const bk = house.bavanakutayimaId;
                            if (bk.unitId && typeof bk.unitId === 'object') {
                                const unit = bk.unitId;
                                if (unit.churchId && typeof unit.churchId === 'object') {
                                    const church = unit.churchId;
                                    hierarchicalNumber = `${church.churchNumber}-${unit.unitNumber}-${bk.bavanakutayimaNumber}-${house.houseNumber}-${member.memberNumber}`;
                                }
                            }
                        }
                    }
                    return {
                        ...contributor,
                        member: {
                            ...member,
                            hierarchicalNumber
                        },
                        house: member?.houseId
                    };
                }
                else {
                    // It's a House contributor
                    const house = await House_1.default.findById(contributor.contributorId)
                        .select('familyName houseNumber')
                        .populate({
                        path: 'bavanakutayimaId',
                        select: 'name bavanakutayimaNumber',
                        populate: {
                            path: 'unitId',
                            select: 'name unitNumber',
                            populate: {
                                path: 'churchId',
                                select: 'name churchNumber'
                            }
                        }
                    })
                        .lean();
                    // Manually compute hierarchical number
                    let hierarchicalNumber;
                    if (house && house.bavanakutayimaId && typeof house.bavanakutayimaId === 'object') {
                        const bk = house.bavanakutayimaId;
                        if (bk.unitId && typeof bk.unitId === 'object') {
                            const unit = bk.unitId;
                            if (unit.churchId && typeof unit.churchId === 'object') {
                                const church = unit.churchId;
                                hierarchicalNumber = `${church.churchNumber}-${unit.unitNumber}-${bk.bavanakutayimaNumber}-${house.houseNumber}`;
                            }
                        }
                    }
                    return {
                        ...contributor,
                        house: {
                            ...house,
                            hierarchicalNumber
                        }
                    };
                }
            }));
            stothrakazhcha.contributors = populatedContributors;
        }
        res.json({ success: true, data: stothrakazhcha });
    }
    catch (error) {
        next(error);
    }
};
exports.getStothrakazhchaById = getStothrakazhchaById;
// Create Stothrakazhcha
const createStothrakazhcha = async (req, res, next) => {
    try {
        // Church admin restriction
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            req.body.churchId = req.user.churchId;
        }
        req.body.createdBy = req.user?._id;
        const stothrakazhcha = await Stothrakazhcha_1.default.create(req.body);
        const populated = await Stothrakazhcha_1.default.findById(stothrakazhcha._id).populate('churchId', 'name');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: 'Stothrakazhcha for this week already exists'
            });
            return;
        }
        next(error);
    }
};
exports.createStothrakazhcha = createStothrakazhcha;
// Update Stothrakazhcha
const updateStothrakazhcha = async (req, res, next) => {
    try {
        const existing = await Stothrakazhcha_1.default.findById(req.params.id);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
            return;
        }
        // Church admin restriction
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(existing.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Cannot update stothrakazhcha from another church' });
                return;
            }
        }
        const stothrakazhcha = await Stothrakazhcha_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('churchId', 'name');
        res.json({ success: true, data: stothrakazhcha });
    }
    catch (error) {
        next(error);
    }
};
exports.updateStothrakazhcha = updateStothrakazhcha;
// Delete Stothrakazhcha
const deleteStothrakazhcha = async (req, res, next) => {
    try {
        const stothrakazhcha = await Stothrakazhcha_1.default.findById(req.params.id);
        if (!stothrakazhcha) {
            res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
            return;
        }
        // Church admin restriction
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(stothrakazhcha.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Cannot delete stothrakazhcha from another church' });
                return;
            }
        }
        await Stothrakazhcha_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Stothrakazhcha deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteStothrakazhcha = deleteStothrakazhcha;
// Get current week's Stothrakazhcha
const getCurrentWeekStothrakazhcha = async (req, res, next) => {
    try {
        const now = new Date();
        const filter = {
            weekStartDate: { $lte: now },
            weekEndDate: { $gte: now },
            status: 'active'
        };
        // Filter by user's church if available
        if (req.user?.churchId) {
            filter.churchId = req.user.churchId;
        }
        const stothrakazhcha = await Stothrakazhcha_1.default.findOne(filter)
            .populate('churchId', 'name');
        if (!stothrakazhcha) {
            res.status(404).json({ success: false, error: 'No active stothrakazhcha for current week' });
            return;
        }
        res.json({ success: true, data: stothrakazhcha });
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentWeekStothrakazhcha = getCurrentWeekStothrakazhcha;
// Add contribution to Stothrakazhcha (Member or Admin endpoint)
const addContribution = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, memberId: providedMemberId } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ success: false, error: 'Valid amount is required' });
            return;
        }
        const stothrakazhcha = await Stothrakazhcha_1.default.findById(id);
        if (!stothrakazhcha) {
            res.status(404).json({ success: false, error: 'Stothrakazhcha not found' });
            return;
        }
        if (stothrakazhcha.status !== 'active') {
            res.status(400).json({ success: false, error: 'Stothrakazhcha is not active' });
            return;
        }
        // Get member ID - either from request body (admin) or from user (member)
        const memberId = providedMemberId || req.user?.memberId || req.user?._id;
        if (!memberId) {
            res.status(400).json({ success: false, error: 'Member ID not found' });
            return;
        }
        // Check if already contributed
        const hasContributed = stothrakazhcha.contributors?.some((c) => String(c.contributorId) === String(memberId));
        if (hasContributed) {
            res.status(400).json({ success: false, error: 'You have already contributed to this week' });
            return;
        }
        // Get member details
        const member = await Member_1.default.findById(memberId);
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        // Create transaction record
        const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const transaction = await Transaction_1.default.create({
            receiptNumber,
            transactionType: 'stothrakazhcha',
            contributionMode: 'variable',
            distribution: 'member_only',
            memberAmount: amount,
            houseAmount: 0,
            totalAmount: amount,
            churchId: stothrakazhcha.churchId,
            unitId: member.unitId,
            houseId: member.houseId,
            memberId: memberId,
            paymentDate: new Date(),
            paymentMethod: 'cash',
            notes: `Stothrakazhcha - Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`,
            createdBy: req.user?._id
        });
        // Add contribution to Stothrakazhcha
        stothrakazhcha.contributors = stothrakazhcha.contributors || [];
        stothrakazhcha.contributors.push({
            contributorId: memberId,
            contributorType: 'Member',
            amount: amount,
            transactionId: transaction._id,
            contributedAt: new Date()
        });
        stothrakazhcha.totalCollected = (stothrakazhcha.totalCollected || 0) + amount;
        stothrakazhcha.totalContributors = (stothrakazhcha.totalContributors || 0) + 1;
        await stothrakazhcha.save();
        // Update wallet - reduce balance since member paid
        const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();
        await Wallet_1.default.findOneAndUpdate({ ownerId: memberId, walletType: 'member' }, {
            $inc: { balance: -amount },
            $push: {
                transactions: {
                    transactionId: transaction._id,
                    amount: -amount,
                    type: `stothrakazhcha_week${stothrakazhcha.weekNumber}_payment`,
                    date: new Date()
                }
            },
            $setOnInsert: {
                ownerModel: 'Member',
                ownerName: ownerName
            }
        }, { upsert: true, new: true });
        const populated = await Stothrakazhcha_1.default.findById(stothrakazhcha._id)
            .populate('churchId', 'name')
            .lean();
        // Populate contributors with member/house details
        if (populated && populated.contributors && populated.contributors.length > 0) {
            const populatedContributors = await Promise.all(populated.contributors.map(async (contributor) => {
                if (contributor.contributorType === 'Member') {
                    const memberData = await Member_1.default.findById(contributor.contributorId)
                        .select('firstName lastName email houseId')
                        .populate('houseId', 'familyName')
                        .lean();
                    return {
                        ...contributor,
                        member: memberData,
                        house: memberData?.houseId
                    };
                }
                else {
                    // It's a House contributor
                    const houseData = await House_1.default.findById(contributor.contributorId)
                        .select('familyName')
                        .lean();
                    return {
                        ...contributor,
                        house: houseData
                    };
                }
            }));
            populated.contributors = populatedContributors;
        }
        res.json({ success: true, data: populated, message: 'Contribution added successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.addContribution = addContribution;
//# sourceMappingURL=stothrakazhchaController.js.map
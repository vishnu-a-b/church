"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNews = exports.createNews = exports.getNewsById = exports.getAllNews = exports.createMySpiritualActivity = exports.getMySpiritualActivities = exports.getMyTransactions = exports.updateMyProfile = exports.getMyProfile = exports.deleteUser = exports.updateUser = exports.createUser = exports.deleteSpiritualActivity = exports.updateSpiritualActivity = exports.createSpiritualActivity = exports.getSpiritualActivityById = exports.getAllSpiritualActivities = exports.addCampaignContribution = exports.processCampaignDues = exports.deleteCampaign = exports.updateCampaign = exports.createCampaign = exports.getCampaignById = exports.getAllCampaigns = exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getTransactionById = exports.getAllTransactions = exports.getAllUsers = exports.deleteMember = exports.updateMember = exports.createMember = exports.getMemberById = exports.getAllMembers = exports.deleteHouse = exports.updateHouse = exports.createHouse = exports.getHouseById = exports.getAllHouses = exports.deleteBavanakutayima = exports.updateBavanakutayima = exports.createBavanakutayima = exports.getBavanakutayimaById = exports.getAllBavanakutayimas = exports.deleteUnit = exports.updateUnit = exports.createUnit = exports.getUnitById = exports.getAllUnits = void 0;
exports.globalSearch = exports.payDue = exports.getAllDues = exports.getActiveEvents = exports.getActiveNews = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getAllEvents = exports.deleteNews = void 0;
const Unit_1 = __importDefault(require("../models/Unit"));
const Bavanakutayima_1 = __importDefault(require("../models/Bavanakutayima"));
const House_1 = __importDefault(require("../models/House"));
const Member_1 = __importDefault(require("../models/Member"));
const User_1 = __importDefault(require("../models/User"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Campaign_1 = __importDefault(require("../models/Campaign"));
const CampaignDue_1 = __importDefault(require("../models/CampaignDue"));
const StothrakazhchaDue_1 = __importDefault(require("../models/StothrakazhchaDue"));
const Stothrakazhcha_1 = __importDefault(require("../models/Stothrakazhcha"));
const SpiritualActivity_1 = __importDefault(require("../models/SpiritualActivity"));
const News_1 = __importDefault(require("../models/News"));
const Event_1 = __importDefault(require("../models/Event"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
// Unit Controllers
const getAllUnits = async (req, res, next) => {
    try {
        // Church admin restriction: only show units from their own church
        const filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const units = await Unit_1.default.find(filter).populate('churchId', 'name uniqueId churchNumber').sort({ uniqueId: 1 });
        res.json({ success: true, data: units });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUnits = getAllUnits;
const getUnitById = async (req, res, next) => {
    try {
        const unit = await Unit_1.default.findById(req.params.id).populate('churchId', 'name uniqueId churchNumber');
        if (!unit) {
            res.status(404).json({ success: false, error: 'Unit not found' });
            return;
        }
        res.json({ success: true, data: unit });
    }
    catch (error) {
        next(error);
    }
};
exports.getUnitById = getUnitById;
const createUnit = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        const { churchId, name, unitCode, adminUserId } = req.body;
        // Church admin restriction: can only create units for their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(req.user.churchId) !== String(churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only create units for their own church' });
                return;
            }
        }
        // Get the church to get its uniqueId
        const Church = (await Promise.resolve().then(() => __importStar(require('../models/Church')))).default;
        const church = await Church.findById(churchId);
        if (!church) {
            res.status(404).json({ success: false, error: 'Church not found' });
            return;
        }
        // Get the next unit number for this church
        const lastUnit = await Unit_1.default.findOne({ churchId }).sort({ unitNumber: -1 });
        const unitNumber = lastUnit ? lastUnit.unitNumber + 1 : 1;
        // Generate uniqueId: {churchUniqueId}-{unitNumber}
        const uniqueId = `${church.uniqueId}-${unitNumber}`;
        // Create unit with generated fields
        const unit = await Unit_1.default.create({
            churchId,
            unitNumber,
            uniqueId,
            name,
            unitCode,
            adminUserId,
        });
        const populatedUnit = await Unit_1.default.findById(unit._id).populate('churchId', 'name uniqueId');
        res.status(201).json({ success: true, data: populatedUnit });
    }
    catch (error) {
        next(error);
    }
};
exports.createUnit = createUnit;
const updateUnit = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the unit to check permissions
        const existingUnit = await Unit_1.default.findById(req.params.id);
        if (!existingUnit) {
            res.status(404).json({ success: false, error: 'Unit not found' });
            return;
        }
        // Church admin restriction: can only update units from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(existingUnit.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update units from their own church' });
                return;
            }
            // Prevent church admin from changing the churchId
            if (req.body.churchId && String(req.body.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins cannot change the church assignment' });
                return;
            }
        }
        const unit = await Unit_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('churchId', 'name uniqueId');
        if (!unit) {
            res.status(404).json({ success: false, error: 'Unit not found' });
            return;
        }
        res.json({ success: true, data: unit });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUnit = updateUnit;
const deleteUnit = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the unit to check permissions
        const unit = await Unit_1.default.findById(req.params.id);
        if (!unit) {
            res.status(404).json({ success: false, error: 'Unit not found' });
            return;
        }
        // Church admin restriction: can only delete units from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(unit.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete units from their own church' });
                return;
            }
        }
        await Unit_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Unit deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUnit = deleteUnit;
// Bavanakutayima Controllers
const getAllBavanakutayimas = async (req, res, next) => {
    try {
        // Church admin restriction: only show bavanakutayimas from units in their church
        let filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            // Get all units from this church
            const churchUnits = await Unit_1.default.find({ churchId: req.user.churchId }).select('_id');
            const unitIds = churchUnits.map(u => u._id);
            filter.unitId = { $in: unitIds };
        }
        // Unit admin restriction: only show bavanakutayimas from their unit
        if (req.user?.role === 'unit_admin' && req.user.unitId) {
            filter.unitId = req.user.unitId;
        }
        const bavanakutayimas = await Bavanakutayima_1.default.find(filter)
            .populate({
            path: 'unitId',
            select: 'name uniqueId unitNumber',
            populate: {
                path: 'churchId',
                select: 'name uniqueId churchNumber'
            }
        })
            .sort({ uniqueId: 1 });
        res.json({ success: true, data: bavanakutayimas });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllBavanakutayimas = getAllBavanakutayimas;
const getBavanakutayimaById = async (req, res, next) => {
    try {
        const bavanakutayima = await Bavanakutayima_1.default.findById(req.params.id).populate({
            path: 'unitId',
            select: 'name uniqueId unitNumber',
            populate: {
                path: 'churchId',
                select: 'name uniqueId churchNumber'
            }
        });
        if (!bavanakutayima) {
            res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
            return;
        }
        res.json({ success: true, data: bavanakutayima });
    }
    catch (error) {
        next(error);
    }
};
exports.getBavanakutayimaById = getBavanakutayimaById;
const createBavanakutayima = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        const { unitId, name, leaderName } = req.body;
        // Get the unit to get its uniqueId
        const unit = await Unit_1.default.findById(unitId);
        if (!unit) {
            res.status(404).json({ success: false, error: 'Unit not found' });
            return;
        }
        // Church admin restriction: can only create bavanakutayimas for units in their church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(unit.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only create bavanakutayimas for units in their own church' });
                return;
            }
        }
        // Get the next bavanakutayima number for this unit
        const lastBK = await Bavanakutayima_1.default.findOne({ unitId }).sort({ bavanakutayimaNumber: -1 });
        const bavanakutayimaNumber = lastBK ? lastBK.bavanakutayimaNumber + 1 : 1;
        // Generate uniqueId: {unitUniqueId}-BK{paddedNumber}
        const uniqueId = `${unit.uniqueId}-${bavanakutayimaNumber}`;
        // Create bavanakutayima with generated fields
        const bavanakutayima = await Bavanakutayima_1.default.create({
            unitId,
            bavanakutayimaNumber,
            uniqueId,
            name,
            leaderName,
        });
        const populated = await Bavanakutayima_1.default.findById(bavanakutayima._id).populate('unitId', 'name uniqueId');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createBavanakutayima = createBavanakutayima;
const updateBavanakutayima = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the bavanakutayima to check permissions
        const existingBavanakutayima = await Bavanakutayima_1.default.findById(req.params.id).populate('unitId');
        if (!existingBavanakutayima) {
            res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
            return;
        }
        // Church admin restriction: can only update bavanakutayimas from units in their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            const unit = await Unit_1.default.findById(existingBavanakutayima.unitId);
            if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update bavanakutayimas from units in their own church' });
                return;
            }
            // Prevent changing unitId to a different church
            if (req.body.unitId && String(req.body.unitId) !== String(existingBavanakutayima.unitId)) {
                const newUnit = await Unit_1.default.findById(req.body.unitId);
                if (!newUnit || String(newUnit.churchId) !== String(req.user.churchId)) {
                    res.status(403).json({ success: false, error: 'Church admins cannot change bavanakutayima to a unit in a different church' });
                    return;
                }
            }
        }
        const bavanakutayima = await Bavanakutayima_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('unitId', 'name uniqueId');
        if (!bavanakutayima) {
            res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
            return;
        }
        res.json({ success: true, data: bavanakutayima });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBavanakutayima = updateBavanakutayima;
const deleteBavanakutayima = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the bavanakutayima to check permissions
        const bavanakutayima = await Bavanakutayima_1.default.findById(req.params.id).populate('unitId');
        if (!bavanakutayima) {
            res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
            return;
        }
        // Church admin restriction: can only delete bavanakutayimas from units in their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            const unit = await Unit_1.default.findById(bavanakutayima.unitId);
            if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete bavanakutayimas from units in their own church' });
                return;
            }
        }
        await Bavanakutayima_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Bavanakutayima deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBavanakutayima = deleteBavanakutayima;
// House Controllers
const getAllHouses = async (req, res, next) => {
    try {
        // Church admin restriction: only show houses from bavanakutayimas in their church
        let filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            // Get all units from this church
            const churchUnits = await Unit_1.default.find({ churchId: req.user.churchId }).select('_id');
            const unitIds = churchUnits.map(u => u._id);
            // Get all bavanakutayimas from these units
            const bavanakutayimas = await Bavanakutayima_1.default.find({ unitId: { $in: unitIds } }).select('_id');
            const bavanakutayimaIds = bavanakutayimas.map(b => b._id);
            filter.bavanakutayimaId = { $in: bavanakutayimaIds };
        }
        // Unit admin restriction: only show houses from their unit
        if (req.user?.role === 'unit_admin' && req.user.unitId) {
            const bavanakutayimas = await Bavanakutayima_1.default.find({ unitId: req.user.unitId }).select('_id');
            const bavanakutayimaIds = bavanakutayimas.map(b => b._id);
            filter.bavanakutayimaId = { $in: bavanakutayimaIds };
        }
        // Kudumbakutayima admin restriction: only show houses from their bavanakutayima
        if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
            filter.bavanakutayimaId = req.user.bavanakutayimaId;
        }
        const houses = await House_1.default.find(filter)
            .populate({
            path: 'bavanakutayimaId',
            select: 'name uniqueId bavanakutayimaNumber',
            populate: {
                path: 'unitId',
                select: 'name uniqueId unitNumber',
                populate: {
                    path: 'churchId',
                    select: 'name uniqueId churchNumber'
                }
            }
        })
            .sort({ uniqueId: 1 });
        res.json({ success: true, data: houses });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllHouses = getAllHouses;
const getHouseById = async (req, res, next) => {
    try {
        const house = await House_1.default.findById(req.params.id).populate({
            path: 'bavanakutayimaId',
            select: 'name uniqueId bavanakutayimaNumber',
            populate: {
                path: 'unitId',
                select: 'name uniqueId unitNumber',
                populate: {
                    path: 'churchId',
                    select: 'name uniqueId churchNumber'
                }
            }
        });
        if (!house) {
            res.status(404).json({ success: false, error: 'House not found' });
            return;
        }
        res.json({ success: true, data: house });
    }
    catch (error) {
        next(error);
    }
};
exports.getHouseById = getHouseById;
const createHouse = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        const { bavanakutayimaId, familyName, headOfFamily, address, phone, houseCode } = req.body;
        // Get the bavanakutayima to get its uniqueId
        const bavanakutayima = await Bavanakutayima_1.default.findById(bavanakutayimaId).populate('unitId');
        if (!bavanakutayima) {
            res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
            return;
        }
        // Church admin restriction: can only create houses for bavanakutayimas in their church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            const unit = await Unit_1.default.findById(bavanakutayima.unitId);
            if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only create houses for bavanakutayimas in their own church' });
                return;
            }
        }
        // Get the next house number for this bavanakutayima
        const lastHouse = await House_1.default.findOne({ bavanakutayimaId }).sort({ houseNumber: -1 });
        const houseNumber = lastHouse ? lastHouse.houseNumber + 1 : 1;
        // Generate uniqueId: {bavanakutayimaUniqueId}-H{paddedNumber}
        const uniqueId = `${bavanakutayima.uniqueId}-${houseNumber}`;
        // Create house with generated fields
        const house = await House_1.default.create({
            bavanakutayimaId,
            houseNumber,
            uniqueId,
            familyName,
            headOfFamily,
            address,
            phone,
            houseCode,
        });
        const populated = await House_1.default.findById(house._id).populate('bavanakutayimaId', 'name uniqueId');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createHouse = createHouse;
const updateHouse = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the house to check permissions
        const existingHouse = await House_1.default.findById(req.params.id).populate('bavanakutayimaId');
        if (!existingHouse) {
            res.status(404).json({ success: false, error: 'House not found' });
            return;
        }
        // Church admin restriction: can only update houses from bavanakutayimas in their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            const bavanakutayima = await Bavanakutayima_1.default.findById(existingHouse.bavanakutayimaId).populate('unitId');
            if (!bavanakutayima) {
                res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
                return;
            }
            const unit = await Unit_1.default.findById(bavanakutayima.unitId);
            if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update houses from bavanakutayimas in their own church' });
                return;
            }
            // Prevent changing bavanakutayimaId to a different church
            if (req.body.bavanakutayimaId && String(req.body.bavanakutayimaId) !== String(existingHouse.bavanakutayimaId)) {
                const newBavanakutayima = await Bavanakutayima_1.default.findById(req.body.bavanakutayimaId).populate('unitId');
                if (!newBavanakutayima) {
                    res.status(404).json({ success: false, error: 'New Bavanakutayima not found' });
                    return;
                }
                const newUnit = await Unit_1.default.findById(newBavanakutayima.unitId);
                if (!newUnit || String(newUnit.churchId) !== String(req.user.churchId)) {
                    res.status(403).json({ success: false, error: 'Church admins cannot change house to a bavanakutayima in a different church' });
                    return;
                }
            }
        }
        const house = await House_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('bavanakutayimaId', 'name uniqueId');
        if (!house) {
            res.status(404).json({ success: false, error: 'House not found' });
            return;
        }
        res.json({ success: true, data: house });
    }
    catch (error) {
        next(error);
    }
};
exports.updateHouse = updateHouse;
const deleteHouse = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the house to check permissions
        const house = await House_1.default.findById(req.params.id).populate('bavanakutayimaId');
        if (!house) {
            res.status(404).json({ success: false, error: 'House not found' });
            return;
        }
        // Church admin restriction: can only delete houses from bavanakutayimas in their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            const bavanakutayima = await Bavanakutayima_1.default.findById(house.bavanakutayimaId).populate('unitId');
            if (!bavanakutayima) {
                res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
                return;
            }
            const unit = await Unit_1.default.findById(bavanakutayima.unitId);
            if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete houses from bavanakutayimas in their own church' });
                return;
            }
        }
        await House_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'House deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteHouse = deleteHouse;
// Member Controllers
const getAllMembers = async (req, res, next) => {
    try {
        // Church admin restriction: only show members from their own church
        const filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
            // Exclude super_admin from church admin view
            filter.role = { $ne: 'super_admin' };
        }
        // Unit admin restriction: only show members from their unit
        if (req.user?.role === 'unit_admin' && req.user.unitId) {
            filter.unitId = req.user.unitId;
            // Exclude super_admin and church_admin from unit admin view
            filter.role = { $nin: ['super_admin', 'church_admin'] };
        }
        // Kudumbakutayima admin restriction: only show members from their bavanakutayima
        if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
            filter.bavanakutayimaId = req.user.bavanakutayimaId;
            // Exclude super_admin, church_admin, and unit_admin from kudumbakutayima admin view
            filter.role = { $nin: ['super_admin', 'church_admin', 'unit_admin'] };
        }
        // Apply additional query filters (for hierarchical filtering)
        const { unitId, bavanakutayimaId, houseId } = req.query;
        if (unitId)
            filter.unitId = unitId;
        if (bavanakutayimaId)
            filter.bavanakutayimaId = bavanakutayimaId;
        if (houseId)
            filter.houseId = houseId;
        const members = await Member_1.default.find(filter)
            .populate({
            path: 'houseId',
            select: 'familyName uniqueId houseNumber',
            populate: {
                path: 'bavanakutayimaId',
                select: 'name uniqueId bavanakutayimaNumber',
                populate: {
                    path: 'unitId',
                    select: 'name uniqueId unitNumber',
                    populate: {
                        path: 'churchId',
                        select: 'name uniqueId churchNumber'
                    }
                }
            }
        })
            .sort({ uniqueId: 1 });
        res.json({ success: true, data: members });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllMembers = getAllMembers;
const getMemberById = async (req, res, next) => {
    try {
        const member = await Member_1.default.findById(req.params.id)
            .populate({
            path: 'houseId',
            select: 'familyName uniqueId houseNumber',
            populate: {
                path: 'bavanakutayimaId',
                select: 'name uniqueId bavanakutayimaNumber',
                populate: {
                    path: 'unitId',
                    select: 'name uniqueId unitNumber',
                    populate: {
                        path: 'churchId',
                        select: 'name uniqueId churchNumber'
                    }
                }
            }
        })
            .populate('churchId', 'name uniqueId churchNumber')
            .populate('unitId', 'name uniqueId unitNumber')
            .populate('bavanakutayimaId', 'name uniqueId bavanakutayimaNumber');
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        res.json({ success: true, data: member });
    }
    catch (error) {
        next(error);
    }
};
exports.getMemberById = getMemberById;
const createMember = async (req, res, next) => {
    try {
        // Unit admin and Kudumbakutayima admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: `${req.user.role === 'unit_admin' ? 'Unit' : 'Kudumbakutayima'} admins have read-only access` });
            return;
        }
        const { churchId, unitId, bavanakutayimaId, houseId, firstName, lastName, dateOfBirth, gender, phone, email, baptismName, relationToHead, username, password, role, isActive, smsPreferences, } = req.body;
        // Church admin restriction: verify churchId matches their church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only create members for their own church' });
                return;
            }
        }
        // Get the house to get its uniqueId
        const house = await House_1.default.findById(houseId);
        if (!house) {
            res.status(404).json({ success: false, error: 'House not found' });
            return;
        }
        // Get the next member number for this house
        const lastMember = await Member_1.default.findOne({ houseId }).sort({ memberNumber: -1 });
        const memberNumber = lastMember ? lastMember.memberNumber + 1 : 1;
        // Generate uniqueId: {houseUniqueId}-M{paddedNumber}
        const uniqueId = `${house.uniqueId}-${memberNumber}`;
        // Create member with generated fields (without username/password - those go in User model)
        const member = await Member_1.default.create({
            churchId,
            unitId,
            bavanakutayimaId,
            houseId,
            memberNumber,
            uniqueId,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            phone,
            email,
            baptismName,
            relationToHead,
            isActive,
            smsPreferences,
        });
        // If username and password are provided, create a User record for login
        if (username && password) {
            if (!email) {
                res.status(400).json({ success: false, error: 'Email is required when creating login credentials' });
                // Delete the member we just created
                await Member_1.default.findByIdAndDelete(member._id);
                return;
            }
            try {
                await User_1.default.create({
                    username,
                    email,
                    password,
                    role: role || 'member',
                    churchId,
                    unitId,
                    bavanakutayimaId,
                    memberId: member._id,
                    isActive,
                });
            }
            catch (userError) {
                // If User creation fails, delete the member and return error
                await Member_1.default.findByIdAndDelete(member._id);
                res.status(400).json({
                    success: false,
                    error: userError.code === 11000
                        ? 'Username or email already exists'
                        : 'Failed to create login credentials'
                });
                return;
            }
        }
        const populated = await Member_1.default.findById(member._id).populate('houseId', 'familyName uniqueId');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createMember = createMember;
const updateMember = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the member to check permissions
        const existingMember = await Member_1.default.findById(req.params.id);
        if (!existingMember) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        // Church admin restriction: can only update members from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(existingMember.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update members from their own church' });
                return;
            }
            // Prevent church admin from changing the churchId
            if (req.body.churchId && String(req.body.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins cannot change the church assignment' });
                return;
            }
        }
        // If password is empty, remove it from update
        if (req.body.password === '') {
            delete req.body.password;
        }
        const member = await Member_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('houseId', 'familyName uniqueId');
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        res.json({ success: true, data: member });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMember = updateMember;
const deleteMember = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the member to check permissions
        const member = await Member_1.default.findById(req.params.id);
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        // Church admin restriction: can only delete members from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(member.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete members from their own church' });
                return;
            }
        }
        await Member_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Member deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteMember = deleteMember;
// User Controllers
const getAllUsers = async (req, res, next) => {
    try {
        // Church admin restriction: only show users from their own church
        const filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
            // Exclude super_admin from church admin view
            filter.role = { $ne: 'super_admin' };
        }
        // Unit admin restriction: only show users from their unit
        if (req.user?.role === 'unit_admin' && req.user.unitId) {
            filter.unitId = req.user.unitId;
            // Exclude super_admin and church_admin from unit admin view
            filter.role = { $nin: ['super_admin', 'church_admin'] };
        }
        // Kudumbakutayima admin restriction: only show users from their bavanakutayima
        if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
            filter.bavanakutayimaId = req.user.bavanakutayimaId;
            // Exclude super_admin, church_admin, and unit_admin from kudumbakutayima admin view
            filter.role = { $nin: ['super_admin', 'church_admin', 'unit_admin'] };
        }
        const users = await User_1.default.find(filter)
            .populate('churchId', 'name')
            .populate('unitId', 'name')
            .select('-password -refreshToken')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
// Transaction Controllers
const getAllTransactions = async (req, res, next) => {
    try {
        const { unitId, bavanakutayimaId, houseId, memberId, transactionType, paymentMethod, dateFrom, dateTo } = req.query;
        // Church admin restriction: only show transactions from their own church
        const filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        // Unit admin restriction: only show transactions from their unit
        if (req.user?.role === 'unit_admin' && req.user.unitId) {
            filter.unitId = req.user.unitId;
        }
        // Kudumbakutayima admin restriction: only show transactions from their bavanakutayima
        if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
            // Get all houses in their bavanakutayima
            const houses = await House_1.default.find({ bavanakutayimaId: req.user.bavanakutayimaId }).select('_id');
            const houseIds = houses.map(h => h._id);
            // Get all members in their bavanakutayima
            const members = await Member_1.default.find({ bavanakutayimaId: req.user.bavanakutayimaId }).select('_id');
            const memberIds = members.map(m => m._id);
            // Filter by either house or member
            filter.$or = [
                { houseId: { $in: houseIds } },
                { memberId: { $in: memberIds } }
            ];
        }
        // Apply user-provided filters
        // Transaction type filter
        if (transactionType) {
            filter.transactionType = transactionType;
        }
        // Payment method filter
        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }
        // Date range filter
        if (dateFrom || dateTo) {
            filter.paymentDate = {};
            if (dateFrom) {
                filter.paymentDate.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999); // Include entire end date
                filter.paymentDate.$lte = endDate;
            }
        }
        // Member filter - direct
        if (memberId) {
            filter.memberId = memberId;
        }
        // Hierarchy filters (unit, bavanakutayima, house)
        let hierarchyHouseIds = [];
        let hierarchyMemberIds = [];
        if (houseId) {
            // Direct house filter
            hierarchyHouseIds.push(houseId);
            // Also get members from this house
            const houseMembers = await Member_1.default.find({ houseId }).select('_id');
            hierarchyMemberIds = houseMembers.map(m => m._id);
        }
        else if (bavanakutayimaId) {
            // Get all houses in this bavanakutayima
            const bavHouses = await House_1.default.find({ bavanakutayimaId }).select('_id');
            hierarchyHouseIds = bavHouses.map(h => h._id);
            // Get all members in this bavanakutayima
            const bavMembers = await Member_1.default.find({ bavanakutayimaId }).select('_id');
            hierarchyMemberIds = bavMembers.map(m => m._id);
        }
        else if (unitId) {
            // Get all bavanakutayimas in this unit
            const unitBavs = await Bavanakutayima_1.default.find({ unitId }).select('_id');
            const bavIds = unitBavs.map(b => b._id);
            // Get all houses in these bavanakutayimas
            const unitHouses = await House_1.default.find({ bavanakutayimaId: { $in: bavIds } }).select('_id');
            hierarchyHouseIds = unitHouses.map(h => h._id);
            // Get all members in these bavanakutayimas
            const unitMembers = await Member_1.default.find({ bavanakutayimaId: { $in: bavIds } }).select('_id');
            hierarchyMemberIds = unitMembers.map(m => m._id);
        }
        // Apply hierarchy filters if any were set
        if (hierarchyHouseIds.length > 0 || hierarchyMemberIds.length > 0) {
            const hierarchyFilter = [];
            if (hierarchyHouseIds.length > 0) {
                hierarchyFilter.push({ houseId: { $in: hierarchyHouseIds } });
            }
            if (hierarchyMemberIds.length > 0) {
                hierarchyFilter.push({ memberId: { $in: hierarchyMemberIds } });
            }
            // Merge with existing $or filter if any
            if (filter.$or) {
                filter.$and = [
                    { $or: filter.$or },
                    { $or: hierarchyFilter }
                ];
                delete filter.$or;
            }
            else {
                filter.$or = hierarchyFilter;
            }
        }
        console.log('📊 Transaction filter:', JSON.stringify(filter, null, 2));
        const transactions = await Transaction_1.default.find(filter)
            .populate({
            path: 'memberId',
            select: 'firstName lastName memberNumber hierarchicalNumber',
            populate: {
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
            }
        })
            .populate({
            path: 'houseId',
            select: 'familyName houseNumber hierarchicalNumber',
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
            .populate('unitId', 'name')
            .populate('churchId', 'name')
            .populate('campaignId', 'name')
            .sort({ paymentDate: -1 })
            .limit(1000);
        console.log('✅ Found', transactions.length, 'transactions');
        res.json({ success: true, data: transactions });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllTransactions = getAllTransactions;
const getTransactionById = async (req, res, next) => {
    try {
        const transaction = await Transaction_1.default.findById(req.params.id)
            .populate('memberId', 'firstName lastName')
            .populate('houseId', 'familyName')
            .populate('unitId', 'name')
            .populate('churchId', 'name')
            .populate('campaignId', 'name');
        if (!transaction) {
            res.status(404).json({ success: false, error: 'Transaction not found' });
            return;
        }
        res.json({ success: true, data: transaction });
    }
    catch (error) {
        next(error);
    }
};
exports.getTransactionById = getTransactionById;
const createTransaction = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // Church admin restriction: verify churchId matches their church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(req.body.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only create transactions for their own church' });
                return;
            }
        }
        const transaction = await Transaction_1.default.create(req.body);
        // If this transaction is for a variable contribution campaign, track the contributor
        if (transaction.campaignId) {
            try {
                const campaign = await Campaign_1.default.findById(transaction.campaignId);
                if (campaign && campaign.contributionMode === 'variable') {
                    const contributorId = campaign.amountType === 'per_member'
                        ? transaction.memberId
                        : transaction.houseId;
                    if (contributorId) {
                        // Check if contributor already exists
                        const existingContributor = campaign.contributors?.find(c => String(c.contributorId) === String(contributorId));
                        if (existingContributor) {
                            // Update existing contribution
                            await Campaign_1.default.updateOne({ _id: campaign._id, 'contributors.contributorId': contributorId }, {
                                $inc: { 'contributors.$.contributedAmount': transaction.totalAmount },
                                $set: { 'contributors.$.contributedAt': new Date() }
                            });
                        }
                        else {
                            // Add new contributor
                            await Campaign_1.default.updateOne({ _id: campaign._id }, {
                                $push: {
                                    contributors: {
                                        contributorId: contributorId,
                                        contributedAmount: transaction.totalAmount,
                                        contributedAt: new Date()
                                    }
                                }
                            });
                        }
                        // Update campaign total collected
                        campaign.totalCollected = (campaign.totalCollected || 0) + transaction.totalAmount;
                        await campaign.save();
                        console.log(`✅ Tracked contribution for ${campaign.amountType}: ${contributorId} - ₹${transaction.totalAmount}`);
                    }
                }
            }
            catch (campaignError) {
                console.error('⚠️ Error tracking campaign contribution:', campaignError);
                // Don't fail transaction creation if contributor tracking fails
            }
        }
        const populated = await Transaction_1.default.findById(transaction._id)
            .populate('memberId', 'firstName lastName')
            .populate('houseId', 'familyName')
            .populate('unitId', 'name')
            .populate('churchId', 'name')
            .populate('campaignId', 'name');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createTransaction = createTransaction;
const updateTransaction = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the transaction to check permissions
        const existingTransaction = await Transaction_1.default.findById(req.params.id);
        if (!existingTransaction) {
            res.status(404).json({ success: false, error: 'Transaction not found' });
            return;
        }
        // Church admin restriction: can only update transactions from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(existingTransaction.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update transactions from their own church' });
                return;
            }
            // Prevent church admin from changing the churchId
            if (req.body.churchId && String(req.body.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins cannot change the church assignment' });
                return;
            }
        }
        const transaction = await Transaction_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('memberId', 'firstName lastName')
            .populate('houseId', 'familyName')
            .populate('unitId', 'name')
            .populate('churchId', 'name')
            .populate('campaignId', 'name');
        if (!transaction) {
            res.status(404).json({ success: false, error: 'Transaction not found' });
            return;
        }
        res.json({ success: true, data: transaction });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTransaction = updateTransaction;
const deleteTransaction = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the transaction to check permissions
        const transaction = await Transaction_1.default.findById(req.params.id);
        if (!transaction) {
            res.status(404).json({ success: false, error: 'Transaction not found' });
            return;
        }
        // Church admin restriction: can only delete transactions from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(transaction.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete transactions from their own church' });
                return;
            }
        }
        await Transaction_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Transaction deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTransaction = deleteTransaction;
// Campaign Controllers
const getAllCampaigns = async (req, res, next) => {
    try {
        // Church admin restriction: only show campaigns from their own church
        const filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const campaigns = await Campaign_1.default.find(filter)
            .populate('churchId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: campaigns });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllCampaigns = getAllCampaigns;
const getCampaignById = async (req, res, next) => {
    try {
        const campaign = await Campaign_1.default.findById(req.params.id)
            .populate('churchId', 'name')
            .lean();
        if (!campaign) {
            res.status(404).json({ success: false, error: 'Campaign not found' });
            return;
        }
        // Populate contributors with member/house details
        if (campaign.contributors && campaign.contributors.length > 0) {
            const populatedContributors = await Promise.all(campaign.contributors.map(async (contributor) => {
                // Try to find as member first
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
                if (member) {
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
                        house: member.houseId
                    };
                }
                // If not a member, try as house
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
                if (house) {
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
                // If neither found, return as is
                return contributor;
            }));
            campaign.contributors = populatedContributors;
        }
        res.json({ success: true, data: campaign });
    }
    catch (error) {
        next(error);
    }
};
exports.getCampaignById = getCampaignById;
const createCampaign = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // Church admin restriction: auto-set churchId from their church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            // Auto-set churchId for church_admin
            req.body.churchId = req.user.churchId;
        }
        const campaign = await Campaign_1.default.create(req.body);
        // Reflect fixed campaign amount in wallets based on amountType
        // Only for 'fixed' contribution mode - 'variable' mode waits for actual contributions
        if (campaign.contributionMode === 'fixed' && campaign.fixedAmount && campaign.fixedAmount > 0) {
            try {
                if (campaign.amountType === 'per_member') {
                    // Find all active members in the campaign's church
                    const members = await Member_1.default.find({
                        churchId: campaign.churchId,
                        isActive: true
                    });
                    console.log(`📊 Campaign created: Adding ${campaign.fixedAmount} to ${members.length} member wallets`);
                    // Update or create wallet for each member
                    for (const member of members) {
                        const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();
                        await Wallet_1.default.findOneAndUpdate({ ownerId: member._id, walletType: 'member' }, {
                            $inc: { balance: campaign.fixedAmount },
                            $push: {
                                transactions: {
                                    transactionId: null,
                                    amount: campaign.fixedAmount,
                                    type: `campaign_${campaign.campaignType}`,
                                    date: new Date()
                                }
                            },
                            $setOnInsert: {
                                ownerModel: 'Member',
                                ownerName: ownerName
                            }
                        }, { upsert: true, new: true });
                    }
                    // Update campaign participant count
                    campaign.participantCount = members.length;
                    await campaign.save();
                }
                else if (campaign.amountType === 'per_house') {
                    // Find all houses in the campaign's church
                    // First get all units in this church
                    const units = await Unit_1.default.find({ churchId: campaign.churchId });
                    const unitIds = units.map(u => u._id);
                    // Get all bavanakutayimas in these units
                    const bavanakutayimas = await Bavanakutayima_1.default.find({ unitId: { $in: unitIds } });
                    const bavanakutayimaIds = bavanakutayimas.map(b => b._id);
                    // Get all houses in these bavanakutayimas
                    const houses = await House_1.default.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });
                    console.log(`📊 Campaign created: Adding ${campaign.fixedAmount} to ${houses.length} house wallets`);
                    // Update or create wallet for each house
                    for (const house of houses) {
                        await Wallet_1.default.findOneAndUpdate({ ownerId: house._id, walletType: 'house' }, {
                            $inc: { balance: campaign.fixedAmount },
                            $push: {
                                transactions: {
                                    transactionId: null,
                                    amount: campaign.fixedAmount,
                                    type: `campaign_${campaign.campaignType}`,
                                    date: new Date()
                                }
                            },
                            $setOnInsert: {
                                ownerModel: 'House',
                                ownerName: house.familyName
                            }
                        }, { upsert: true, new: true });
                    }
                    // Update campaign participant count
                    campaign.participantCount = houses.length;
                    await campaign.save();
                }
            }
            catch (walletError) {
                console.error('⚠️ Error updating wallets for campaign:', walletError);
                // Don't fail the campaign creation if wallet update fails
                // The campaign is already created, just log the error
            }
        }
        const populated = await Campaign_1.default.findById(campaign._id).populate('churchId', 'name');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createCampaign = createCampaign;
const updateCampaign = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the campaign to check permissions
        const existingCampaign = await Campaign_1.default.findById(req.params.id);
        if (!existingCampaign) {
            res.status(404).json({ success: false, error: 'Campaign not found' });
            return;
        }
        // Church admin restriction: can only update campaigns from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(existingCampaign.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update campaigns from their own church' });
                return;
            }
            // Prevent church admin from changing the churchId
            if (req.body.churchId && String(req.body.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins cannot change the church assignment' });
                return;
            }
        }
        const campaign = await Campaign_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('churchId', 'name');
        if (!campaign) {
            res.status(404).json({ success: false, error: 'Campaign not found' });
            return;
        }
        res.json({ success: true, data: campaign });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCampaign = updateCampaign;
const deleteCampaign = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the campaign to check permissions
        const campaign = await Campaign_1.default.findById(req.params.id);
        if (!campaign) {
            res.status(404).json({ success: false, error: 'Campaign not found' });
            return;
        }
        // Church admin restriction: can only delete campaigns from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(campaign.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete campaigns from their own church' });
                return;
            }
        }
        await Campaign_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Campaign deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCampaign = deleteCampaign;
// Process dues for overdue campaigns with variable contribution mode
const processCampaignDues = async (req, res, next) => {
    try {
        const { campaignId } = req.body;
        console.log('🔍 Processing dues for overdue campaigns...');
        // Build filter based on whether specific campaign ID is provided
        const now = new Date();
        const filter = {
            contributionMode: 'variable',
            isActive: true,
            duesProcessed: false,
            minimumAmount: { $gt: 0 }
        };
        // If specific campaign ID provided, add it to filter; otherwise filter by due date
        if (campaignId) {
            filter._id = campaignId;
            console.log(`Processing specific campaign: ${campaignId}`);
        }
        else {
            filter.dueDate = { $lte: now };
            console.log('Processing all overdue campaigns');
        }
        const overdueCampaigns = await Campaign_1.default.find(filter);
        console.log(`Found ${overdueCampaigns.length} overdue campaigns to process`);
        let totalMembersProcessed = 0;
        let totalHousesProcessed = 0;
        const processedCampaigns = [];
        for (const campaign of overdueCampaigns) {
            try {
                console.log(`📊 Processing campaign: ${campaign.name}`);
                const contributorIds = (campaign.contributors || []).map(c => String(c.contributorId));
                if (campaign.amountType === 'per_member') {
                    // Find all active members in the campaign's church who haven't contributed
                    const allMembers = await Member_1.default.find({
                        churchId: campaign.churchId,
                        isActive: true
                    });
                    const nonContributors = allMembers.filter(member => !contributorIds.includes(String(member._id)));
                    console.log(`  ${nonContributors.length} members haven't contributed`);
                    // Add minimum amount to wallets of non-contributors AND create due records
                    for (const member of nonContributors) {
                        const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();
                        // Create CampaignDue record
                        await CampaignDue_1.default.findOneAndUpdate({ campaignId: campaign._id, dueForId: member._id }, {
                            churchId: campaign.churchId,
                            campaignId: campaign._id,
                            campaignName: campaign.name,
                            dueForId: member._id,
                            dueForModel: 'Member',
                            dueForName: ownerName,
                            amount: campaign.minimumAmount,
                            isPaid: false,
                            paidAmount: 0,
                            balance: campaign.minimumAmount,
                            dueDate: campaign.dueDate || new Date()
                        }, { upsert: true, new: true });
                        // Update wallet balance
                        await Wallet_1.default.findOneAndUpdate({ ownerId: member._id, walletType: 'member' }, {
                            $inc: { balance: campaign.minimumAmount },
                            $push: {
                                transactions: {
                                    transactionId: null,
                                    amount: campaign.minimumAmount,
                                    type: `campaign_${campaign.campaignType}_due`,
                                    date: new Date()
                                }
                            },
                            $setOnInsert: {
                                ownerModel: 'Member',
                                ownerName: ownerName
                            }
                        }, { upsert: true, new: true });
                    }
                    totalMembersProcessed += nonContributors.length;
                }
                else if (campaign.amountType === 'per_house') {
                    // Find all houses in the campaign's church who haven't contributed
                    const units = await Unit_1.default.find({ churchId: campaign.churchId });
                    const unitIds = units.map(u => u._id);
                    const bavanakutayimas = await Bavanakutayima_1.default.find({ unitId: { $in: unitIds } });
                    const bavanakutayimaIds = bavanakutayimas.map(b => b._id);
                    const allHouses = await House_1.default.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });
                    const nonContributors = allHouses.filter(house => !contributorIds.includes(String(house._id)));
                    console.log(`  ${nonContributors.length} houses haven't contributed`);
                    // Add minimum amount to wallets of non-contributors AND create due records
                    for (const house of nonContributors) {
                        // Create CampaignDue record
                        await CampaignDue_1.default.findOneAndUpdate({ campaignId: campaign._id, dueForId: house._id }, {
                            churchId: campaign.churchId,
                            campaignId: campaign._id,
                            campaignName: campaign.name,
                            dueForId: house._id,
                            dueForModel: 'House',
                            dueForName: house.familyName,
                            amount: campaign.minimumAmount,
                            isPaid: false,
                            paidAmount: 0,
                            balance: campaign.minimumAmount,
                            dueDate: campaign.dueDate || new Date()
                        }, { upsert: true, new: true });
                        // Update wallet balance
                        await Wallet_1.default.findOneAndUpdate({ ownerId: house._id, walletType: 'house' }, {
                            $inc: { balance: campaign.minimumAmount },
                            $push: {
                                transactions: {
                                    transactionId: null,
                                    amount: campaign.minimumAmount,
                                    type: `campaign_${campaign.campaignType}_due`,
                                    date: new Date()
                                }
                            },
                            $setOnInsert: {
                                ownerModel: 'House',
                                ownerName: house.familyName
                            }
                        }, { upsert: true, new: true });
                    }
                    totalHousesProcessed += nonContributors.length;
                }
                // Mark campaign as processed
                campaign.duesProcessed = true;
                await campaign.save();
                processedCampaigns.push({
                    campaignId: campaign._id,
                    campaignName: campaign.name,
                    amountType: campaign.amountType,
                    minimumAmount: campaign.minimumAmount
                });
            }
            catch (campaignError) {
                console.error(`❌ Error processing campaign ${campaign.name}:`, campaignError);
                // Continue with next campaign
            }
        }
        console.log(`✅ Processing complete: ${totalMembersProcessed} members, ${totalHousesProcessed} houses`);
        res.json({
            success: true,
            message: 'Campaign dues processed successfully',
            data: {
                campaignsProcessed: processedCampaigns.length,
                totalMembersProcessed,
                totalHousesProcessed,
                processedCampaigns
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.processCampaignDues = processCampaignDues;
// Add contribution to campaign
const addCampaignContribution = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, memberId: providedMemberId, houseId: providedHouseId, paymentType } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ success: false, error: 'Valid amount is required' });
            return;
        }
        const campaign = await Campaign_1.default.findById(id);
        if (!campaign) {
            res.status(404).json({ success: false, error: 'Campaign not found' });
            return;
        }
        if (!campaign.isActive) {
            res.status(400).json({ success: false, error: 'Campaign is not active' });
            return;
        }
        let memberId = undefined;
        let houseId = undefined;
        let unitId = undefined;
        let distribution;
        let contributorId;
        // Handle member payment
        if (paymentType === 'member' || (!paymentType && providedMemberId)) {
            memberId = providedMemberId || req.user?.memberId || req.user?._id;
            if (!memberId) {
                res.status(400).json({ success: false, error: 'Member ID is required for member payment' });
                return;
            }
            // Check if already contributed
            const hasContributed = campaign.contributors?.some((c) => String(c.contributorId) === String(memberId));
            if (hasContributed) {
                res.status(400).json({ success: false, error: 'This member has already contributed to this campaign' });
                return;
            }
            // Get member details
            const member = await Member_1.default.findById(memberId);
            if (!member) {
                res.status(404).json({ success: false, error: 'Member not found' });
                return;
            }
            houseId = member.houseId;
            unitId = member.unitId;
            distribution = 'member_only';
            contributorId = memberId;
        }
        // Handle house payment
        else if (paymentType === 'house' || providedHouseId) {
            houseId = providedHouseId;
            if (!houseId) {
                res.status(400).json({ success: false, error: 'House ID is required for house payment' });
                return;
            }
            // Check if house already contributed
            const hasContributed = campaign.contributors?.some((c) => String(c.contributorId) === String(houseId));
            if (hasContributed) {
                res.status(400).json({ success: false, error: 'This house has already contributed to this campaign' });
                return;
            }
            // Get house details
            const house = await House_1.default.findById(houseId).populate('bavanakutayimaId', 'unitId');
            if (!house) {
                res.status(404).json({ success: false, error: 'House not found' });
                return;
            }
            // Get unitId from bavanakutayima
            const bavanakutayima = await Bavanakutayima_1.default.findById(house.bavanakutayimaId);
            unitId = bavanakutayima?.unitId;
            distribution = 'house_only';
            contributorId = houseId;
        }
        else {
            res.status(400).json({ success: false, error: 'Payment type must be specified' });
            return;
        }
        // Create transaction record
        const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const transaction = await Transaction_1.default.create({
            receiptNumber,
            transactionType: 'spl_contribution',
            contributionMode: campaign.contributionMode,
            campaignId: campaign._id,
            distribution,
            memberAmount: distribution === 'member_only' ? amount : 0,
            houseAmount: distribution === 'house_only' ? amount : 0,
            totalAmount: amount,
            memberId: memberId || undefined,
            houseId: houseId || undefined,
            unitId: unitId || undefined,
            churchId: campaign.churchId,
            paymentDate: new Date(),
            paymentMethod: 'cash',
            notes: `Campaign contribution: ${campaign.name}`,
            smsNotificationSent: false,
            createdBy: req.user?._id
        });
        // Add contribution to Campaign
        campaign.contributors = campaign.contributors || [];
        campaign.contributors.push({
            contributorId,
            contributedAmount: amount,
            contributedAt: new Date()
        });
        campaign.totalCollected = (campaign.totalCollected || 0) + amount;
        campaign.participantCount = (campaign.participantCount || 0) + 1;
        await campaign.save();
        res.json({
            success: true,
            message: 'Contribution added successfully',
            data: {
                transaction,
                campaign: {
                    _id: campaign._id,
                    name: campaign.name,
                    totalCollected: campaign.totalCollected,
                    participantCount: campaign.participantCount
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addCampaignContribution = addCampaignContribution;
// Spiritual Activity Controllers
const getAllSpiritualActivities = async (req, res, next) => {
    try {
        // Church admin restriction: only show activities from members in their own church
        let filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            // Get all members from this church
            const churchMembers = await Member_1.default.find({ churchId: req.user.churchId }).select('_id');
            const memberIds = churchMembers.map(m => m._id);
            filter.memberId = { $in: memberIds };
        }
        // Unit admin restriction: only show activities from members in their unit
        if (req.user?.role === 'unit_admin' && req.user.unitId) {
            // Get all members from this unit
            const unitMembers = await Member_1.default.find({ unitId: req.user.unitId }).select('_id');
            const memberIds = unitMembers.map(m => m._id);
            filter.memberId = { $in: memberIds };
        }
        // Kudumbakutayima admin restriction: only show activities from members in their bavanakutayima
        if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
            // Get all members from this bavanakutayima
            const members = await Member_1.default.find({ bavanakutayimaId: req.user.bavanakutayimaId }).select('_id');
            const memberIds = members.map(m => m._id);
            filter.memberId = { $in: memberIds };
        }
        const activities = await SpiritualActivity_1.default.find(filter)
            .populate('memberId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(1000);
        res.json({ success: true, data: activities });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllSpiritualActivities = getAllSpiritualActivities;
const getSpiritualActivityById = async (req, res, next) => {
    try {
        const activity = await SpiritualActivity_1.default.findById(req.params.id).populate('memberId', 'firstName lastName');
        if (!activity) {
            res.status(404).json({ success: false, error: 'Spiritual activity not found' });
            return;
        }
        res.json({ success: true, data: activity });
    }
    catch (error) {
        next(error);
    }
};
exports.getSpiritualActivityById = getSpiritualActivityById;
const createSpiritualActivity = async (req, res, next) => {
    try {
        // Unit admins and Kudumbakutayima admins CAN create spiritual activities
        const activity = await SpiritualActivity_1.default.create(req.body);
        const populated = await SpiritualActivity_1.default.findById(activity._id).populate('memberId', 'firstName lastName');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createSpiritualActivity = createSpiritualActivity;
const updateSpiritualActivity = async (req, res, next) => {
    try {
        // Unit admins and Kudumbakutayima admins CAN update spiritual activities
        const activity = await SpiritualActivity_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('memberId', 'firstName lastName');
        if (!activity) {
            res.status(404).json({ success: false, error: 'Spiritual activity not found' });
            return;
        }
        res.json({ success: true, data: activity });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSpiritualActivity = updateSpiritualActivity;
const deleteSpiritualActivity = async (req, res, next) => {
    try {
        // Unit admins and Kudumbakutayima admins CAN delete spiritual activities
        const activity = await SpiritualActivity_1.default.findByIdAndDelete(req.params.id);
        if (!activity) {
            res.status(404).json({ success: false, error: 'Spiritual activity not found' });
            return;
        }
        res.json({ success: true, message: 'Spiritual activity deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSpiritualActivity = deleteSpiritualActivity;
// Create User
const createUser = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // Church admin restriction
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            // Auto-set churchId for church_admin
            req.body.churchId = req.user.churchId;
            // Prevent church_admin from creating super_admin users
            if (req.body.role === 'super_admin') {
                res.status(403).json({ success: false, error: 'Church admins cannot create super admin users' });
                return;
            }
        }
        const user = await User_1.default.create(req.body);
        const userWithoutPassword = await User_1.default.findById(user._id).select('-password -refreshToken');
        res.status(201).json({ success: true, data: userWithoutPassword });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
// Update User
const updateUser = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the user to check permissions
        const existingUser = await User_1.default.findById(req.params.id);
        if (!existingUser) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        // Church admin restriction: can only update users from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(existingUser.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update users from their own church' });
                return;
            }
            // Prevent church admin from changing the churchId
            if (req.body.churchId && String(req.body.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins cannot change the church assignment' });
                return;
            }
        }
        // If password is empty, remove it from update
        if (req.body.password === '') {
            delete req.body.password;
        }
        const user = await User_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .select('-password -refreshToken');
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
// Delete User
const deleteUser = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
            res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
            return;
        }
        // First find the user to check permissions
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, error: 'User not found' });
            return;
        }
        // Church admin restriction: can only delete users from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(user.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete users from their own church' });
                return;
            }
        }
        await User_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
// Member Self-Service Endpoints
const getMyProfile = async (req, res, next) => {
    try {
        console.log('[getMyProfile] User:', req.user);
        // req.user is the User document, we need to get the Member using memberId
        const memberId = req.user?.memberId;
        console.log('[getMyProfile] Member ID:', memberId);
        if (!memberId) {
            console.log('[getMyProfile] No memberId found in req.user');
            res.status(404).json({ success: false, error: 'Member profile not found for this user' });
            return;
        }
        console.log('[getMyProfile] Fetching member...');
        const member = await Member_1.default.findById(memberId)
            .populate('churchId', 'name uniqueId')
            .populate('unitId', 'name uniqueId')
            .populate('bavanakutayimaId', 'name uniqueId')
            .populate('houseId', 'familyName uniqueId')
            .select('-password');
        console.log('[getMyProfile] Member found:', !!member);
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        console.log('[getMyProfile] Returning member data');
        res.json({ success: true, data: member });
    }
    catch (error) {
        console.error('[getMyProfile] Error:', error);
        next(error);
    }
};
exports.getMyProfile = getMyProfile;
const updateMyProfile = async (req, res, next) => {
    try {
        const memberId = req.user?.memberId;
        if (!memberId) {
            res.status(404).json({ success: false, error: 'Member profile not found for this user' });
            return;
        }
        // Only allow updating specific fields
        const allowedFields = ['phone', 'email', 'smsPreferences'];
        const updates = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        // Handle password separately if provided
        if (req.body.password && req.body.password !== '') {
            updates.password = req.body.password;
        }
        const member = await Member_1.default.findByIdAndUpdate(memberId, updates, { new: true, runValidators: true })
            .populate('churchId', 'name')
            .populate('unitId', 'name')
            .populate('bavanakutayimaId', 'name')
            .populate('houseId', 'familyName uniqueId')
            .select('-password');
        if (!member) {
            res.status(404).json({ success: false, error: 'Member not found' });
            return;
        }
        res.json({ success: true, data: member });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMyProfile = updateMyProfile;
const getMyTransactions = async (req, res, next) => {
    try {
        const memberId = req.user?.memberId;
        if (!memberId) {
            res.status(404).json({ success: false, error: 'Member profile not found for this user' });
            return;
        }
        const transactions = await Transaction_1.default.find({ memberId })
            .populate('campaignId', 'name')
            .populate('churchId', 'name')
            .populate('houseId', 'familyName')
            .sort({ paymentDate: -1 });
        res.json({ success: true, data: transactions });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyTransactions = getMyTransactions;
const getMySpiritualActivities = async (req, res, next) => {
    try {
        const memberId = req.user?.memberId;
        if (!memberId) {
            res.status(404).json({ success: false, error: 'Member profile not found for this user' });
            return;
        }
        const activities = await SpiritualActivity_1.default.find({ memberId })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: activities });
    }
    catch (error) {
        next(error);
    }
};
exports.getMySpiritualActivities = getMySpiritualActivities;
const createMySpiritualActivity = async (req, res, next) => {
    try {
        const memberId = req.user?.memberId;
        if (!memberId) {
            res.status(404).json({ success: false, error: 'Member profile not found for this user' });
            return;
        }
        const activityData = {
            ...req.body,
            memberId,
            selfReported: true,
            reportedAt: new Date()
        };
        const activity = await SpiritualActivity_1.default.create(activityData);
        const populated = await SpiritualActivity_1.default.findById(activity._id)
            .populate('memberId', 'firstName lastName');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createMySpiritualActivity = createMySpiritualActivity;
// News Controllers
const getAllNews = async (req, res, next) => {
    try {
        // Church admin restriction: only show news from their own church
        const filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const news = await News_1.default.find(filter)
            .populate('churchId', 'name')
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: news });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllNews = getAllNews;
const getNewsById = async (req, res, next) => {
    try {
        const news = await News_1.default.findById(req.params.id)
            .populate('churchId', 'name')
            .populate('createdBy', 'username email');
        if (!news) {
            res.status(404).json({ success: false, error: 'News not found' });
            return;
        }
        res.json({ success: true, data: news });
    }
    catch (error) {
        next(error);
    }
};
exports.getNewsById = getNewsById;
const createNews = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
            res.status(403).json({ success: false, error: 'Only church admins can create news' });
            return;
        }
        // Church admin restriction: auto-set churchId from their church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            req.body.churchId = req.user.churchId;
        }
        // Set createdBy to current user
        req.body.createdBy = req.user?.id;
        const news = await News_1.default.create(req.body);
        const populated = await News_1.default.findById(news._id)
            .populate('churchId', 'name')
            .populate('createdBy', 'username email');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createNews = createNews;
const updateNews = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
            res.status(403).json({ success: false, error: 'Only church admins can update news' });
            return;
        }
        // First find the news to check permissions
        const existingNews = await News_1.default.findById(req.params.id);
        if (!existingNews) {
            res.status(404).json({ success: false, error: 'News not found' });
            return;
        }
        // Church admin restriction: can only update news from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(existingNews.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update news from their own church' });
                return;
            }
        }
        const news = await News_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('churchId', 'name')
            .populate('createdBy', 'username email');
        if (!news) {
            res.status(404).json({ success: false, error: 'News not found' });
            return;
        }
        res.json({ success: true, data: news });
    }
    catch (error) {
        next(error);
    }
};
exports.updateNews = updateNews;
const deleteNews = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
            res.status(403).json({ success: false, error: 'Only church admins can delete news' });
            return;
        }
        // First find the news to check permissions
        const news = await News_1.default.findById(req.params.id);
        if (!news) {
            res.status(404).json({ success: false, error: 'News not found' });
            return;
        }
        // Church admin restriction: can only delete news from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(news.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete news from their own church' });
                return;
            }
        }
        await News_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'News deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNews = deleteNews;
// Event Controllers
const getAllEvents = async (req, res, next) => {
    try {
        // Church admin restriction: only show events from their own church
        const filter = {};
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        const events = await Event_1.default.find(filter)
            .populate('churchId', 'name')
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: events });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllEvents = getAllEvents;
const getEventById = async (req, res, next) => {
    try {
        const event = await Event_1.default.findById(req.params.id)
            .populate('churchId', 'name')
            .populate('createdBy', 'username email');
        if (!event) {
            res.status(404).json({ success: false, error: 'Event not found' });
            return;
        }
        res.json({ success: true, data: event });
    }
    catch (error) {
        next(error);
    }
};
exports.getEventById = getEventById;
const createEvent = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
            res.status(403).json({ success: false, error: 'Only church admins can create events' });
            return;
        }
        // Church admin restriction: auto-set churchId from their church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            req.body.churchId = req.user.churchId;
        }
        // Set createdBy to current user
        req.body.createdBy = req.user?.id;
        const event = await Event_1.default.create(req.body);
        const populated = await Event_1.default.findById(event._id)
            .populate('churchId', 'name')
            .populate('createdBy', 'username email');
        res.status(201).json({ success: true, data: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
            res.status(403).json({ success: false, error: 'Only church admins can update events' });
            return;
        }
        // First find the event to check permissions
        const existingEvent = await Event_1.default.findById(req.params.id);
        if (!existingEvent) {
            res.status(404).json({ success: false, error: 'Event not found' });
            return;
        }
        // Church admin restriction: can only update events from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(existingEvent.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only update events from their own church' });
                return;
            }
        }
        const event = await Event_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('churchId', 'name')
            .populate('createdBy', 'username email');
        if (!event) {
            res.status(404).json({ success: false, error: 'Event not found' });
            return;
        }
        res.json({ success: true, data: event });
    }
    catch (error) {
        next(error);
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res, next) => {
    try {
        // Unit admin restriction: read-only access
        if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
            res.status(403).json({ success: false, error: 'Only church admins can delete events' });
            return;
        }
        // First find the event to check permissions
        const event = await Event_1.default.findById(req.params.id);
        if (!event) {
            res.status(404).json({ success: false, error: 'Event not found' });
            return;
        }
        // Church admin restriction: can only delete events from their own church
        if (req.user?.role === 'church_admin') {
            if (!req.user.churchId) {
                res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
                return;
            }
            if (String(event.churchId) !== String(req.user.churchId)) {
                res.status(403).json({ success: false, error: 'Church admins can only delete events from their own church' });
                return;
            }
        }
        await Event_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteEvent = deleteEvent;
// Member endpoints for viewing active News and Events
const getActiveNews = async (req, res, next) => {
    try {
        const now = new Date();
        const filter = {
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        };
        // Filter by churchId if user has one
        if (req.user?.churchId) {
            filter.churchId = req.user.churchId;
        }
        const news = await News_1.default.find(filter)
            .populate('churchId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: news });
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveNews = getActiveNews;
const getActiveEvents = async (req, res, next) => {
    try {
        const now = new Date();
        const filter = {
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        };
        // Filter by churchId if user has one
        if (req.user?.churchId) {
            filter.churchId = req.user.churchId;
        }
        const events = await Event_1.default.find(filter)
            .populate('churchId', 'name')
            .sort({ startDate: 1 });
        res.json({ success: true, data: events });
    }
    catch (error) {
        next(error);
    }
};
exports.getActiveEvents = getActiveEvents;
// Get All Dues (Campaign + Stothrakazhcha)
const getAllDues = async (req, res, next) => {
    try {
        const { unitId, bavanakutayimaId, houseId, memberId } = req.query;
        // Build filter based on query params and user role
        const filter = { isPaid: false }; // Only show unpaid dues
        // Church admin restriction: only show dues from their own church
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        // Get member and house IDs based on hierarchy filters
        let memberIds = [];
        let houseIds = [];
        if (memberId) {
            memberIds = [memberId];
        }
        else if (houseId) {
            houseIds = [houseId];
            // Also get members from this house
            const members = await Member_1.default.find({ houseId, isActive: true });
            memberIds = members.map(m => m._id);
        }
        else if (bavanakutayimaId) {
            const houses = await House_1.default.find({ bavanakutayimaId });
            houseIds = houses.map(h => h._id);
            const members = await Member_1.default.find({ houseId: { $in: houseIds }, isActive: true });
            memberIds = members.map(m => m._id);
        }
        else if (unitId) {
            const bavanakutayimas = await Bavanakutayima_1.default.find({ unitId });
            const bavanakutayimaIds = bavanakutayimas.map(b => b._id);
            const houses = await House_1.default.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });
            houseIds = houses.map(h => h._id);
            const members = await Member_1.default.find({ houseId: { $in: houseIds }, isActive: true });
            memberIds = members.map(m => m._id);
        }
        // Fetch campaign dues
        const campaignDuesFilter = { ...filter };
        if (memberIds.length > 0 || houseIds.length > 0) {
            campaignDuesFilter.$or = [];
            if (memberIds.length > 0) {
                campaignDuesFilter.$or.push({ dueForId: { $in: memberIds }, dueForModel: 'Member' });
            }
            if (houseIds.length > 0) {
                campaignDuesFilter.$or.push({ dueForId: { $in: houseIds }, dueForModel: 'House' });
            }
        }
        // Fetch campaign dues with populated entities to get hierarchical numbers
        const campaignDues = await CampaignDue_1.default.find(campaignDuesFilter)
            .sort({ dueDate: 1, createdAt: -1 })
            .lean();
        // Fetch stothrakazhcha dues
        const stothrakazhchaDues = await StothrakazhchaDue_1.default.find(campaignDuesFilter)
            .sort({ dueDate: 1, createdAt: -1 })
            .lean();
        // Populate each due's entity to get hierarchical number
        const populateDue = async (due) => {
            let hierarchicalNumber = undefined;
            if (due.dueForModel === 'Member') {
                const member = await Member_1.default.findById(due.dueForId)
                    .select('memberNumber')
                    .populate({
                    path: 'houseId',
                    select: 'houseNumber',
                    populate: {
                        path: 'bavanakutayimaId',
                        select: 'bavanakutayimaNumber',
                        populate: {
                            path: 'unitId',
                            select: 'unitNumber',
                            populate: {
                                path: 'churchId',
                                select: 'churchNumber'
                            }
                        }
                    }
                })
                    .lean();
                // Manually compute hierarchical number from populated data
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
            }
            else {
                const house = await House_1.default.findById(due.dueForId)
                    .select('houseNumber')
                    .populate({
                    path: 'bavanakutayimaId',
                    select: 'bavanakutayimaNumber',
                    populate: {
                        path: 'unitId',
                        select: 'unitNumber',
                        populate: {
                            path: 'churchId',
                            select: 'churchNumber'
                        }
                    }
                })
                    .lean();
                // Manually compute hierarchical number from populated data
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
            }
            return hierarchicalNumber;
        };
        const campaignDuesWithHierarchy = await Promise.all(campaignDues.map(async (due) => ({
            _id: due._id,
            name: due.dueForName,
            type: due.dueForModel.toLowerCase(),
            campaignName: due.campaignName,
            dueAmount: due.amount,
            paidAmount: due.paidAmount,
            remainingAmount: due.balance,
            campaignId: due.campaignId,
            dueForId: due.dueForId,
            hierarchicalNumber: await populateDue(due)
        })));
        const stothrakazhchaDuesWithHierarchy = await Promise.all(stothrakazhchaDues.map(async (due) => ({
            _id: due._id,
            name: due.dueForName,
            type: due.dueForModel.toLowerCase(),
            campaignName: `Stothrakazhcha Week ${due.weekNumber}, ${due.year}`,
            dueAmount: due.amount,
            paidAmount: due.paidAmount,
            remainingAmount: due.balance,
            stothrakazhchaId: due.stothrakazhchaId,
            dueForId: due.dueForId,
            hierarchicalNumber: await populateDue(due)
        })));
        // Transform to unified format
        const allDues = [...campaignDuesWithHierarchy, ...stothrakazhchaDuesWithHierarchy];
        res.json({ success: true, data: allDues });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllDues = getAllDues;
// Pay a Due (Campaign or Stothrakazhcha)
const payDue = async (req, res, next) => {
    try {
        const { dueId, dueType, amount, paymentMethod } = req.body;
        if (!dueId || !dueType || !amount || !paymentMethod) {
            res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
            return;
        }
        const paymentAmount = parseFloat(amount);
        if (paymentAmount <= 0) {
            res.status(400).json({ success: false, error: "Invalid amount" });
            return;
        }
        let due;
        let contributorType;
        if (dueType === "campaign") {
            due = await CampaignDue_1.default.findById(dueId);
        }
        else if (dueType === "stothrakazhcha") {
            due = await StothrakazhchaDue_1.default.findById(dueId);
        }
        if (!due) {
            res.status(404).json({ success: false, error: "Due not found" });
            return;
        }
        contributorType = due.dueForModel.toLowerCase();
        if (paymentAmount > due.balance) {
            res.status(400).json({ success: false, error: "Amount exceeds balance" });
            return;
        }
        // Generate receipt number
        const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // Ensure createdBy is set
        if (!req.user?._id) {
            res.status(401).json({ success: false, error: "User not authenticated" });
            return;
        }
        const transaction = await Transaction_1.default.create({
            receiptNumber,
            churchId: due.churchId,
            transactionType: dueType === "campaign" ? "campaign_contribution" : "stothrakazhcha",
            totalAmount: paymentAmount,
            memberAmount: contributorType === "member" ? paymentAmount : 0,
            houseAmount: contributorType === "house" ? paymentAmount : 0,
            memberId: contributorType === "member" ? due.dueForId : undefined,
            houseId: contributorType === "house" ? due.dueForId : undefined,
            paymentMethod: paymentMethod,
            paymentDate: new Date(),
            notes: `Due payment for ${due.dueForName}`,
            createdBy: req.user._id
        });
        due.paidAmount += paymentAmount;
        due.balance -= paymentAmount;
        due.isPaid = due.balance === 0;
        if (due.isPaid)
            due.paidAt = new Date();
        due.transactionId = transaction._id;
        await due.save();
        if (dueType === "campaign") {
            const campaign = await Campaign_1.default.findById(due.campaignId);
            if (campaign) {
                campaign.contributors = campaign.contributors || [];
                const existing = campaign.contributors.find((c) => String(c.contributorId) === String(due.dueForId));
                if (existing) {
                    existing.contributedAmount += paymentAmount;
                }
                else {
                    campaign.contributors.push({
                        contributorId: due.dueForId,
                        contributedAmount: paymentAmount,
                        contributedAt: new Date()
                    });
                }
                campaign.totalCollected = (campaign.totalCollected || 0) + paymentAmount;
                campaign.participantCount = campaign.contributors.length;
                await campaign.save();
            }
        }
        else {
            const stoth = await Stothrakazhcha_1.default.findById(due.stothrakazhchaId);
            if (stoth) {
                stoth.contributors = stoth.contributors || [];
                const existing = stoth.contributors.find((c) => String(c.contributorId) === String(due.dueForId));
                if (existing) {
                    existing.amount += paymentAmount;
                }
                else {
                    const capitalizedType = contributorType === "member" ? "Member" : "House";
                    stoth.contributors.push({
                        contributorId: due.dueForId,
                        contributorType: capitalizedType,
                        amount: paymentAmount,
                        contributedAt: new Date()
                    });
                }
                stoth.totalCollected = (stoth.totalCollected || 0) + paymentAmount;
                await stoth.save();
            }
        }
        await Wallet_1.default.findOneAndUpdate({ ownerId: due.dueForId, walletType: contributorType }, { $inc: { balance: -paymentAmount } });
        res.json({
            success: true,
            message: "Payment processed successfully",
            data: { transaction, due: { _id: due._id, paidAmount: due.paidAmount, balance: due.balance, isPaid: due.isPaid } }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.payDue = payDue;
// Global Search
const globalSearch = async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string' || query.trim().length < 2) {
            res.json({ success: true, data: { members: [], houses: [], transactions: [] } });
            return;
        }
        const searchTerm = query.trim();
        const filter = {};
        // Church admin restriction
        if (req.user?.role === 'church_admin' && req.user.churchId) {
            filter.churchId = req.user.churchId;
        }
        // Search Members (name, email, hierarchicalNumber, uniqueId)
        const memberFilter = {
            ...filter,
            $or: [
                { firstName: { $regex: searchTerm, $options: 'i' } },
                { lastName: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                { uniqueId: { $regex: searchTerm, $options: 'i' } }
            ]
        };
        const members = await Member_1.default.find(memberFilter)
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
            .limit(10)
            .lean();
        // Compute hierarchical numbers for members
        const membersWithHierarchy = members.map(member => {
            let hierarchicalNumber;
            if (member.houseId && typeof member.houseId === 'object') {
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
                _id: member._id,
                name: `${member.firstName} ${member.lastName || ''}`.trim(),
                email: member.email,
                hierarchicalNumber,
                uniqueId: member.uniqueId,
                type: 'member'
            };
        });
        // Search Houses (familyName, hierarchicalNumber, uniqueId)
        const houseFilter = {
            $or: [
                { familyName: { $regex: searchTerm, $options: 'i' } },
                { uniqueId: { $regex: searchTerm, $options: 'i' } }
            ]
        };
        const houses = await House_1.default.find(houseFilter)
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
            .limit(10)
            .lean();
        // Compute hierarchical numbers for houses
        const housesWithHierarchy = houses.map(house => {
            let hierarchicalNumber;
            if (house.bavanakutayimaId && typeof house.bavanakutayimaId === 'object') {
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
                _id: house._id,
                name: house.familyName,
                hierarchicalNumber,
                uniqueId: house.uniqueId,
                type: 'house'
            };
        });
        // Search Transactions (receiptNumber)
        const transactionFilter = {
            ...filter,
            receiptNumber: { $regex: searchTerm, $options: 'i' }
        };
        const transactions = await Transaction_1.default.find(transactionFilter)
            .limit(10)
            .lean();
        const transactionsFormatted = transactions.map(txn => ({
            _id: txn._id,
            receiptNumber: txn.receiptNumber,
            amount: txn.totalAmount,
            date: txn.paymentDate,
            type: 'transaction'
        }));
        res.json({
            success: true,
            data: {
                members: membersWithHierarchy,
                houses: housesWithHierarchy,
                transactions: transactionsFormatted
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.globalSearch = globalSearch;
//# sourceMappingURL=entityController.js.map
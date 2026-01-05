"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChurch = exports.updateChurch = exports.createChurch = exports.getChurchById = exports.getAllChurches = void 0;
const Church_1 = __importDefault(require("../models/Church"));
const getAllChurches = async (req, res, next) => {
    try {
        const churches = await Church_1.default.find().sort({ churchNumber: 1 });
        res.json({
            success: true,
            data: churches,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllChurches = getAllChurches;
const getChurchById = async (req, res, next) => {
    try {
        const church = await Church_1.default.findById(req.params.id);
        if (!church) {
            res.status(404).json({
                success: false,
                error: 'Church not found',
            });
            return;
        }
        res.json({
            success: true,
            data: church,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getChurchById = getChurchById;
const createChurch = async (req, res, next) => {
    try {
        // Get the next church number
        const lastChurch = await Church_1.default.findOne().sort({ churchNumber: -1 });
        const churchNumber = lastChurch ? lastChurch.churchNumber + 1 : 1;
        // Generate simple numeric uniqueId
        const uniqueId = String(churchNumber);
        // Create church with generated fields
        const church = await Church_1.default.create({
            ...req.body,
            churchNumber,
            uniqueId,
        });
        res.status(201).json({
            success: true,
            data: church,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createChurch = createChurch;
const updateChurch = async (req, res, next) => {
    try {
        const church = await Church_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!church) {
            res.status(404).json({
                success: false,
                error: 'Church not found',
            });
            return;
        }
        res.json({
            success: true,
            data: church,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateChurch = updateChurch;
const deleteChurch = async (req, res, next) => {
    try {
        const church = await Church_1.default.findByIdAndDelete(req.params.id);
        if (!church) {
            res.status(404).json({
                success: false,
                error: 'Church not found',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Church deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteChurch = deleteChurch;
//# sourceMappingURL=churchController.js.map
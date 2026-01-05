import { Response, NextFunction } from 'express';
import Church from '../models/Church';
import { AuthRequest } from '../types';

export const getAllChurches = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const churches = await Church.find().sort({ churchNumber: 1 });
    res.json({
      success: true,
      data: churches,
    });
  } catch (error) {
    next(error);
  }
};

export const getChurchById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const church = await Church.findById(req.params.id);
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
  } catch (error) {
    next(error);
  }
};

export const createChurch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the next church number
    const lastChurch = await Church.findOne().sort({ churchNumber: -1 });
    const churchNumber = lastChurch ? lastChurch.churchNumber + 1 : 1;

    // Generate simple numeric uniqueId
    const uniqueId = String(churchNumber);

    // Create church with generated fields
    const church = await Church.create({
      ...req.body,
      churchNumber,
      uniqueId,
    });

    res.status(201).json({
      success: true,
      data: church,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChurch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const church = await Church.findByIdAndUpdate(req.params.id, req.body, {
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
  } catch (error) {
    next(error);
  }
};

export const deleteChurch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const church = await Church.findByIdAndDelete(req.params.id);
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
  } catch (error) {
    next(error);
  }
};

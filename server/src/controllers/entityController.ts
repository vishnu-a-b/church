import { Response, NextFunction } from 'express';
import Unit from '../models/Unit';
import Bavanakutayima from '../models/Bavanakutayima';
import House from '../models/House';
import Member from '../models/Member';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Campaign from '../models/Campaign';
import SpiritualActivity from '../models/SpiritualActivity';
import News from '../models/News';
import Event from '../models/Event';
import Wallet from '../models/Wallet';
import { AuthRequest } from '../types';

// Unit Controllers
export const getAllUnits = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show units from their own church
    const filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    const units = await Unit.find(filter).populate('churchId', 'name uniqueId').sort({ uniqueId: 1 });
    res.json({ success: true, data: units });
  } catch (error) {
    next(error);
  }
};

export const getUnitById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unit = await Unit.findById(req.params.id).populate('churchId', 'name uniqueId');
    if (!unit) {
      res.status(404).json({ success: false, error: 'Unit not found' });
      return;
    }
    res.json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
};

export const createUnit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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
    const Church = (await import('../models/Church')).default;
    const church = await Church.findById(churchId);
    if (!church) {
      res.status(404).json({ success: false, error: 'Church not found' });
      return;
    }

    // Get the next unit number for this church
    const lastUnit = await Unit.findOne({ churchId }).sort({ unitNumber: -1 });
    const unitNumber = lastUnit ? lastUnit.unitNumber + 1 : 1;

    // Generate uniqueId: {churchUniqueId}-U{paddedUnitNumber}
    const uniqueId = `${church.uniqueId}-U${String(unitNumber).padStart(3, '0')}`;

    // Create unit with generated fields
    const unit = await Unit.create({
      churchId,
      unitNumber,
      uniqueId,
      name,
      unitCode,
      adminUserId,
    });

    const populatedUnit = await Unit.findById(unit._id).populate('churchId', 'name uniqueId');
    res.status(201).json({ success: true, data: populatedUnit });
  } catch (error) {
    next(error);
  }
};

export const updateUnit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the unit to check permissions
    const existingUnit = await Unit.findById(req.params.id);
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

    const unit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('churchId', 'name uniqueId');
    if (!unit) {
      res.status(404).json({ success: false, error: 'Unit not found' });
      return;
    }
    res.json({ success: true, data: unit });
  } catch (error) {
    next(error);
  }
};

export const deleteUnit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the unit to check permissions
    const unit = await Unit.findById(req.params.id);
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

    await Unit.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Bavanakutayima Controllers
export const getAllBavanakutayimas = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show bavanakutayimas from units in their church
    let filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      // Get all units from this church
      const churchUnits = await Unit.find({ churchId: req.user.churchId }).select('_id');
      const unitIds = churchUnits.map(u => u._id);
      filter.unitId = { $in: unitIds };
    }

    const bavanakutayimas = await Bavanakutayima.find(filter)
      .populate('unitId', 'name uniqueId')
      .sort({ uniqueId: 1 });
    res.json({ success: true, data: bavanakutayimas });
  } catch (error) {
    next(error);
  }
};

export const getBavanakutayimaById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bavanakutayima = await Bavanakutayima.findById(req.params.id).populate('unitId', 'name uniqueId');
    if (!bavanakutayima) {
      res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
      return;
    }
    res.json({ success: true, data: bavanakutayima });
  } catch (error) {
    next(error);
  }
};

export const createBavanakutayima = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const { unitId, name, leaderName } = req.body;

    // Get the unit to get its uniqueId
    const unit = await Unit.findById(unitId);
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
    const lastBK = await Bavanakutayima.findOne({ unitId }).sort({ bavanakutayimaNumber: -1 });
    const bavanakutayimaNumber = lastBK ? lastBK.bavanakutayimaNumber + 1 : 1;

    // Generate uniqueId: {unitUniqueId}-BK{paddedNumber}
    const uniqueId = `${unit.uniqueId}-BK${String(bavanakutayimaNumber).padStart(3, '0')}`;

    // Create bavanakutayima with generated fields
    const bavanakutayima = await Bavanakutayima.create({
      unitId,
      bavanakutayimaNumber,
      uniqueId,
      name,
      leaderName,
    });

    const populated = await Bavanakutayima.findById(bavanakutayima._id).populate('unitId', 'name uniqueId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateBavanakutayima = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the bavanakutayima to check permissions
    const existingBavanakutayima = await Bavanakutayima.findById(req.params.id).populate('unitId');
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
      const unit = await Unit.findById(existingBavanakutayima.unitId);
      if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only update bavanakutayimas from units in their own church' });
        return;
      }
      // Prevent changing unitId to a different church
      if (req.body.unitId && String(req.body.unitId) !== String(existingBavanakutayima.unitId)) {
        const newUnit = await Unit.findById(req.body.unitId);
        if (!newUnit || String(newUnit.churchId) !== String(req.user.churchId)) {
          res.status(403).json({ success: false, error: 'Church admins cannot change bavanakutayima to a unit in a different church' });
          return;
        }
      }
    }

    const bavanakutayima = await Bavanakutayima.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('unitId', 'name uniqueId');
    if (!bavanakutayima) {
      res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
      return;
    }
    res.json({ success: true, data: bavanakutayima });
  } catch (error) {
    next(error);
  }
};

export const deleteBavanakutayima = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the bavanakutayima to check permissions
    const bavanakutayima = await Bavanakutayima.findById(req.params.id).populate('unitId');
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
      const unit = await Unit.findById(bavanakutayima.unitId);
      if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only delete bavanakutayimas from units in their own church' });
        return;
      }
    }

    await Bavanakutayima.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Bavanakutayima deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// House Controllers
export const getAllHouses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show houses from bavanakutayimas in their church
    let filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      // Get all units from this church
      const churchUnits = await Unit.find({ churchId: req.user.churchId }).select('_id');
      const unitIds = churchUnits.map(u => u._id);
      // Get all bavanakutayimas from these units
      const bavanakutayimas = await Bavanakutayima.find({ unitId: { $in: unitIds } }).select('_id');
      const bavanakutayimaIds = bavanakutayimas.map(b => b._id);
      filter.bavanakutayimaId = { $in: bavanakutayimaIds };
    }

    // Kudumbakutayima admin restriction: only show houses from their bavanakutayima
    if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
      filter.bavanakutayimaId = req.user.bavanakutayimaId;
    }

    const houses = await House.find(filter)
      .populate('bavanakutayimaId', 'name uniqueId')
      .sort({ uniqueId: 1 });
    res.json({ success: true, data: houses });
  } catch (error) {
    next(error);
  }
};

export const getHouseById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const house = await House.findById(req.params.id).populate('bavanakutayimaId', 'name uniqueId');
    if (!house) {
      res.status(404).json({ success: false, error: 'House not found' });
      return;
    }
    res.json({ success: true, data: house });
  } catch (error) {
    next(error);
  }
};

export const createHouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const { bavanakutayimaId, familyName, headOfFamily, address, phone, houseCode } = req.body;

    // Get the bavanakutayima to get its uniqueId
    const bavanakutayima = await Bavanakutayima.findById(bavanakutayimaId).populate('unitId');
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
      const unit = await Unit.findById(bavanakutayima.unitId);
      if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only create houses for bavanakutayimas in their own church' });
        return;
      }
    }

    // Get the next house number for this bavanakutayima
    const lastHouse = await House.findOne({ bavanakutayimaId }).sort({ houseNumber: -1 });
    const houseNumber = lastHouse ? lastHouse.houseNumber + 1 : 1;

    // Generate uniqueId: {bavanakutayimaUniqueId}-H{paddedNumber}
    const uniqueId = `${bavanakutayima.uniqueId}-H${String(houseNumber).padStart(3, '0')}`;

    // Create house with generated fields
    const house = await House.create({
      bavanakutayimaId,
      houseNumber,
      uniqueId,
      familyName,
      headOfFamily,
      address,
      phone,
      houseCode,
    });

    const populated = await House.findById(house._id).populate('bavanakutayimaId', 'name uniqueId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateHouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the house to check permissions
    const existingHouse = await House.findById(req.params.id).populate('bavanakutayimaId');
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
      const bavanakutayima = await Bavanakutayima.findById(existingHouse.bavanakutayimaId).populate('unitId');
      if (!bavanakutayima) {
        res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
        return;
      }
      const unit = await Unit.findById(bavanakutayima.unitId);
      if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only update houses from bavanakutayimas in their own church' });
        return;
      }
      // Prevent changing bavanakutayimaId to a different church
      if (req.body.bavanakutayimaId && String(req.body.bavanakutayimaId) !== String(existingHouse.bavanakutayimaId)) {
        const newBavanakutayima = await Bavanakutayima.findById(req.body.bavanakutayimaId).populate('unitId');
        if (!newBavanakutayima) {
          res.status(404).json({ success: false, error: 'New Bavanakutayima not found' });
          return;
        }
        const newUnit = await Unit.findById(newBavanakutayima.unitId);
        if (!newUnit || String(newUnit.churchId) !== String(req.user.churchId)) {
          res.status(403).json({ success: false, error: 'Church admins cannot change house to a bavanakutayima in a different church' });
          return;
        }
      }
    }

    const house = await House.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('bavanakutayimaId', 'name uniqueId');
    if (!house) {
      res.status(404).json({ success: false, error: 'House not found' });
      return;
    }
    res.json({ success: true, data: house });
  } catch (error) {
    next(error);
  }
};

export const deleteHouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the house to check permissions
    const house = await House.findById(req.params.id).populate('bavanakutayimaId');
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
      const bavanakutayima = await Bavanakutayima.findById(house.bavanakutayimaId).populate('unitId');
      if (!bavanakutayima) {
        res.status(404).json({ success: false, error: 'Bavanakutayima not found' });
        return;
      }
      const unit = await Unit.findById(bavanakutayima.unitId);
      if (!unit || String(unit.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Church admins can only delete houses from bavanakutayimas in their own church' });
        return;
      }
    }

    await House.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'House deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Member Controllers
export const getAllMembers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show members from their own church
    const filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    // Kudumbakutayima admin restriction: only show members from their bavanakutayima
    if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
      filter.bavanakutayimaId = req.user.bavanakutayimaId;
    }

    const members = await Member.find(filter)
      .populate('houseId', 'familyName uniqueId')
      .sort({ uniqueId: 1 });
    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('houseId', 'familyName uniqueId')
      .populate('churchId', 'name uniqueId')
      .populate('unitId', 'name uniqueId')
      .populate('bavanakutayimaId', 'name uniqueId');
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

export const createMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin and Kudumbakutayima admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: `${req.user.role === 'unit_admin' ? 'Unit' : 'Kudumbakutayima'} admins have read-only access` });
      return;
    }

    const {
      churchId,
      unitId,
      bavanakutayimaId,
      houseId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      baptismName,
      relationToHead,
      username,
      password,
      role,
      isActive,
      smsPreferences,
    } = req.body;

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
    const house = await House.findById(houseId);
    if (!house) {
      res.status(404).json({ success: false, error: 'House not found' });
      return;
    }

    // Get the next member number for this house
    const lastMember = await Member.findOne({ houseId }).sort({ memberNumber: -1 });
    const memberNumber = lastMember ? lastMember.memberNumber + 1 : 1;

    // Generate uniqueId: {houseUniqueId}-M{paddedNumber}
    const uniqueId = `${house.uniqueId}-M${String(memberNumber).padStart(3, '0')}`;

    // Create member with generated fields (without username/password - those go in User model)
    const member = await Member.create({
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
        await Member.findByIdAndDelete(member._id);
        return;
      }

      try {
        await User.create({
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
      } catch (userError: any) {
        // If User creation fails, delete the member and return error
        await Member.findByIdAndDelete(member._id);
        res.status(400).json({
          success: false,
          error: userError.code === 11000
            ? 'Username or email already exists'
            : 'Failed to create login credentials'
        });
        return;
      }
    }

    const populated = await Member.findById(member._id).populate('houseId', 'familyName uniqueId');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the member to check permissions
    const existingMember = await Member.findById(req.params.id);
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
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('houseId', 'familyName uniqueId');
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the member to check permissions
    const member = await Member.findById(req.params.id);
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

    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// User Controllers
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show users from their own church
    const filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    const users = await User.find(filter)
      .populate('churchId', 'name')
      .populate('unitId', 'name')
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// Transaction Controllers
export const getAllTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show transactions from their own church
    const filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    // Kudumbakutayima admin restriction: only show transactions from their bavanakutayima
    if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
      // Get all houses in their bavanakutayima
      const houses = await House.find({ bavanakutayimaId: req.user.bavanakutayimaId }).select('_id');
      const houseIds = houses.map(h => h._id);
      // Get all members in their bavanakutayima
      const members = await Member.find({ bavanakutayimaId: req.user.bavanakutayimaId }).select('_id');
      const memberIds = members.map(m => m._id);
      // Filter by either house or member
      filter.$or = [
        { houseId: { $in: houseIds } },
        { memberId: { $in: memberIds } }
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate('memberId', 'firstName lastName')
      .populate('houseId', 'familyName')
      .populate('unitId', 'name')
      .populate('churchId', 'name')
      .populate('campaignId', 'name')
      .sort({ paymentDate: -1 })
      .limit(1000);
    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id)
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
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const transaction = await Transaction.create(req.body);

    // If this transaction is for a variable contribution campaign, track the contributor
    if (transaction.campaignId) {
      try {
        const campaign = await Campaign.findById(transaction.campaignId);

        if (campaign && campaign.contributionMode === 'variable') {
          const contributorId = campaign.amountType === 'per_member'
            ? transaction.memberId
            : transaction.houseId;

          if (contributorId) {
            // Check if contributor already exists
            const existingContributor = campaign.contributors?.find(
              c => String(c.contributorId) === String(contributorId)
            );

            if (existingContributor) {
              // Update existing contribution
              await Campaign.updateOne(
                { _id: campaign._id, 'contributors.contributorId': contributorId },
                {
                  $inc: { 'contributors.$.contributedAmount': transaction.totalAmount },
                  $set: { 'contributors.$.contributedAt': new Date() }
                }
              );
            } else {
              // Add new contributor
              await Campaign.updateOne(
                { _id: campaign._id },
                {
                  $push: {
                    contributors: {
                      contributorId: contributorId,
                      contributedAmount: transaction.totalAmount,
                      contributedAt: new Date()
                    }
                  }
                }
              );
            }

            // Update campaign total collected
            campaign.totalCollected = (campaign.totalCollected || 0) + transaction.totalAmount;
            await campaign.save();

            console.log(`✅ Tracked contribution for ${campaign.amountType}: ${contributorId} - ₹${transaction.totalAmount}`);
          }
        }
      } catch (campaignError) {
        console.error('⚠️ Error tracking campaign contribution:', campaignError);
        // Don't fail transaction creation if contributor tracking fails
      }
    }

    const populated = await Transaction.findById(transaction._id)
      .populate('memberId', 'firstName lastName')
      .populate('houseId', 'familyName')
      .populate('unitId', 'name')
      .populate('churchId', 'name')
      .populate('campaignId', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the transaction to check permissions
    const existingTransaction = await Transaction.findById(req.params.id);
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

    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
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
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the transaction to check permissions
    const transaction = await Transaction.findById(req.params.id);
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

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Campaign Controllers
export const getAllCampaigns = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show campaigns from their own church
    const filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    const campaigns = await Campaign.find(filter)
      .populate('churchId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('churchId', 'name');
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const campaign = await Campaign.create(req.body);

    // Reflect fixed campaign amount in wallets based on amountType
    // Only for 'fixed' contribution mode - 'variable' mode waits for actual contributions
    if (campaign.contributionMode === 'fixed' && campaign.fixedAmount && campaign.fixedAmount > 0) {
      try {
        if (campaign.amountType === 'per_member') {
          // Find all active members in the campaign's church
          const members = await Member.find({
            churchId: campaign.churchId,
            isActive: true
          });

          console.log(`📊 Campaign created: Adding ${campaign.fixedAmount} to ${members.length} member wallets`);

          // Update or create wallet for each member
          for (const member of members) {
            const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();

            await Wallet.findOneAndUpdate(
              { ownerId: member._id, walletType: 'member' },
              {
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
              },
              { upsert: true, new: true }
            );
          }

          // Update campaign participant count
          campaign.participantCount = members.length;
          await campaign.save();

        } else if (campaign.amountType === 'per_house') {
          // Find all houses in the campaign's church
          // First get all units in this church
          const units = await Unit.find({ churchId: campaign.churchId });
          const unitIds = units.map(u => u._id);

          // Get all bavanakutayimas in these units
          const bavanakutayimas = await Bavanakutayima.find({ unitId: { $in: unitIds } });
          const bavanakutayimaIds = bavanakutayimas.map(b => b._id);

          // Get all houses in these bavanakutayimas
          const houses = await House.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });

          console.log(`📊 Campaign created: Adding ${campaign.fixedAmount} to ${houses.length} house wallets`);

          // Update or create wallet for each house
          for (const house of houses) {
            await Wallet.findOneAndUpdate(
              { ownerId: house._id, walletType: 'house' },
              {
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
              },
              { upsert: true, new: true }
            );
          }

          // Update campaign participant count
          campaign.participantCount = houses.length;
          await campaign.save();
        }
      } catch (walletError) {
        console.error('⚠️ Error updating wallets for campaign:', walletError);
        // Don't fail the campaign creation if wallet update fails
        // The campaign is already created, just log the error
      }
    }

    const populated = await Campaign.findById(campaign._id).populate('churchId', 'name');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the campaign to check permissions
    const existingCampaign = await Campaign.findById(req.params.id);
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

    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('churchId', 'name');
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the campaign to check permissions
    const campaign = await Campaign.findById(req.params.id);
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

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Process dues for overdue campaigns with variable contribution mode
export const processCampaignDues = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId } = req.body;

    console.log('🔍 Processing dues for overdue campaigns...');

    // Build filter based on whether specific campaign ID is provided
    const now = new Date();
    const filter: any = {
      contributionMode: 'variable',
      isActive: true,
      duesProcessed: false,
      minimumAmount: { $gt: 0 }
    };

    // If specific campaign ID provided, add it to filter; otherwise filter by due date
    if (campaignId) {
      filter._id = campaignId;
      console.log(`Processing specific campaign: ${campaignId}`);
    } else {
      filter.dueDate = { $lte: now };
      console.log('Processing all overdue campaigns');
    }

    const overdueCampaigns = await Campaign.find(filter);

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
          const allMembers = await Member.find({
            churchId: campaign.churchId,
            isActive: true
          });

          const nonContributors = allMembers.filter(member =>
            !contributorIds.includes(String(member._id))
          );

          console.log(`  ${nonContributors.length} members haven't contributed`);

          // Add minimum amount to wallets of non-contributors
          for (const member of nonContributors) {
            const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();

            await Wallet.findOneAndUpdate(
              { ownerId: member._id, walletType: 'member' },
              {
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
              },
              { upsert: true, new: true }
            );
          }

          totalMembersProcessed += nonContributors.length;

        } else if (campaign.amountType === 'per_house') {
          // Find all houses in the campaign's church who haven't contributed
          const units = await Unit.find({ churchId: campaign.churchId });
          const unitIds = units.map(u => u._id);

          const bavanakutayimas = await Bavanakutayima.find({ unitId: { $in: unitIds } });
          const bavanakutayimaIds = bavanakutayimas.map(b => b._id);

          const allHouses = await House.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });

          const nonContributors = allHouses.filter(house =>
            !contributorIds.includes(String(house._id))
          );

          console.log(`  ${nonContributors.length} houses haven't contributed`);

          // Add minimum amount to wallets of non-contributors
          for (const house of nonContributors) {
            await Wallet.findOneAndUpdate(
              { ownerId: house._id, walletType: 'house' },
              {
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
              },
              { upsert: true, new: true }
            );
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

      } catch (campaignError) {
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
  } catch (error) {
    next(error);
  }
};

// Spiritual Activity Controllers
export const getAllSpiritualActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show activities from members in their own church
    let filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      // Get all members from this church
      const churchMembers = await Member.find({ churchId: req.user.churchId }).select('_id');
      const memberIds = churchMembers.map(m => m._id);
      filter.memberId = { $in: memberIds };
    }

    // Kudumbakutayima admin restriction: only show activities from members in their bavanakutayima
    if (req.user?.role === 'kudumbakutayima_admin' && req.user.bavanakutayimaId) {
      // Get all members from this bavanakutayima
      const members = await Member.find({ bavanakutayimaId: req.user.bavanakutayimaId }).select('_id');
      const memberIds = members.map(m => m._id);
      filter.memberId = { $in: memberIds };
    }

    const activities = await SpiritualActivity.find(filter)
      .populate('memberId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(1000);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

export const getSpiritualActivityById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await SpiritualActivity.findById(req.params.id).populate('memberId', 'firstName lastName');
    if (!activity) {
      res.status(404).json({ success: false, error: 'Spiritual activity not found' });
      return;
    }
    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const createSpiritualActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const activity = await SpiritualActivity.create(req.body);
    const populated = await SpiritualActivity.findById(activity._id).populate('memberId', 'firstName lastName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateSpiritualActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const activity = await SpiritualActivity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('memberId', 'firstName lastName');
    if (!activity) {
      res.status(404).json({ success: false, error: 'Spiritual activity not found' });
      return;
    }
    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const deleteSpiritualActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    const activity = await SpiritualActivity.findByIdAndDelete(req.params.id);
    if (!activity) {
      res.status(404).json({ success: false, error: 'Spiritual activity not found' });
      return;
    }
    res.json({ success: true, message: 'Spiritual activity deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Create User
export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const user = await User.create(req.body);
    const userWithoutPassword = await User.findById(user._id).select('-password -refreshToken');
    res.status(201).json({ success: true, data: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

// Update User
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the user to check permissions
    const existingUser = await User.findById(req.params.id);
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
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .select('-password -refreshToken');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Delete User
export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin') {
      res.status(403).json({ success: false, error: 'Unit admins have read-only access' });
      return;
    }

    // First find the user to check permissions
    const user = await User.findById(req.params.id);
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

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Member Self-Service Endpoints
export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const member = await Member.findById(memberId)
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
  } catch (error) {
    console.error('[getMyProfile] Error:', error);
    next(error);
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user?.memberId;

    if (!memberId) {
      res.status(404).json({ success: false, error: 'Member profile not found for this user' });
      return;
    }

    // Only allow updating specific fields
    const allowedFields = ['phone', 'email', 'smsPreferences'];
    const updates: any = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle password separately if provided
    if (req.body.password && req.body.password !== '') {
      updates.password = req.body.password;
    }

    const member = await Member.findByIdAndUpdate(
      memberId,
      updates,
      { new: true, runValidators: true }
    )
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
  } catch (error) {
    next(error);
  }
};

export const getMyTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user?.memberId;

    if (!memberId) {
      res.status(404).json({ success: false, error: 'Member profile not found for this user' });
      return;
    }

    const transactions = await Transaction.find({ memberId })
      .populate('campaignId', 'name')
      .populate('churchId', 'name')
      .populate('houseId', 'familyName')
      .sort({ paymentDate: -1 });

    res.json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

export const getMySpiritualActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user?.memberId;

    if (!memberId) {
      res.status(404).json({ success: false, error: 'Member profile not found for this user' });
      return;
    }

    const activities = await SpiritualActivity.find({ memberId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

export const createMySpiritualActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const activity = await SpiritualActivity.create(activityData);
    const populated = await SpiritualActivity.findById(activity._id)
      .populate('memberId', 'firstName lastName');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// News Controllers
export const getAllNews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show news from their own church
    const filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    const news = await News.find(filter)
      .populate('churchId', 'name')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

export const getNewsById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const news = await News.findById(req.params.id)
      .populate('churchId', 'name')
      .populate('createdBy', 'username email');
    if (!news) {
      res.status(404).json({ success: false, error: 'News not found' });
      return;
    }
    res.json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

export const createNews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const news = await News.create(req.body);
    const populated = await News.findById(news._id)
      .populate('churchId', 'name')
      .populate('createdBy', 'username email');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateNews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
      res.status(403).json({ success: false, error: 'Only church admins can update news' });
      return;
    }

    // First find the news to check permissions
    const existingNews = await News.findById(req.params.id);
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

    const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('churchId', 'name')
      .populate('createdBy', 'username email');
    if (!news) {
      res.status(404).json({ success: false, error: 'News not found' });
      return;
    }
    res.json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

export const deleteNews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
      res.status(403).json({ success: false, error: 'Only church admins can delete news' });
      return;
    }

    // First find the news to check permissions
    const news = await News.findById(req.params.id);
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

    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Event Controllers
export const getAllEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Church admin restriction: only show events from their own church
    const filter: any = {};
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    const events = await Event.find(filter)
      .populate('churchId', 'name')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('churchId', 'name')
      .populate('createdBy', 'username email');
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const event = await Event.create(req.body);
    const populated = await Event.findById(event._id)
      .populate('churchId', 'name')
      .populate('createdBy', 'username email');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
      res.status(403).json({ success: false, error: 'Only church admins can update events' });
      return;
    }

    // First find the event to check permissions
    const existingEvent = await Event.findById(req.params.id);
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

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('churchId', 'name')
      .populate('createdBy', 'username email');
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Unit admin restriction: read-only access
    if (req.user?.role === 'unit_admin' || req.user?.role === 'kudumbakutayima_admin' || req.user?.role === 'member') {
      res.status(403).json({ success: false, error: 'Only church admins can delete events' });
      return;
    }

    // First find the event to check permissions
    const event = await Event.findById(req.params.id);
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

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Member endpoints for viewing active News and Events
export const getActiveNews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const filter: any = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    // Filter by churchId if user has one
    if (req.user?.churchId) {
      filter.churchId = req.user.churchId;
    }

    const news = await News.find(filter)
      .populate('churchId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

export const getActiveEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const filter: any = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    // Filter by churchId if user has one
    if (req.user?.churchId) {
      filter.churchId = req.user.churchId;
    }

    const events = await Event.find(filter)
      .populate('churchId', 'name')
      .sort({ startDate: 1 });
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

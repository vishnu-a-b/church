import { Response, NextFunction } from 'express';
import StothrakazhchaDue from '../models/StothrakazhchaDue';
import Stothrakazhcha from '../models/Stothrakazhcha';
import Member from '../models/Member';
import House from '../models/House';
import Unit from '../models/Unit';
import Bavanakutayima from '../models/Bavanakutayima';
import Wallet from '../models/Wallet';
import { AuthRequest } from '../types';

// Get all Stothrakazhcha dues
export const getAllStothrakazhchaDues = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {};

    // Church admin restriction
    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    }

    // Filter by payment status if provided
    if (req.query.isPaid !== undefined) {
      filter.isPaid = req.query.isPaid === 'true';
    }

    // Filter by member/house if provided
    if (req.query.dueForId) {
      filter.dueForId = req.query.dueForId;
    }

    // Filter by year if provided
    if (req.query.year) {
      filter.year = parseInt(req.query.year as string);
    }

    const dues = await StothrakazhchaDue.find(filter)
      .populate('churchId', 'name')
      .populate('stothrakazhchaId', 'weekNumber year weekStartDate weekEndDate')
      .sort({ year: -1, weekNumber: -1, createdAt: -1 });

    // Calculate summary statistics
    const totalDue = dues.reduce((sum, due) => sum + (due.isPaid ? 0 : due.balance), 0);
    const totalPaid = dues.reduce((sum, due) => sum + due.paidAmount, 0);

    res.json({
      success: true,
      data: dues,
      summary: {
        totalDues: dues.length,
        unpaidDues: dues.filter(d => !d.isPaid).length,
        paidDues: dues.filter(d => d.isPaid).length,
        totalDueAmount: totalDue,
        totalPaidAmount: totalPaid
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Stothrakazhcha due by ID
export const getStothrakazhchaDueById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const due = await StothrakazhchaDue.findById(req.params.id)
      .populate('churchId', 'name')
      .populate('stothrakazhchaId', 'weekNumber year weekStartDate weekEndDate')
      .populate('transactionId');

    if (!due) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha due not found' });
      return;
    }

    res.json({ success: true, data: due });
  } catch (error) {
    next(error);
  }
};

// Get dues for a specific member or house
export const getDuesForEntity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entityId, entityType } = req.params;

    if (!['Member', 'House'].includes(entityType)) {
      res.status(400).json({ success: false, error: 'Invalid entity type. Must be "Member" or "House"' });
      return;
    }

    const dues = await StothrakazhchaDue.find({
      dueForId: entityId,
      dueForModel: entityType
    })
      .populate('churchId', 'name')
      .populate('stothrakazhchaId', 'weekNumber year weekStartDate weekEndDate')
      .sort({ year: -1, weekNumber: -1 });

    const totalDue = dues.reduce((sum, due) => sum + (due.isPaid ? 0 : due.balance), 0);
    const totalPaid = dues.reduce((sum, due) => sum + due.paidAmount, 0);

    res.json({
      success: true,
      data: dues,
      summary: {
        totalDues: dues.length,
        unpaidDues: dues.filter(d => !d.isPaid).length,
        paidDues: dues.filter(d => d.isPaid).length,
        totalDueAmount: totalDue,
        totalPaidAmount: totalPaid
      }
    });
  } catch (error) {
    next(error);
  }
};

// Process dues for overdue Stothrakazhcha (creates StothrakazhchaDue records)
export const processStothrakazhchaDues = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stothrakazhchaId } = req.body;

    console.log('🕐 Processing stothrakazhcha dues...');

    const now = new Date();
    const filter: any = {
      status: 'active',
      duesProcessed: false,
      defaultAmount: { $gt: 0 }
    };

    // If specific stothrakazhcha ID provided, add it to filter; otherwise filter by due date
    if (stothrakazhchaId) {
      filter._id = stothrakazhchaId;
      console.log(`Processing specific stothrakazhcha: ${stothrakazhchaId}`);
    } else {
      filter.dueDate = { $lte: now };
      console.log('Processing all overdue stothrakazhchas');
    }

    const overdueStothrakazhchas = await Stothrakazhcha.find(filter);

    console.log(`📊 Found ${overdueStothrakazhchas.length} overdue stothrakazhchas`);

    let totalMembersProcessed = 0;
    let totalHousesProcessed = 0;
    const processedStothrakazhchas = [];

    for (const stothrakazhcha of overdueStothrakazhchas) {
      try {
        console.log(`  Processing: Week ${stothrakazhcha.weekNumber}, ${stothrakazhcha.year}`);

        const contributorIds = (stothrakazhcha.contributors || []).map(c => String(c.contributorId));

        // Calculate average amount from contributors
        // Formula: total amount collected / total number of contributors
        let dueAmount = stothrakazhcha.defaultAmount;
        if (stothrakazhcha.totalContributors > 0 && stothrakazhcha.totalCollected > 0) {
          dueAmount = stothrakazhcha.totalCollected / stothrakazhcha.totalContributors;
          console.log(`  Calculated average amount: ₹${dueAmount} (${stothrakazhcha.totalCollected} / ${stothrakazhcha.totalContributors})`);
        } else {
          console.log(`  Using default amount: ₹${dueAmount}`);
        }

        if (stothrakazhcha.amountType === 'per_member') {
          // Find all active members who haven't contributed
          const allMembers = await Member.find({
            churchId: stothrakazhcha.churchId,
            isActive: true
          });

          const nonContributors = allMembers.filter(member =>
            !contributorIds.includes(String(member._id))
          );

          console.log(`  Creating dues for ${nonContributors.length} members`);

          for (const member of nonContributors) {
            const ownerName = `${member.firstName} ${member.lastName || ''}`.trim();

            // Create StothrakazhchaDue record
            await StothrakazhchaDue.create({
              churchId: stothrakazhcha.churchId,
              stothrakazhchaId: stothrakazhcha._id,
              weekNumber: stothrakazhcha.weekNumber,
              year: stothrakazhcha.year,
              dueForId: member._id,
              dueForModel: 'Member',
              dueForName: ownerName,
              amount: dueAmount,
              balance: dueAmount,
              isPaid: false,
              dueDate: stothrakazhcha.dueDate
            });

            // Also add to wallet balance for backward compatibility
            await Wallet.findOneAndUpdate(
              { ownerId: member._id, walletType: 'member' },
              {
                $inc: { balance: dueAmount },
                $push: {
                  transactions: {
                    transactionId: null,
                    amount: dueAmount,
                    type: `stothrakazhcha_week${stothrakazhcha.weekNumber}_due`,
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

        } else if (stothrakazhcha.amountType === 'per_house') {
          // Find all houses who haven't contributed
          const units = await Unit.find({ churchId: stothrakazhcha.churchId });
          const unitIds = units.map(u => u._id);

          const bavanakutayimas = await Bavanakutayima.find({ unitId: { $in: unitIds } });
          const bavanakutayimaIds = bavanakutayimas.map(b => b._id);

          const allHouses = await House.find({ bavanakutayimaId: { $in: bavanakutayimaIds } });

          const nonContributors = allHouses.filter(house =>
            !contributorIds.includes(String(house._id))
          );

          console.log(`  Creating dues for ${nonContributors.length} houses`);

          for (const house of nonContributors) {
            // Create StothrakazhchaDue record
            await StothrakazhchaDue.create({
              churchId: stothrakazhcha.churchId,
              stothrakazhchaId: stothrakazhcha._id,
              weekNumber: stothrakazhcha.weekNumber,
              year: stothrakazhcha.year,
              dueForId: house._id,
              dueForModel: 'House',
              dueForName: house.familyName,
              amount: dueAmount,
              balance: dueAmount,
              isPaid: false,
              dueDate: stothrakazhcha.dueDate
            });

            // Also add to wallet balance for backward compatibility
            await Wallet.findOneAndUpdate(
              { ownerId: house._id, walletType: 'house' },
              {
                $inc: { balance: dueAmount },
                $push: {
                  transactions: {
                    transactionId: null,
                    amount: dueAmount,
                    type: `stothrakazhcha_week${stothrakazhcha.weekNumber}_due`,
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

        // Mark as processed
        stothrakazhcha.duesProcessed = true;
        stothrakazhcha.duesProcessedAt = new Date();
        stothrakazhcha.status = 'processed';
        await stothrakazhcha.save();

        processedStothrakazhchas.push({
          id: stothrakazhcha._id,
          week: stothrakazhcha.weekNumber,
          year: stothrakazhcha.year,
          defaultAmount: stothrakazhcha.defaultAmount
        });

      } catch (error) {
        console.error(`  ❌ Error processing stothrakazhcha:`, error);
      }
    }

    console.log(`✅ Processing complete: ${totalMembersProcessed} members, ${totalHousesProcessed} houses`);

    res.json({
      success: true,
      message: 'Stothrakazhcha dues processed successfully',
      data: {
        processedCount: processedStothrakazhchas.length,
        totalMembersProcessed,
        totalHousesProcessed,
        processed: processedStothrakazhchas
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark a due as paid
export const markDueAsPaid = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { transactionId, paidAmount, notes } = req.body;

    const due = await StothrakazhchaDue.findById(id);

    if (!due) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha due not found' });
      return;
    }

    // Church admin restriction
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      if (String(due.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Cannot update due from another church' });
        return;
      }
    }

    const amountToPay = paidAmount || due.balance;

    due.paidAmount += amountToPay;
    due.balance = Math.max(0, due.amount - due.paidAmount);
    due.isPaid = due.balance === 0;
    due.transactionId = transactionId;
    due.paidAt = new Date();
    if (notes) due.notes = notes;

    await due.save();

    res.json({ success: true, data: due, message: 'Due payment recorded successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete a due (admin only)
export const deleteStothrakazhchaDue = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const due = await StothrakazhchaDue.findById(req.params.id);

    if (!due) {
      res.status(404).json({ success: false, error: 'Stothrakazhcha due not found' });
      return;
    }

    // Church admin restriction
    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      if (String(due.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Cannot delete due from another church' });
        return;
      }
    }

    await StothrakazhchaDue.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Stothrakazhcha due deleted successfully' });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import Donor from '../models/Donor';
import { AuthRequest } from '../types';
import { sendDonorCredentialsEmail } from '../services/emailService';

// Donors have no uniqueId (unlike Member) — build one from the name + a
// disambiguator so two donors with the same name don't collide on username.
function buildUsername(donor: any): string {
  const slug = donor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const disambiguator = donor.phone
    ? donor.phone.replace(/[^0-9]/g, '').slice(-4)
    : String(donor._id).slice(-4);
  return `${slug}${disambiguator}`;
}

function buildTempPassword(donor: any): string {
  return donor.phone ? donor.phone.replace(/[^0-9]/g, '').slice(-6) : String(donor._id).slice(-6);
}

// Generate default credentials for a donor
export const generateDonorCredentials = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const donor = await Donor.findById(id);

    if (!donor) {
      res.status(404).json({ success: false, error: 'Donor not found' });
      return;
    }

    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      if (String(donor.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Cannot generate credentials for donor from another church' });
        return;
      }
    }

    if (donor.username) {
      res.status(400).json({
        success: false,
        error: 'Donor already has credentials. Use reset password instead.',
      });
      return;
    }

    const username = buildUsername(donor);
    const defaultPassword = buildTempPassword(donor);

    donor.username = username;
    donor.password = defaultPassword; // hashed by pre-save hook

    await donor.save();

    if (donor.email) {
      sendDonorCredentialsEmail({
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        address: donor.address,
        username,
        tempPassword: defaultPassword,
      }).catch((error) => console.error('Failed to send donor credentials email:', error));
    }

    res.json({
      success: true,
      message: 'Credentials generated successfully',
      data: {
        username,
        tempPassword: defaultPassword,
        donorId: donor._id,
        donorName: donor.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Reset donor password
export const resetDonorPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      return;
    }

    const donor = await Donor.findById(id);
    if (!donor) {
      res.status(404).json({ success: false, error: 'Donor not found' });
      return;
    }

    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      if (String(donor.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Cannot reset password for donor from another church' });
        return;
      }
    }

    if (!donor.username) {
      res.status(400).json({
        success: false,
        error: 'Donor does not have login credentials. Generate credentials first.',
      });
      return;
    }

    donor.password = newPassword;
    await donor.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        username: donor.username,
        newPassword,
        donorId: donor._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all donors with credentials (username only, no passwords)
export const getDonorsWithCredentials = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = { username: { $exists: true, $ne: null } };

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.query.churchId && req.user?.role === 'super_admin') {
      filter.churchId = req.query.churchId;
    }

    const donors = await Donor.find(filter)
      .select('name username role phone email isActive churchId')
      .populate('churchId', 'name')
      .sort({ name: 1 });

    res.json({ success: true, count: donors.length, data: donors });
  } catch (error) {
    next(error);
  }
};

// Get donors WITHOUT credentials
export const getDonorsWithoutCredentials = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = {
      $or: [{ username: { $exists: false } }, { username: null }],
      isActive: true,
    };

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.query.churchId && req.user?.role === 'super_admin') {
      filter.churchId = req.query.churchId;
    }

    const donors = await Donor.find(filter)
      .select('name phone email isActive churchId')
      .populate('churchId', 'name')
      .sort({ name: 1 });

    res.json({ success: true, count: donors.length, data: donors });
  } catch (error) {
    next(error);
  }
};

// Bulk generate credentials for all donors without login (optionally scoped to one church)
export const bulkGenerateDonorCredentials = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!['super_admin', 'church_admin'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, error: 'Only admins can bulk generate credentials' });
      return;
    }

    const filter: any = {
      $or: [{ username: { $exists: false } }, { username: null }],
      isActive: true,
    };

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.body.churchId && req.user?.role === 'super_admin') {
      filter.churchId = req.body.churchId;
    }

    const donors = await Donor.find(filter);
    const generatedCredentials = [];

    for (const donor of donors) {
      try {
        const username = buildUsername(donor);
        const defaultPassword = buildTempPassword(donor);

        donor.username = username;
        donor.password = defaultPassword;

        await donor.save();

        if (donor.email) {
          sendDonorCredentialsEmail({
            name: donor.name,
            email: donor.email,
            phone: donor.phone,
            address: donor.address,
            username,
            tempPassword: defaultPassword,
          }).catch((error) => console.error('Failed to send donor credentials email:', error));
        }

        generatedCredentials.push({
          donorId: donor._id,
          donorName: donor.name,
          username,
          tempPassword: defaultPassword,
        });
      } catch (error) {
        console.error(`Error generating credentials for donor ${donor._id}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Credentials generated for ${generatedCredentials.length} donors`,
      count: generatedCredentials.length,
      data: generatedCredentials,
    });
  } catch (error) {
    next(error);
  }
};

// Remove/disable donor login credentials
export const removeDonorCredentials = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const donor = await Donor.findById(id);

    if (!donor) {
      res.status(404).json({ success: false, error: 'Donor not found' });
      return;
    }

    if (req.user?.role === 'church_admin') {
      if (!req.user.churchId) {
        res.status(403).json({ success: false, error: 'Church admin must have a church assigned' });
        return;
      }
      if (String(donor.churchId) !== String(req.user.churchId)) {
        res.status(403).json({ success: false, error: 'Cannot remove credentials for donor from another church' });
        return;
      }
    }

    donor.username = undefined;
    donor.password = undefined;
    donor.refreshToken = undefined;

    await donor.save();

    res.json({
      success: true,
      message: 'Donor credentials removed successfully',
      data: { donorId: donor._id, donorName: donor.name },
    });
  } catch (error) {
    next(error);
  }
};

// Export credentials list (for printing/distribution)
export const exportDonorCredentialsList = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: any = { username: { $exists: true, $ne: null } };

    if (req.user?.role === 'church_admin' && req.user.churchId) {
      filter.churchId = req.user.churchId;
    } else if (req.query.churchId && req.user?.role === 'super_admin') {
      filter.churchId = req.query.churchId;
    }

    const donors = await Donor.find(filter)
      .select('name username role phone churchId')
      .populate('churchId', 'name')
      .sort({ name: 1 });

    const exportData = donors.map((donor) => ({
      Name: donor.name,
      Username: donor.username,
      Role: donor.role,
      Phone: donor.phone || 'N/A',
      Church: (donor.churchId as any)?.name || 'N/A',
    }));

    res.json({ success: true, count: exportData.length, data: exportData });
  } catch (error) {
    next(error);
  }
};

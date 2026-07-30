import mongoose from 'mongoose';
import User from '../models/User';
import Church from '../models/Church';
import Unit from '../models/Unit';
import Bavanakutayima from '../models/Bavanakutayima';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface AdminUser {
  username: string;
  email: string;
  password: string;
  role: 'super_admin' | 'church_admin' | 'unit_admin' | 'kudumbakutayima_admin';
  churchId?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  bavanakutayimaId?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const createAllAdmins = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-wallet';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const adminsToCreate: AdminUser[] = [];
    const createdAdmins: any[] = [];

    // ========================
    // 1. CREATE SUPER ADMIN
    // ========================
    console.log('🔹 Preparing Super Admin...');
    const superAdminData: AdminUser = {
      username: 'superadmin',
      email: 'superadmin@church.com',
      password: 'SuperAdmin@123',
      role: 'super_admin',
      isActive: true,
    };

    // Check if super admin exists
    const existingSuperAdmin = await User.findOne({
      $or: [
        { email: superAdminData.email },
        { username: superAdminData.username }
      ]
    });

    if (existingSuperAdmin) {
      console.log('   ⚠️  Super Admin already exists - skipping');
    } else {
      adminsToCreate.push(superAdminData);
      console.log('   ✓ Super Admin prepared');
    }

    // ========================
    // 2. CREATE CHURCH ADMINS
    // ========================
    console.log('\n🔹 Preparing Church Admins...');
    const churches = await Church.find({});
    console.log(`   Found ${churches.length} church(es)`);

    for (const church of churches) {
      const churchAdminUsername = `admin_${church.uniqueId || church.churchNumber}`.toLowerCase();
      const churchAdminEmail = `admin@${church.uniqueId || church.churchNumber}.church.com`.toLowerCase();

      // Check if church admin exists
      const existingChurchAdmin = await User.findOne({
        $or: [
          { email: churchAdminEmail },
          { username: churchAdminUsername }
        ]
      });

      if (existingChurchAdmin) {
        console.log(`   ⚠️  Church Admin for ${church.name} already exists - skipping`);
        continue;
      }

      const churchAdminData: AdminUser = {
        username: churchAdminUsername,
        email: churchAdminEmail,
        password: 'ChurchAdmin@123',
        role: 'church_admin',
        churchId: church._id as mongoose.Types.ObjectId,
        isActive: true,
      };

      adminsToCreate.push(churchAdminData);
      console.log(`   ✓ Church Admin for ${church.name} prepared`);
    }

    // ========================
    // 3. CREATE UNIT ADMINS
    // ========================
    console.log('\n🔹 Preparing Unit Admins...');
    const units = await Unit.find({});
    console.log(`   Found ${units.length} unit(s)`);
    // Bavanakutayima has no churchId of its own — it's derived via its parent Unit.
    const unitChurchMap = new Map(units.map((u) => [u._id.toString(), u.churchId as mongoose.Types.ObjectId]));

    for (const unit of units) {
      const unitAdminUsername = `unit_${unit.uniqueId || unit.unitCode}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const unitAdminEmail = `unit@${unit.uniqueId || unit.unitCode}.church.com`.toLowerCase().replace(/[^a-z0-9@._]/g, '');

      // Check if unit admin exists
      const existingUnitAdmin = await User.findOne({
        $or: [
          { email: unitAdminEmail },
          { username: unitAdminUsername }
        ]
      });

      if (existingUnitAdmin) {
        console.log(`   ⚠️  Unit Admin for ${unit.name} already exists - skipping`);
        continue;
      }

      const unitAdminData: AdminUser = {
        username: unitAdminUsername,
        email: unitAdminEmail,
        password: 'UnitAdmin@123',
        role: 'unit_admin',
        churchId: unit.churchId as mongoose.Types.ObjectId,
        unitId: unit._id as mongoose.Types.ObjectId,
        isActive: true,
      };

      adminsToCreate.push(unitAdminData);
      console.log(`   ✓ Unit Admin for ${unit.name} prepared`);
    }

    // ========================
    // 4. CREATE KUDUMBAKUTAYIMA ADMINS
    // ========================
    console.log('\n🔹 Preparing Bavanakutayima Admins...');
    const bavanakutayimas = await Bavanakutayima.find({});
    console.log(`   Found ${bavanakutayimas.length} bavanakutayima(s)`);

    for (const bavana of bavanakutayimas) {
      const kutayimaAdminUsername = `kutayima_${bavana.uniqueId}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const kutayimaAdminEmail = `kutayima@${bavana.uniqueId}.church.com`.toLowerCase().replace(/[^a-z0-9@._]/g, '');

      // Check if kutayima admin exists
      const existingKutayimaAdmin = await User.findOne({
        $or: [
          { email: kutayimaAdminEmail },
          { username: kutayimaAdminUsername }
        ]
      });

      if (existingKutayimaAdmin) {
        console.log(`   ⚠️  Bavanakutayima Admin for ${bavana.name} already exists - skipping`);
        continue;
      }

      const kutayimaAdminData: AdminUser = {
        username: kutayimaAdminUsername,
        email: kutayimaAdminEmail,
        password: 'KutayimaAdmin@123',
        role: 'kudumbakutayima_admin',
        churchId: unitChurchMap.get(bavana.unitId.toString()),
        unitId: bavana.unitId as mongoose.Types.ObjectId,
        bavanakutayimaId: bavana._id as mongoose.Types.ObjectId,
        isActive: true,
      };

      adminsToCreate.push(kutayimaAdminData);
      console.log(`   ✓ Bavanakutayima Admin for ${bavana.name} prepared`);
    }

    // ========================
    // CREATE ALL ADMINS
    // ========================
    if (adminsToCreate.length === 0) {
      console.log('\n⚠️  No new admins to create. All admins already exist.');
      process.exit(0);
    }

    console.log(`\n🚀 Creating ${adminsToCreate.length} admin user(s)...\n`);

    for (const adminData of adminsToCreate) {
      try {
        const admin = await User.create(adminData);
        createdAdmins.push({
          username: adminData.username,
          email: adminData.email,
          password: adminData.password,
          role: adminData.role,
        });
        console.log(`   ✅ Created: ${adminData.role} - ${adminData.username}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to create ${adminData.username}:`, error.message);
      }
    }

    // ========================
    // DISPLAY CREDENTIALS
    // ========================
    if (createdAdmins.length > 0) {
      console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
      console.log('║           ✨ ADMIN USERS CREATED SUCCESSFULLY ✨              ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');

      createdAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.role.toUpperCase().replace(/_/g, ' ')}`);
        console.log('   ═══════════════════════════════════════');
        console.log(`   📧 Email:    ${admin.email}`);
        console.log(`   👤 Username: ${admin.username}`);
        console.log(`   🔑 Password: ${admin.password}`);
        console.log(`   🛡️  Role:     ${admin.role}`);
        console.log('');
      });

      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║                     ⚠️  IMPORTANT NOTES ⚠️                     ║');
      console.log('╠════════════════════════════════════════════════════════════════╣');
      console.log('║  • Save these credentials securely                             ║');
      console.log('║  • Change passwords after first login                          ║');
      console.log('║  • Super Admin has full system access                          ║');
      console.log('║  • Church Admins can manage their church data                  ║');
      console.log('║  • Unit Admins have read-only access                           ║');
      console.log('║  • Bavanakutayima Admins have read-only access                 ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
    }

    console.log(`✅ Total admins created: ${createdAdmins.length}`);
    console.log('🎉 Admin creation completed!\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating admins:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the script
createAllAdmins();

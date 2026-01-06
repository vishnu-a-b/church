import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-wallet';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Super Admin credentials
    const superAdminData = {
      username: 'superadmin',
      email: 'superadmin@church.com',
      password: 'SuperAdmin@123',
      role: 'super_admin',
      isActive: true,
    };

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      $or: [
        { email: superAdminData.email },
        { username: superAdminData.username }
      ]
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists!');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('👤 Username:', existingSuperAdmin.username);
      console.log('🔑 Role:', existingSuperAdmin.role);
      console.log('\nℹ️  Use the existing credentials or delete the user first.');
      process.exit(0);
    }

    // Create super admin
    const superAdmin = await User.create(superAdminData);

    console.log('\n✨ Super Admin Created Successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    ', superAdminData.email);
    console.log('👤 Username: ', superAdminData.username);
    console.log('🔑 Password: ', superAdminData.password);
    console.log('🛡️  Role:     ', superAdminData.role);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    console.log('💡 Change the password after first login.\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  }
};

// Run the script
createSuperAdmin();

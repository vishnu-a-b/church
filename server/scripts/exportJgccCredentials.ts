import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
const XLSX = require(path.join(__dirname, '../../client/node_modules/xlsx'));
dotenv.config();

// One-off: export the 283 JGCC hall-booking donors with their login
// credentials to an .xlsx file. Passwords are bcrypt-hashed in the DB and
// can't be recovered, but both username and temp password are generated
// deterministically from the donor's phone number (see buildUsername/
// buildTempPassword in donorCredentialController.ts), so they can be
// recomputed here without touching the stored hash.
const PLAN_ID = '6a6b32bdd3ec2cf606b50838'; // Jubilee Grand Convention Centre

function buildUsername(donor: { name: string; phone?: string; _id: any }): string {
  const slug = donor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const disambiguator = donor.phone
    ? donor.phone.replace(/[^0-9]/g, '').slice(-4)
    : String(donor._id).slice(-4);
  return `${slug}${disambiguator}`;
}

function buildTempPassword(donor: { phone?: string; _id: any }): string {
  return donor.phone ? donor.phone.replace(/[^0-9]/g, '').slice(-6) : String(donor._id).slice(-6);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const MonthlySupportPlan = (await import('../src/models/MonthlySupportPlan')).default;
  const Donor = (await import('../src/models/Donor')).default;

  const plan = await MonthlySupportPlan.findById(PLAN_ID).lean();
  if (!plan) throw new Error('JGCC plan not found');

  const rows: any[] = [];
  for (const m of plan.members) {
    if (!m.donorId) continue;
    const donor = await Donor.findById(m.donorId).select('name phone notes username isActive');
    if (!donor) continue;

    const hasCredentials = !!donor.username;
    const expectedUsername = buildUsername(donor);
    const usernameMatches = donor.username === expectedUsername;

    rows.push({
      'Name': donor.name,
      'Phone': donor.phone || '',
      'Monthly Amount (Rs)': m.amount,
      'Username': donor.username || (hasCredentials ? '' : expectedUsername),
      'Password': usernameMatches || !hasCredentials ? buildTempPassword(donor) : '(password changed - reset required)',
      'Has Login': hasCredentials ? 'Yes' : 'No',
      'Active': donor.isActive ? 'Yes' : 'No',
      'Notes': donor.notes || '',
    });
  }

  console.log(`Building sheet for ${rows.length} donors...`);

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 28 }, // Name
    { wch: 14 }, // Phone
    { wch: 16 }, // Amount
    { wch: 22 }, // Username
    { wch: 14 }, // Password
    { wch: 10 }, // Has Login
    { wch: 8 },  // Active
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'JGCC Credentials');

  const outPath = process.argv[2] || '/tmp/JGCC_Hall_Booking_Members_Credentials.xlsx';
  XLSX.writeFile(wb, outPath);
  console.log(`Wrote ${rows.length} rows to ${outPath}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => mongoose.connection.close());

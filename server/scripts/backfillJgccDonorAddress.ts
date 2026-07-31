import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
const XLSX = require(path.join(__dirname, '../../client/node_modules/xlsx'));
dotenv.config();

// One-off: the JGCC donors were originally loaded with only name/phone/notes
// (see load_jgcc.js) — the source spreadsheet's "House Name" column is a real
// address and was never carried over. Backfill it now that Donor has an
// address field.
const CHURCH_ID = '6a6ad8ed6edc1ea35e24566b'; // St. Mary's Church, Elthuruth
const XLSX_PATH = '/Users/vishnuab/Official/myProjects/elthuruth/Convention Centre 1.xlsx';

async function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1, defval: '' });

  const addressByName = new Map<string, string>();
  for (const row of rows) {
    const name = String(row[2] || '').trim();
    const houseName = String(row[3] || '').trim();
    if (name && houseName && !addressByName.has(name)) {
      addressByName.set(name, houseName);
    }
  }
  console.log(`Parsed ${addressByName.size} name->address pairs from the spreadsheet`);

  await mongoose.connect(process.env.MONGODB_URI as string);
  const Donor = (await import('../src/models/Donor')).default;

  const donors = await Donor.find({ churchId: CHURCH_ID, notes: { $regex: /^JGCC slots:/ } });
  console.log(`Found ${donors.length} JGCC donors in the DB`);

  let updated = 0;
  let noMatch = 0;
  let failed = 0;
  for (const donor of donors) {
    const address = addressByName.get(donor.name.trim());
    if (!address) {
      noMatch++;
      continue;
    }
    if (donor.address === address) continue;
    donor.address = address;
    try {
      await donor.save();
      updated++;
    } catch (err: any) {
      failed++;
      console.error(`Failed to save ${donor.name} (${donor._id}): ${err.message}`);
    }
  }

  console.log(`Updated ${updated} donors, ${noMatch} had no matching spreadsheet row, ${failed} failed to save`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => mongoose.connection.close());

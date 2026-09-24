/**
 * Update member email addresses from email.xlsx
 *
 * The xlsx code column format: "unit : bk : house : member"  e.g. "7: 13 : 1 : 1 "
 * Member uniqueId format:      "{churchN}-{unitN}-{bkN}-{houseN}-{memberN}"
 *
 * Run from Church/server/:
 *   npx ts-node --transpile-only src/scripts/update-emails-from-xlsx.ts
 *
 * Dry-run (no DB writes):
 *   DRY_RUN=1 npx ts-node --transpile-only src/scripts/update-emails-from-xlsx.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import * as XLSX from 'xlsx';
import Church from '../models/Church';
import Member from '../models/Member';

dotenv.config();

const XLSX_PATH = path.join(__dirname, '../../../../email.xlsx');
const DRY_RUN = process.env.DRY_RUN === '1';

interface XlsxRow {
  code: string;
  name: string;
  email: string;
}

function parseCode(code: string): { unit: number; bk: number; house: number; member: number } | null {
  // "7: 13 : 1 : 1 " → [7, 13, 1, 1]
  const parts = code
    .split(':')
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => !isNaN(n));
  if (parts.length !== 4) return null;
  return { unit: parts[0], bk: parts[1], house: parts[2], member: parts[3] };
}

function readXlsx(): XlsxRow[] {
  const wb = XLSX.readFile(XLSX_PATH);
  const rows: XlsxRow[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

    // Find column offsets of each block by locating 'no' in the header row
    // Each block layout: [no, code, name, house, phone, email, ...]
    const blockOffsets: number[] = [];
    for (const row of data) {
      const found = row
        .map((v: any, i: number) => ({ v, i }))
        .filter(({ v }: { v: any }) => v === 'no')
        .map(({ i }: { i: number }) => i);
      if (found.length > 0) {
        blockOffsets.push(...found);
        break;
      }
    }
    if (blockOffsets.length === 0) blockOffsets.push(0); // fallback

    for (const row of data) {
      for (const offset of blockOffsets) {
        const code = row[offset + 1];
        const name = row[offset + 2];
        const email = row[offset + 5];

        if (!code || typeof code !== 'string') continue;
        if (!email || typeof email !== 'string') continue;
        if (!code.includes(':')) continue;

        const trimmedEmail = email.replace(/\s/g, '').toLowerCase();
        if (!trimmedEmail || !trimmedEmail.includes('@')) continue;

        rows.push({ code: code.trim(), name: String(name || '').trim(), email: trimmedEmail });
      }
    }
  }

  return rows;
}

const main = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  if (DRY_RUN) console.log('DRY RUN — no changes will be written\n');

  // Find the main Elthuruth church (newest, non-test)
  const allChurches = await Church.find({ name: /elthuruth/i }).sort({ _id: -1 }).lean();
  const church = allChurches.find((c) => !/test/i.test(c.name));
  if (!church) {
    console.error('Could not find main Elthuruth church. Aborting.');
    process.exit(1);
  }
  const churchN = (church as any).churchNumber;
  console.log(`Church: "${church.name}"  (churchNumber: ${churchN})\n`);

  const rows = readXlsx();
  console.log(`Rows with email found in xlsx: ${rows.length}\n`);

  let emailUpdated = 0;
  let flagEnabled = 0;
  let alreadyOk = 0;
  let skipped = 0;
  let notFound = 0;

  for (const row of rows) {
    const parsed = parseCode(row.code);
    if (!parsed) {
      console.warn(`  SKIP — cannot parse code: "${row.code}"`);
      skipped++;
      continue;
    }

    const uniqueId = `${churchN}-${parsed.unit}-${parsed.bk}-${parsed.house}-${parsed.member}`;
    const member = await Member.findOne({ uniqueId }).lean();

    if (!member) {
      console.warn(`  NOT FOUND — uniqueId: ${uniqueId}  name: ${row.name}`);
      notFound++;
      continue;
    }

    const emailChanged = member.email !== row.email;
    const needsFlagEnable = !(member as any).emailNotificationsEnabled;

    if (!emailChanged && !needsFlagEnable) {
      alreadyOk++;
      continue;
    }

    const changes: string[] = [];
    if (emailChanged) changes.push(`email → ${row.email}`);
    if (needsFlagEnable) changes.push('emailNotificationsEnabled → true');
    console.log(`  UPDATE  ${uniqueId}  ${member.firstName} ${(member as any).lastName || ''}  [${changes.join(', ')}]`);

    if (!DRY_RUN) {
      await Member.updateOne(
        { _id: member._id },
        { $set: { email: row.email, emailNotificationsEnabled: true } },
      );
    }

    if (emailChanged) emailUpdated++;
    if (needsFlagEnable) flagEnabled++;
  }

  console.log('\n─────────────────────────────────');
  console.log(`Email updated:              ${emailUpdated}`);
  console.log(`Notifications flag enabled: ${flagEnabled}`);
  console.log(`Already fully up to date:   ${alreadyOk}`);
  console.log(`Skipped (bad code):         ${skipped}`);
  console.log(`Not found in DB:            ${notFound}`);
  if (DRY_RUN) console.log('\n(DRY RUN — nothing was written)');

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});

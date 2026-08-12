import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Church from './models/Church';
import Unit from './models/Unit';
import Bavanakutayima from './models/Bavanakutayima';
import House from './models/House';
import Member from './models/Member';
import Transaction from './models/Transaction';
import Campaign from './models/Campaign';
import SpiritualActivity from './models/SpiritualActivity';
import StothrakazhchaDue from './models/StothrakazhchaDue';
import connectDB from './config/database';

dotenv.config();

const pad = (n: number) => String(n).padStart(3, '0');

interface UnitEntry {
  unitNumber: number;
  name: string;
}
interface BkEntry {
  unitNumber: number;
  globalBkNumber: number;
  localBkNumber: number;
}
interface HouseEntry {
  unitNumber: number;
  globalBkNumber: number;
  localBkNumber: number;
  houseNumber: number;
  familyName: string;
}
interface MemberEntry {
  unitNumber: number;
  globalBkNumber: number;
  localBkNumber: number;
  houseNumber: number;
  memberNumber: number;
  firstName: string;
  phone: string | null;
}
interface SeedData {
  units: UnitEntry[];
  bks: BkEntry[];
  houses: HouseEntry[];
  members: MemberEntry[];
}
interface FirstHouseEntry {
  houseId: mongoose.Types.ObjectId;
  unitId: mongoose.Types.ObjectId;
  bkId: mongoose.Types.ObjectId;
  unitNumber: number;
  localBkNumber: number;
  houseNumber: number;
}

async function main() {
  await connectDB();

  // ── Step 1: Clear collections ────────────────────────────────────────────────
  console.log('Clearing existing data...');
  await StothrakazhchaDue.deleteMany({});
  await SpiritualActivity.deleteMany({});
  await Transaction.deleteMany({});
  await Campaign.deleteMany({});
  await Member.deleteMany({});
  await House.deleteMany({});
  await Bavanakutayima.deleteMany({});
  await Unit.deleteMany({});
  await Church.deleteMany({});
  console.log('Done.');

  // ── Step 2: Load extracted data ──────────────────────────────────────────────
  const dataPath = path.join(__dirname, 'elthuruth_data.json');
  const data: SeedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // ── Step 3: Create Church ────────────────────────────────────────────────────
  const church = await Church.create({
    churchNumber: 1,
    uniqueId: 'CH001',
    name: "St. Mary's Church, Elthuruth",
    location: 'Elthuruth, Thrissur, Kerala',
    diocese: 'Ernakulam-Angamaly Archdiocese',
    settings: { smsEnabled: true, smsProvider: 'fast2sms', smsSenderId: 'STMARY', currency: 'INR' },
  });
  console.log(`Church  : ${church.name}`);

  // ── Step 4: Create Units ─────────────────────────────────────────────────────
  const unitMap = new Map<number, mongoose.Types.ObjectId>(); // unitNumber → _id
  for (const u of data.units) {
    const doc = await Unit.create({
      churchId: church._id,
      unitNumber: u.unitNumber,
      uniqueId: `CH001-U${pad(u.unitNumber)}`,
      name: u.name,
    });
    unitMap.set(u.unitNumber, doc._id as mongoose.Types.ObjectId);
  }
  console.log(`Units   : ${data.units.length}`);

  // ── Step 5: Create BKs ──────────────────────────────────────────────────────
  const bkMap = new Map<string, mongoose.Types.ObjectId>(); // `${unitNo}:${localBkNo}` → _id
  const bkGlobalMap = new Map<number, BkEntry>(); // globalBkNumber → bk entry
  for (const bk of data.bks) {
    const unitId = unitMap.get(bk.unitNumber)!;
    const unitName = data.units.find(u => u.unitNumber === bk.unitNumber)?.name ?? '';
    const doc = await Bavanakutayima.create({
      unitId,
      bavanakutayimaNumber: bk.localBkNumber,
      uniqueId: `CH001-U${pad(bk.unitNumber)}-BK${pad(bk.localBkNumber)}`,
      name: unitName,
    });
    bkMap.set(`${bk.unitNumber}:${bk.localBkNumber}`, doc._id as mongoose.Types.ObjectId);
    bkGlobalMap.set(bk.globalBkNumber, bk);
  }
  console.log(`BKs     : ${data.bks.length}`);

  // ── Step 6: Create Houses ────────────────────────────────────────────────────
  const houseMap = new Map<string, mongoose.Types.ObjectId>(); // `${unitNo}:${localBkNo}:${houseNo}` → _id
  const unitFirstHouse = new Map<number, FirstHouseEntry>();
  const bkFirstHouse = new Map<number, FirstHouseEntry>(); // globalBkNo → first house

  for (const h of data.houses) {
    const unitId = unitMap.get(h.unitNumber)!;
    const bkId = bkMap.get(`${h.unitNumber}:${h.localBkNumber}`)!;
    const doc = await House.create({
      bavanakutayimaId: bkId,
      houseNumber: h.houseNumber,
      uniqueId: `CH001-U${pad(h.unitNumber)}-BK${pad(h.localBkNumber)}-H${pad(h.houseNumber)}`,
      familyName: h.familyName,
    });
    const houseId = doc._id as mongoose.Types.ObjectId;
    houseMap.set(`${h.unitNumber}:${h.localBkNumber}:${h.houseNumber}`, houseId);

    const entry: FirstHouseEntry = {
      houseId, unitId, bkId,
      unitNumber: h.unitNumber,
      localBkNumber: h.localBkNumber,
      houseNumber: h.houseNumber,
    };

    if (!unitFirstHouse.has(h.unitNumber)) {
      unitFirstHouse.set(h.unitNumber, entry);
    }
    if (!bkFirstHouse.has(h.globalBkNumber)) {
      bkFirstHouse.set(h.globalBkNumber, entry);
    }
  }
  console.log(`Houses  : ${data.houses.length}`);

  // ── Step 7: Create regular members (bulk, no password) ──────────────────────
  const memberDocs = data.members.map(m => ({
    churchId: church._id,
    unitId: unitMap.get(m.unitNumber)!,
    bavanakutayimaId: bkMap.get(`${m.unitNumber}:${m.localBkNumber}`)!,
    houseId: houseMap.get(`${m.unitNumber}:${m.localBkNumber}:${m.houseNumber}`)!,
    memberNumber: m.memberNumber,
    uniqueId: `CH001-U${pad(m.unitNumber)}-BK${pad(m.localBkNumber)}-H${pad(m.houseNumber)}-M${pad(m.memberNumber)}`,
    firstName: m.firstName,
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male' as const,
    phone: m.phone ?? undefined,
    relationToHead: m.memberNumber === 1 ? ('head' as const) : ('other' as const),
    role: 'member' as const,
    isActive: true,
  }));

  await Member.insertMany(memberDocs, { ordered: true });
  console.log(`Members : ${memberDocs.length}`);

  // ── Step 8: Track max member number per house for admin numbering ────────────
  const houseMaxMember = new Map<string, number>();
  for (const m of data.members) {
    const key = `${m.unitNumber}:${m.localBkNumber}:${m.houseNumber}`;
    const cur = houseMaxMember.get(key) ?? 0;
    if (m.memberNumber > cur) houseMaxMember.set(key, m.memberNumber);
  }
  const adminOffset = new Map<string, number>(); // tracks how many admins added per house
  const getNextMemberNo = (unitNo: number, localBkNo: number, houseNo: number) => {
    const key = `${unitNo}:${localBkNo}:${houseNo}`;
    const offset = (adminOffset.get(key) ?? 0) + 1;
    adminOffset.set(key, offset);
    return (houseMaxMember.get(key) ?? 0) + offset;
  };

  // ── Step 9: Create admin members ────────────────────────────────────────────
  const credentials: string[] = [];

  const createAdmin = async (opts: {
    role: string;
    username: string;
    password: string;
    firstName: string;
    entry: FirstHouseEntry;
  }) => {
    const { unitNumber, localBkNumber, houseNumber, unitId, bkId, houseId } = opts.entry;
    const mNo = getNextMemberNo(unitNumber, localBkNumber, houseNumber);
    const uniqueId = `CH001-U${pad(unitNumber)}-BK${pad(localBkNumber)}-H${pad(houseNumber)}-M${pad(mNo)}`;
    await Member.create({
      churchId: church._id,
      unitId,
      bavanakutayimaId: bkId,
      houseId,
      memberNumber: mNo,
      uniqueId,
      firstName: opts.firstName,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male' as const,
      relationToHead: 'other' as const,
      username: opts.username,
      password: opts.password,
      role: opts.role as any,
      isActive: true,
    });
    credentials.push(`${opts.role.padEnd(26)}| ${opts.username.padEnd(22)}| ${opts.password}`);
  };

  // super_admin at U1-BK1-H1
  const firstEntry = unitFirstHouse.get(1)!;
  await createAdmin({ role: 'super_admin', username: 'superadmin', password: 'Admin@1234', firstName: 'Super Admin', entry: firstEntry });

  // church_admin at U1-BK1-H1
  await createAdmin({ role: 'church_admin', username: 'churchadmin', password: 'Church@1234', firstName: 'Church Admin', entry: firstEntry });

  // unit_admin for each unit
  for (let uNo = 1; uNo <= 12; uNo++) {
    const entry = unitFirstHouse.get(uNo);
    if (!entry) { console.warn(`No first house for unit ${uNo}`); continue; }
    await createAdmin({ role: 'unit_admin', username: `unitadmin${uNo}`, password: 'Unit@1234', firstName: `Unit Admin ${uNo}`, entry });
  }

  // bk_admin for each global BK
  for (let gbk = 1; gbk <= 28; gbk++) {
    const entry = bkFirstHouse.get(gbk);
    if (!entry) { console.warn(`No first house for global BK ${gbk}`); continue; }
    await createAdmin({ role: 'kudumbakutayima_admin', username: `bkadmin${gbk}`, password: 'BK@1234', firstName: `BK Admin ${gbk}`, entry });
  }

  const totalAdmins = 2 + 12 + 28; // 42
  console.log(`Admins  : ${totalAdmins}`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n======= SEED COMPLETE =======');
  console.log(`Church  : St. Mary's Church, Elthuruth (CH001)`);
  console.log(`Units   : ${data.units.length}`);
  console.log(`BKs     : ${data.bks.length}`);
  console.log(`Houses  : ${data.houses.length}`);
  console.log(`Members : ${data.members.length} (xlsx) + ${totalAdmins} (admins) = ${data.members.length + totalAdmins}`);

  console.log('\n======= ADMIN CREDENTIALS =======');
  console.log('Role                      | Username               | Password');
  console.log('--------------------------|------------------------|----------');
  for (const c of credentials) console.log(c);

  console.log('\nLogin with: superadmin / Admin@1234');
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

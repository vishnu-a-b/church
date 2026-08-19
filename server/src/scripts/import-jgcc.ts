/**
 * Import Jubilee Grand Convention Centre (JGCC) members into a Monthly Support Plan.
 *
 * - Reads jgcc-data-grouped.json (402 unique persons from 517 xlsx rows)
 * - One Donor per person (keyed by jgccFirst tag in notes)
 * - Person with N slots: plan member amount = 1180 × N, due per month = 1180 × N
 * - JGCC numbers displayed as compact range/list (e.g. "JGCC 0001-JGCC 0030")
 * - Creates / finds "Jubilee Grand Convention Centre" MonthlySupportPlan (treatment='liability')
 * - Records all past payments as MonthlySupportDue + Transaction documents
 *
 * Run from Church/server/:
 *   npx ts-node --transpile-only src/scripts/import-jgcc.ts
 *
 * Safe to re-run — donors matched by JGCC_FIRST tag; dues matched by
 * (planId, dueForId, periodMonth) unique index; nothing is duplicated.
 *
 * Run cleanup-jgcc.ts first if you want a clean slate.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Church from '../models/Church';
import Member from '../models/Member';
import Donor from '../models/Donor';
import MonthlySupportPlan from '../models/MonthlySupportPlan';
import MonthlySupportDue from '../models/MonthlySupportDue';
import Transaction from '../models/Transaction';

dotenv.config();

// ─── Config ──────────────────────────────────────────────────────────────────

const PLAN_NAME = 'Jubilee Grand Convention Centre';
const MONTHLY_AMOUNT_PER_SLOT = 1180;
const PLAN_START = new Date('2026-07-01');
const DAY_OF_MONTH = 1;

// ─── Data ────────────────────────────────────────────────────────────────────

interface JgccRecord {
  jgccFirst: string;        // e.g. "JGCC 0001" — idempotency key
  jgccNos: string[];        // all JGCC numbers for this person
  jgccDisplay: string;      // e.g. "JGCC 0001-JGCC 0030" or "JGCC 0155-JGCC 0158, JGCC 0504"
  totalSlots: number;
  totalAmount: number;      // MONTHLY_AMOUNT_PER_SLOT × totalSlots
  name: string;
  phone: string;
  house: string;
  unit: string;
  payments: Array<{ month: string; amount: number }>; // already aggregated by month
}

const records: JgccRecord[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'jgcc-data-grouped.json'), 'utf-8')
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addMonths(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + n, 1);
}

function toYYYYMM(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Resolve aggregated payments into per-month due entries.
 * payments are already month-aggregated; monthlyAmount is 1180 × slots for this person.
 * Payments of N×monthlyAmount cover N consecutive months; any remainder is a partial.
 */
function resolvePayments(
  payments: JgccRecord['payments'],
  monthlyAmount: number
): Array<{ periodMonth: string; amount: number }> {
  let monthOffset = 0;
  const result: Array<{ periodMonth: string; amount: number }> = [];

  for (const pmt of payments) {
    let rem = pmt.amount;
    while (rem >= monthlyAmount) {
      result.push({ periodMonth: toYYYYMM(addMonths(PLAN_START, monthOffset)), amount: monthlyAmount });
      rem -= monthlyAmount;
      monthOffset++;
    }
    if (rem > 0) {
      result.push({ periodMonth: toYYYYMM(addMonths(PLAN_START, monthOffset)), amount: rem });
      monthOffset++;
    }
  }

  return result;
}

let receiptSeq = 0;
function nextReceipt(jgccFirst: string, periodMonth: string): string {
  receiptSeq++;
  return `JGCC-IMP-${jgccFirst.replace(/\s/g, '')}-${periodMonth}-${String(receiptSeq).padStart(4, '0')}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const main = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // 1. Find the main Elthuruth church — take the NEWEST non-test church
  const allChurches = await Church.find({ name: /elthuruth/i }).sort({ _id: -1 }).lean();
  const church = allChurches.find((c) => !/test/i.test(c.name));
  if (!church) {
    console.error('Could not find main Elthuruth church. Aborting.');
    process.exit(1);
  }
  const churchId = church._id as mongoose.Types.ObjectId;
  console.log(`Church: "${church.name}"  (_id: ${churchId})`);

  // 2. Find a church_admin to use as createdBy
  const adminMember = await Member.findOne({ churchId, role: 'church_admin' }).lean();
  const createdBy = adminMember
    ? (adminMember._id as mongoose.Types.ObjectId)
    : new mongoose.Types.ObjectId();
  console.log(
    adminMember
      ? `Using church_admin: ${adminMember.firstName} ${adminMember.lastName || ''}`
      : 'No church_admin found — using placeholder createdBy ObjectId'
  );

  // 3. Find or create the JGCC Monthly Support Plan
  let plan = await MonthlySupportPlan.findOne({ churchId, name: PLAN_NAME });
  if (!plan) {
    plan = await MonthlySupportPlan.create({
      churchId,
      name: PLAN_NAME,
      description: 'Jubilee Grand Convention Centre — monthly hall booking deposits',
      defaultAmount: MONTHLY_AMOUNT_PER_SLOT,
      treatment: 'liability',
      dayOfMonth: DAY_OF_MONTH,
      startDate: PLAN_START,
      isActive: true,
      members: [],
      createdBy,
    });
    console.log(`Created plan: "${PLAN_NAME}"  (_id: ${plan._id})`);
  } else {
    // Ensure dayOfMonth and startDate are correct even for a pre-existing plan
    let updated = false;
    if (plan.dayOfMonth !== DAY_OF_MONTH) {
      plan.dayOfMonth = DAY_OF_MONTH;
      updated = true;
    }
    if (plan.startDate?.toISOString() !== PLAN_START.toISOString()) {
      plan.startDate = PLAN_START;
      updated = true;
    }
    if (updated) await plan.save();
    console.log(`Using existing plan: "${PLAN_NAME}"  (_id: ${plan._id})${updated ? ' (corrected dayOfMonth/startDate)' : ''}`);
  }

  let createdDonors = 0;
  let skippedDonors = 0;
  let addedToPlan = 0;
  let createdDues = 0;
  let skippedDues = 0;
  let createdTxns = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    // 4. Find or create Donor (keyed by JGCC_FIRST tag in notes)
    const firstTag = `JGCC_FIRST:${rec.jgccFirst}`;
    const tagRegex = new RegExp(firstTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    let donor = await Donor.findOne({ churchId, notes: tagRegex });

    if (!donor) {
      donor = await Donor.create({
        churchId,
        name: rec.name,
        phone: rec.phone,
        address: rec.house,
        notes: `${firstTag} | JGCC_NOS:${rec.jgccDisplay} | Unit: ${rec.unit}`,
        isActive: true,
      });
      createdDonors++;
    } else {
      skippedDonors++;
    }

    // 5. Ensure donor is in plan.members with correct per-person amount
    const alreadyInPlan = plan.members.some(
      (m) => m.donorId && String(m.donorId) === String(donor!._id)
    );
    if (!alreadyInPlan) {
      plan.members.push({
        donorId: donor._id as mongoose.Types.ObjectId,
        amount: rec.totalAmount,
      });
      addedToPlan++;
    }

    // 6. Record payments
    if (rec.payments.length > 0) {
      const toRecord = resolvePayments(rec.payments, rec.totalAmount);

      for (const { periodMonth, amount } of toRecord) {
        const dueDate = new Date(
          parseInt(periodMonth.split('-')[0]),
          parseInt(periodMonth.split('-')[1]) - 1,
          DAY_OF_MONTH
        );

        // Find or create due
        let due = await MonthlySupportDue.findOne({
          planId: plan._id,
          dueForId: donor._id,
          periodMonth,
        });

        if (!due) {
          due = await MonthlySupportDue.create({
            churchId,
            planId: plan._id,
            planName: PLAN_NAME,
            periodMonth,
            dueForId: donor._id,
            dueForModel: 'Donor',
            dueForName: `${rec.name} (${rec.jgccDisplay})`,
            amount: rec.totalAmount,
            isPaid: false,
            paidAmount: 0,
            balance: rec.totalAmount,
            dueDate,
          });
          createdDues++;
        }

        if (due.isPaid) {
          skippedDues++;
          continue;
        }

        // Create transaction for this payment
        const receiptNumber = nextReceipt(rec.jgccFirst, periodMonth);
        const txn = await Transaction.create({
          receiptNumber,
          churchId,
          transactionType: 'monthly_support',
          totalAmount: amount,
          memberAmount: 0,
          houseAmount: 0,
          donorId: donor._id,
          monthlySupportPlanId: plan._id,
          paymentMethod: 'cash',
          paymentDate: dueDate,
          notes: `JGCC import — ${rec.name} (${rec.jgccDisplay}) ${periodMonth}`,
          createdBy,
        });
        createdTxns++;

        // Mark due as paid
        due.paidAmount += amount;
        due.balance = Math.max(0, due.amount - due.paidAmount);
        due.isPaid = due.balance === 0;
        if (due.isPaid) due.paidAt = dueDate;
        due.transactionId = txn._id as mongoose.Types.ObjectId;
        await due.save();
      }
    }

    if ((i + 1) % 50 === 0) {
      await plan.save();
      console.log(`  Processed ${i + 1}/${records.length}...`);
    }
  }

  // 7. Final save of plan
  await plan.save();

  console.log('\n✅ Import complete');
  console.log(`   Persons (donors) created:    ${createdDonors}`);
  console.log(`   Donors already existed:      ${skippedDonors}`);
  console.log(`   Members added to plan:        ${addedToPlan}`);
  console.log(`   Dues created:                 ${createdDues}`);
  console.log(`   Dues already paid (skipped):  ${skippedDues}`);
  console.log(`   Transactions created:         ${createdTxns}`);
  console.log(`   Plan members total:           ${plan.members.length}`);

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});

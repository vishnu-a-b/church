import Member from '../models/Member';
import House from '../models/House';
import Church from '../models/Church';
import SpiritualActivity from '../models/SpiritualActivity';
import { sendTransactionNotification, TransactionDetails } from './emailService';
import { sendReceiptViaWhatsApp } from './whatsappService';

async function resolveReceiptContext(transaction: any): Promise<{ churchName?: string; houseName?: string }> {
  const [church, house] = await Promise.all([
    transaction.churchId ? Church.findById(transaction.churchId).select('name').lean() : Promise.resolve(null),
    transaction.houseId ? House.findById(transaction.houseId).select('familyName').lean() : Promise.resolve(null),
  ]);
  return {
    churchName: (church as any)?.name,
    houseName: (house as any)?.familyName,
  };
}

/**
 * Stothrakazhcha-specific notifier — includes the member's spiritual activities in the email.
 * Fire-and-forget, never throws.
 */
export const notifyStothrakazhchaApproval = (
  transaction: any,
  weekNumber: number,
  year: number,
  weekStartDate?: Date,
  weekEndDate?: Date,
): void => {
  if (!transaction.memberId) return;

  Promise.all([
    Member.findById(transaction.memberId)
      .select('firstName lastName uniqueId email isEmailVerified emailNotificationsEnabled')
      .lean(),
    resolveReceiptContext(transaction),
  ]).then(async ([m, ctx]) => {
    if (!m) return;
    const weekStr = `${year}-W${String(weekNumber).padStart(2, '0')}`;
    const activityQuery: any = weekStartDate && weekEndDate
      ? {
          memberId: transaction.memberId,
          approvalStatus: { $ne: 'rejected' },
          $or: [
            { activityType: 'mass', massDate: { $gte: weekStartDate, $lte: weekEndDate } },
            { activityType: 'prayer', prayerWeek: weekStr },
            { activityType: 'fasting', fastingWeek: weekStr },
          ],
        }
      : { memberId: transaction.memberId, approvalStatus: { $ne: 'rejected' } };
    const activities = await SpiritualActivity.find(activityQuery)
      .select('activityType approvalStatus massDate fastingWeek fastingDays prayerType prayerCount prayerWeek')
      .sort({ massDate: -1, createdAt: -1 })
      .lean();

    const txDetails: TransactionDetails = {
      receiptNumber: transaction.receiptNumber,
      transactionType: transaction.transactionType,
      amount: transaction.totalAmount,
      paymentMethod: transaction.paymentMethod,
      paymentDate: transaction.paymentDate,
      campaignName: `Stothrakazhcha — Week ${weekNumber}, ${year}`,
      spiritualActivities: activities as any,
      churchName: ctx.churchName,
      houseName: ctx.houseName,
      memberCode: (m as any).uniqueId,
    };
    sendTransactionNotification(m, txDetails).catch(() => {});
  }).catch(() => {});
};

/**
 * Fire-and-forget email receipt for any financial transaction.
 * - If the transaction has a memberId: notifies that member directly.
 * - If the transaction has a houseId only: notifies all members of that house
 *   who have an email address.
 * Never throws — all errors are swallowed so callers are never blocked.
 */
export const notifyTransactionMember = (transaction: any, description?: string): void => {
  Promise.all([
    resolveReceiptContext(transaction),
    transaction.memberId
      ? Member.findById(transaction.memberId)
          .select('firstName lastName uniqueId email isEmailVerified emailNotificationsEnabled phone')
          .lean()
      : Promise.resolve(null),
  ]).then(([ctx, m]) => {
    const baseTxDetails: TransactionDetails = {
      receiptNumber: transaction.receiptNumber,
      transactionType: transaction.transactionType,
      amount: transaction.totalAmount,
      paymentMethod: transaction.paymentMethod,
      paymentDate: transaction.paymentDate,
      campaignName: description,
      notes: transaction.notes || undefined,
      churchName: ctx.churchName,
      houseName: ctx.houseName,
    };

    const receiptData = {
      receiptNumber: transaction.receiptNumber,
      date: transaction.paymentDate ?? new Date(),
      items: [{ description: description ?? transaction.transactionType, amount: transaction.totalAmount }],
      totalAmount: transaction.totalAmount,
    };

    if (m) {
      const fullName = `${(m as any).firstName ?? ''} ${(m as any).lastName ?? ''}`.trim();
      sendTransactionNotification(m, { ...baseTxDetails, memberCode: (m as any).uniqueId }).catch(() => {});
      sendReceiptViaWhatsApp((m as any).phone, receiptData, fullName, description ?? transaction.transactionType);
    } else if (transaction.houseId) {
      Member.find({ houseId: transaction.houseId })
        .select('firstName lastName uniqueId email isEmailVerified emailNotificationsEnabled phone')
        .lean()
        .then((members) => {
          for (const hm of members) {
            const fullName = `${(hm as any).firstName ?? ''} ${(hm as any).lastName ?? ''}`.trim();
            sendTransactionNotification(hm, { ...baseTxDetails, memberCode: (hm as any).uniqueId }).catch(() => {});
            sendReceiptViaWhatsApp((hm as any).phone, receiptData, fullName, description ?? transaction.transactionType);
          }
        })
        .catch(() => {});
    }
  }).catch(() => {});
};

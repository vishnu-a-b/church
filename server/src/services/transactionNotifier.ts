import Member from '../models/Member';
import SpiritualActivity from '../models/SpiritualActivity';
import { sendTransactionNotification, TransactionDetails } from './emailService';

/**
 * Fire-and-forget email notification for any financial transaction.
 * - If the transaction has a memberId: notifies that member directly.
 * - If the transaction has a houseId only: notifies all members of that house
 *   who have an email address.
 * Never throws — all errors are swallowed so callers are never blocked.
 */
/**
 * Stothrakazhcha-specific notifier — includes the member's spiritual activities in the email.
 * Fire-and-forget, never throws.
 */
export const notifyStothrakazhchaApproval = (transaction: any, weekNumber: number, year: number): void => {
  if (!transaction.memberId) return;

  Member.findById(transaction.memberId)
    .select('firstName email isEmailVerified emailNotificationsEnabled')
    .lean()
    .then(async (m) => {
      if (!m) return;
      const activities = await SpiritualActivity.find({
        memberId: transaction.memberId,
        approvalStatus: { $ne: 'rejected' },
      })
        .select('activityType approvalStatus massDate fastingWeek fastingDays prayerType prayerCount prayerWeek')
        .sort({ createdAt: -1 })
        .lean();

      const txDetails: TransactionDetails = {
        receiptNumber: transaction.receiptNumber,
        transactionType: transaction.transactionType,
        amount: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod,
        paymentDate: transaction.paymentDate,
        campaignName: `Stothrakazhcha — Week ${weekNumber}, ${year}`,
        spiritualActivities: activities as any,
      };
      sendTransactionNotification(m, txDetails).catch(() => {});
    })
    .catch(() => {});
};

export const notifyTransactionMember = (transaction: any, description?: string): void => {
  const txDetails: TransactionDetails = {
    receiptNumber: transaction.receiptNumber,
    transactionType: transaction.transactionType,
    amount: transaction.totalAmount,
    paymentMethod: transaction.paymentMethod,
    paymentDate: transaction.paymentDate,
    campaignName: description,
  };

  if (transaction.memberId) {
    Member.findById(transaction.memberId)
      .select('firstName email isEmailVerified emailNotificationsEnabled')
      .lean()
      .then((m) => { if (m) sendTransactionNotification(m, txDetails).catch(() => {}); })
      .catch(() => {});
  } else if (transaction.houseId) {
    Member.find({ houseId: transaction.houseId })
      .select('firstName email isEmailVerified emailNotificationsEnabled')
      .lean()
      .then((members) => {
        for (const m of members) {
          sendTransactionNotification(m, txDetails).catch(() => {});
        }
      })
      .catch(() => {});
  }
};

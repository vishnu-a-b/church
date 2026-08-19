import Member from '../models/Member';
import { sendTransactionNotification, TransactionDetails } from './emailService';

/**
 * Fire-and-forget email notification for any financial transaction.
 * - If the transaction has a memberId: notifies that member directly.
 * - If the transaction has a houseId only: notifies all members of that house
 *   who have an email address.
 * Never throws — all errors are swallowed so callers are never blocked.
 */
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

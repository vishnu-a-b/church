import axios from 'axios';
import edvBridgeConfig from '../config/edvBridge';
import Church from '../models/Church';
import Member from '../models/Member';
import House from '../models/House';
import Donor from '../models/Donor';
import Transaction from '../models/Transaction';
import MonthlySupportPlan from '../models/MonthlySupportPlan';
import { ITransaction } from '../types';

// Pushes a Church transaction into the EDV accounting system as a posted voucher.
// Never blocks the caller's response — callers invoke this fire-and-forget after
// the transaction is already saved, and always chain .catch() around it.
export async function pushTransactionToEdv(transaction: ITransaction): Promise<void> {
  const church = await Church.findById(transaction.churchId).select('+settings.edvApiKey');
  const apiKey = church?.settings?.edvApiKey;
  if (!apiKey) {
    // Bridge not provisioned for this church — silently a no-op.
    return;
  }

  let memberName: string | undefined;
  if (transaction.memberId) {
    const member = await Member.findById(transaction.memberId).select('firstName lastName');
    if (member) memberName = `${member.firstName} ${member.lastName || ''}`.trim();
  }

  let houseName: string | undefined;
  if (transaction.houseId) {
    const house = await House.findById(transaction.houseId).select('familyName');
    if (house) houseName = house.familyName;
  }

  if (transaction.donorId) {
    const donor = await Donor.findById(transaction.donorId).select('name');
    if (donor) memberName = donor.name;
  }

  // 'liability' pushes get their own personal ledger in EDV per payer (e.g. a
  // refundable hall-booking deposit) instead of the shared income ledger —
  // only monthly-support transactions carry a plan to look this up from.
  let ledgerTreatment: 'income' | 'liability' = 'income';
  if (transaction.monthlySupportPlanId) {
    const plan = await MonthlySupportPlan.findById(transaction.monthlySupportPlanId).select('treatment');
    if (plan?.treatment === 'liability') ledgerTreatment = 'liability';
  }

  const payload = {
    churchId: String(transaction.churchId),
    transactionId: String(transaction._id),
    receiptNumber: transaction.receiptNumber,
    transactionType: transaction.transactionType,
    totalAmount: transaction.totalAmount,
    paymentMethod: transaction.paymentMethod,
    paymentDate: new Date(transaction.paymentDate).toISOString(),
    memberName,
    houseName,
    memberId: transaction.memberId ? String(transaction.memberId) : undefined,
    donorId: transaction.donorId ? String(transaction.donorId) : undefined,
    notes: transaction.notes,
    ledgerTreatment,
  };

  try {
    const response = await axios.post(
      `${edvBridgeConfig.apiUrl}/api/v1/church-bridge/transactions`,
      payload,
      { headers: { 'x-church-bridge-key': apiKey }, timeout: 8000 },
    );

    await Transaction.findByIdAndUpdate(transaction._id, {
      $set: {
        edvSynced: true,
        edvVoucherId: response.data?.data?.voucherId,
        edvSyncedAt: new Date(),
      },
      $unset: { edvSyncError: 1 },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await Transaction.findByIdAndUpdate(transaction._id, {
      edvSynced: false,
      edvSyncError: message,
    }).catch((saveErr) => console.error('Failed to record EDV sync error:', saveErr));
    throw err;
  }
}

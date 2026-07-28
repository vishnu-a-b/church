import cron from 'node-cron';
import Transaction from '../models/Transaction';
import edvBridgeConfig from '../config/edvBridge';
import { pushTransactionToEdv } from '../services/edvBridgeService';

/**
 * Retries EDV bridge pushes for transactions whose initial fire-and-forget
 * push failed (or never fired because the app restarted mid-flight).
 */
const retryFailedPushes = async () => {
  if (!edvBridgeConfig.enabled) return;

  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000); // avoid racing the initial attempt
    const pending = await Transaction.find({
      edvSynced: false,
      createdAt: { $lte: cutoff },
    }).limit(50);

    if (pending.length === 0) return;

    console.log(`🕐 [CRON] Retrying EDV bridge push for ${pending.length} transaction(s)...`);

    for (const transaction of pending) {
      try {
        await pushTransactionToEdv(transaction);
      } catch (err) {
        console.error(`EDV bridge retry failed for transaction ${transaction._id}:`, err);
      }
    }
  } catch (error) {
    console.error('❌ [CRON] EDV bridge retry processor error:', error);
  }
};

export const scheduleEdvBridgeRetryProcessing = () => {
  // Every 10 minutes
  cron.schedule('*/10 * * * *', retryFailedPushes);
  console.log('📅 EDV bridge retry job scheduled (every 10 minutes)');
};

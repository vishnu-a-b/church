import { SMSConfig } from '../types';

// Read lazily via getters, not captured once at module scope — see
// edvBridge.ts for why a plain object literal here would permanently freeze
// in undefined/empty values regardless of what's in .env.
const smsConfig: SMSConfig = {
  get enabled(): boolean {
    return process.env.SMS_ENABLED === 'true';
  },
  get provider(): string {
    return process.env.SMS_PROVIDER || 'fast2sms';
  },
  get fast2sms() {
    return {
      apiKey: process.env.FAST2SMS_API_KEY || '',
      senderId: process.env.SMS_SENDER_ID || 'CHURCH',
      baseUrl: 'https://www.fast2sms.com/dev/bulkV2',
    };
  },
};

export default smsConfig;

import { SMSConfig } from '../types';

const smsConfig: SMSConfig = {
  enabled: process.env.SMS_ENABLED === 'true',
  provider: process.env.SMS_PROVIDER || 'fast2sms',
  fast2sms: {
    apiKey: process.env.FAST2SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'CHURCH',
    baseUrl: 'https://www.fast2sms.com/dev/bulkV2',
  },
};

export default smsConfig;

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { sendReceiptViaWhatsApp } from '../services/whatsappService';

const receiptData = {
  receiptNumber: 'RCP-2026-TEST-001',
  date: new Date('2026-10-01'),
  recipientName: 'Thomas Varghese',
  notes: 'Payment for October 2026',
  items: [
    { description: 'Monthly Support Contribution', amount: 1500 },
  ],
  totalAmount: 1500,
};

console.log('Sending WhatsApp receipt to 8848196653...');
sendReceiptViaWhatsApp('8848196653', receiptData, 'Thomas Varghese', 'Monthly Support Contribution');

// Wait for fire-and-forget to complete
setTimeout(() => process.exit(0), 15000);

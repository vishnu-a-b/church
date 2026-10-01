import fs from 'fs';
import path from 'path';
import { generateReceiptPdf } from '../services/receiptPdfService';

async function main() {
  const pdf = await generateReceiptPdf({
    receiptNumber: 'RCP-2026-00123',
    date: new Date('2026-10-01'),
    recipientName: 'Thomas Varghese',
    notes: 'Payment for October 2026',
    items: [
      { description: 'Monthly Support Contribution', amount: 1500 },
    ],
    totalAmount: 1500,
  });

  const out = path.join('/tmp', 'sample-receipt.pdf');
  fs.writeFileSync(out, pdf);
  console.log('Sample receipt written to', out);
}

main().catch(console.error);

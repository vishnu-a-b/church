import axios from 'axios';
import { generateReceiptPdf, ReceiptData } from './receiptPdfService';

const OMNI_BASE = 'https://wb.omni.tatatelebusiness.com/whatsapp-cloud';

function getConfig(): { apiKey: string } | null {
  const apiKey = process.env.OMNI_WA_API_KEY;
  if (!apiKey) return null;
  return { apiKey };
}

async function uploadPdfMedia(pdfBuffer: Buffer, filename: string, apiKey: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FormData = require('form-data') as typeof import('form-data');
  const form = new FormData();
  form.append('file', pdfBuffer, { filename, contentType: 'application/pdf' });
  form.append('messaging_product', 'whatsapp');

  const res = await axios.post<{ id: string }>(`${OMNI_BASE}/media`, form, {
    headers: { ...form.getHeaders(), apikey: apiKey },
  });

  const mediaId = res.data?.id;
  if (!mediaId) throw new Error('No media ID returned from WhatsApp upload');
  return mediaId;
}

/**
 * Generate a PDF receipt and send it via WhatsApp using the elthuruth_ereceipt template.
 * Fire-and-forget — never throws; errors are logged silently.
 *
 * Template body parameters (in order):
 *   {{1}} recipient first name
 *   {{2}} receipt number
 *   {{3}} amount (e.g. "Rs. 500")
 *   {{4}} description / campaign name
 */
export const sendReceiptViaWhatsApp = (
  phone: string | undefined,
  receiptData: ReceiptData,
  recipientName: string,
  description: string,
): void => {
  const cfg = getConfig();
  if (!cfg) return; // WhatsApp not configured
  if (!phone) return;

  const filename = `Receipt-${receiptData.receiptNumber}.pdf`;
  const wa = `91${phone}`;

  generateReceiptPdf(receiptData)
    .then((pdfBuffer) => uploadPdfMedia(pdfBuffer, filename, cfg.apiKey))
    .then((mediaId) => {
      const firstName = recipientName.trim().split(' ')[0];
      const amountStr = `Rs. ${receiptData.totalAmount.toLocaleString('en-IN')}`;

      return axios.post(
        `${OMNI_BASE}/messages`,
        {
          messaging_product: 'whatsapp',
          to: wa,
          type: 'template',
          template: {
            name: 'elthuruth_ereceipt',
            language: { code: 'en' },
            components: [
              {
                type: 'header',
                parameters: [
                  {
                    type: 'document',
                    document: { id: mediaId, filename },
                  },
                ],
              },
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: firstName },
                  { type: 'text', text: receiptData.receiptNumber },
                  { type: 'text', text: amountStr },
                  { type: 'text', text: description },
                ],
              },
            ],
          },
        },
        {
          headers: { apikey: cfg.apiKey, 'Content-Type': 'application/json' },
        },
      );
    })
    .then(() => {
      console.log(`WhatsApp receipt sent to ${wa} (${filename})`);
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`WhatsApp receipt failed for ${wa}: ${msg}`);
    });
};

import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const LOGO_PATH = path.join(__dirname, '../assets/church-logo.jpg');

const NAVY       = '#1e3a5f';
const GRAY       = '#666666';
const LIGHT_GRAY = '#cccccc';
const HDR_BG     = '#f0f4f8';

function amountInWords(amount: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function lessThan100(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }
  function lessThan1000(n: number): string {
    if (n < 100) return lessThan100(n);
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + lessThan100(n % 100) : '');
  }

  const intPart = Math.floor(amount);
  const decPart = Math.round((amount - intPart) * 100);
  if (intPart === 0 && decPart === 0) return 'Zero Only';

  const parts: string[] = [];
  let n = intPart;
  if (n >= 10000000) { parts.push(lessThan1000(Math.floor(n / 10000000)) + ' Crore'); n %= 10000000; }
  if (n >= 100000)   { parts.push(lessThan100(Math.floor(n / 100000)) + ' Lakh'); n %= 100000; }
  if (n >= 1000)     { parts.push(lessThan1000(Math.floor(n / 1000)) + ' Thousand'); n %= 1000; }
  if (n > 0)         { parts.push(lessThan1000(n)); }

  let result = parts.join(' ');
  if (decPart > 0) result += ' and ' + lessThan100(decPart) + ' Paise';
  return result + ' Only';
}

export interface ReceiptData {
  receiptNumber: string;
  date: Date;
  items: Array<{ description: string; amount: number }>;
  totalAmount: number;
  recipientName?: string;
  notes?: string;
}

export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const M        = 28;
    const PW       = 419;
    const PH       = 595;   // Fixed A5 height
    const CW       = PW - M * 2;

    const logoSize = 70;    // enlarged logo
    const headerH  = 86;    // logo(70) + top-pad(9) + bottom-pad(7)
    const hdrH     = 26;    // table header row height
    const bodyRows = Math.max(data.items.length, 4);

    // tableH fills whatever A5 space remains after all fixed sections:
    // M + headerH + div(9) + noDate(20) + recipient(30) + label(20) + div(9)
    // + gapAfterTable(10) + words(30) + sig(20) + sigGap(8) + footer(20) + M
    const overhead = M + headerH + 9 + 20 + 30 + 20 + 9 + 10 + 30 + 20 + 8 + 20 + M; // 318
    const tableH   = PH - overhead;  // 277

    const totalBodyH = tableH - 2 * hdrH;
    let rowH: number;
    let firstRowH: number;
    if (data.notes) {
      rowH      = (totalBodyH - 16) / bodyRows;
      firstRowH = rowH + 16;
    } else {
      rowH      = totalBodyH / bodyRows;
      firstRowH = rowH;
    }

    const doc = new PDFDocument({ size: [PW, PH], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Outer border ──────────────────────────────────────────────────
    doc.rect(M - 8, M - 8, CW + 16, PH - M * 2 + 16).lineWidth(1).stroke(NAVY);

    let y = M;

    // ── Header: logo + church info ────────────────────────────────────
    const logoX  = M;
    const logoCX = logoX + logoSize / 2;
    const logoCY = y + logoSize / 2 + 8;

    if (fs.existsSync(LOGO_PATH)) {
      doc.save();
      doc.circle(logoCX, logoCY, logoSize / 2).clip();
      // Scale by height to fill circle fully (image is 499×314, landscape)
      const imgH = logoSize;
      const imgW = Math.round(imgH * (499 / 314));
      doc.image(LOGO_PATH, logoCX - imgW / 2, logoCY - imgH / 2, { width: imgW, height: imgH });
      doc.restore();
      doc.circle(logoCX, logoCY, logoSize / 2).lineWidth(1.5).stroke(NAVY);
    }

    const textX = M + logoSize + 14;
    const textW = CW - logoSize - 14;
    doc.font('Helvetica-Bold').fontSize(17).fillColor(NAVY)
       .text("St. Mary's Church, Elthuruth", textX, y + 20, { width: textW });
    doc.font('Helvetica').fontSize(9.5).fillColor(NAVY)
       .text('Pin: 680611  \u2022  PH: 0487 2369929  \u2022  smcelth@gmail.com',
             textX, y + 50, { width: textW });

    y += headerH;  // y = 114

    // ── Horizontal divider ────────────────────────────────────────────
    doc.moveTo(M - 8, y).lineTo(M + CW + 8, y).lineWidth(1).stroke(NAVY);
    y += 1 + 8;    // y = 123

    // ── No / Date ─────────────────────────────────────────────────────
    const dateStr = data.date.toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    doc.font('Helvetica').fontSize(10).fillColor(NAVY)
       .text(`No:  ${data.receiptNumber}`, M, y);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
       .text(`Date:  ${dateStr}`, M, y, { width: CW, align: 'right' });
    y += 20;       // y = 143

    // ── Received From ─────────────────────────────────────────────────
    doc.font('Helvetica').fontSize(10).fillColor(GRAY)
       .text('Received From:', M, y);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
       .text(data.recipientName || '—', M + 96, y, { width: CW - 96 });
    y += 20 + 10;  // y = 173

    // ── RECEIPT label ─────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY)
       .text('RECEIPT', M, y, { width: CW, align: 'center' });
    y += 20;       // y = 193
    doc.moveTo(M - 8, y).lineTo(M + CW + 8, y).lineWidth(0.6).stroke(LIGHT_GRAY);
    y += 1 + 8;    // y = 202

    // ── Items Table ───────────────────────────────────────────────────
    const colItemW = Math.floor(CW * 0.67);
    const colAmtW  = CW - colItemW;
    const tableY   = y;

    // Table outer border
    doc.rect(M, tableY, CW, tableH).lineWidth(0.8).stroke(NAVY);

    // Header fill
    doc.rect(M, tableY, CW, hdrH).fill(NAVY);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#ffffff')
       .text('Items', M + 8, tableY + 8, { width: colItemW - 12 });
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#ffffff')
       .text('Amount', M + colItemW + 4, tableY + 8, { width: colAmtW - 8, align: 'right' });

    // Column divider
    doc.moveTo(M + colItemW, tableY + hdrH)
       .lineTo(M + colItemW, tableY + tableH)
       .lineWidth(0.5).stroke(LIGHT_GRAY);

    // Body rows — text vertically centered in each row
    for (let i = 0; i < bodyRows; i++) {
      const rowY      = tableY + hdrH + (i === 0 ? 0 : firstRowH + (i - 1) * rowH);
      const currRowH  = i === 0 ? firstRowH : rowH;
      const textY     = rowY + Math.round(currRowH / 2) - 6;
      doc.moveTo(M, rowY).lineTo(M + CW, rowY).lineWidth(0.4).stroke(LIGHT_GRAY);
      const item = data.items[i];
      if (item) {
        doc.font('Helvetica').fontSize(10).fillColor(NAVY)
           .text(item.description, M + 8, textY, { width: colItemW - 16 });
        // notes on the first item row only
        if (i === 0 && data.notes) {
          doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(GRAY)
             .text(data.notes, M + 8, textY + 13, { width: colItemW - 16 });
        }
        doc.font('Helvetica').fontSize(10).fillColor(NAVY)
           .text(`Rs. ${item.amount.toLocaleString('en-IN')}`, M + colItemW + 4, textY, {
             width: colAmtW - 8, align: 'right',
           });
      }
    }

    // Total row
    const totalRowY    = tableY + hdrH + firstRowH + (bodyRows - 1) * rowH;
    const totalCenterY = totalRowY + Math.round(hdrH / 2) - 6;
    doc.moveTo(M, totalRowY).lineTo(M + CW, totalRowY).lineWidth(1).stroke(NAVY);
    doc.rect(M, totalRowY, CW, hdrH).fill(HDR_BG);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY)
       .text('Total Amount', M + 8, totalCenterY, { width: colItemW - 16, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY)
       .text(`Rs. ${data.totalAmount.toLocaleString('en-IN')}`, M + colItemW + 4, totalCenterY, {
         width: colAmtW - 8, align: 'right',
       });

    y = tableY + tableH + 10;  // y = 489

    // ── Amount in Words ───────────────────────────────────────────────
    const words = amountInWords(data.totalAmount);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text('Amount in Words:  ', M, y, { continued: true });
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(NAVY).text(words, { width: CW - 4 });
    y += 30;       // y = 519

    // ── Authorized Signatory ──────────────────────────────────────────
    doc.moveTo(M + CW - 130, y).lineTo(M + CW, y).lineWidth(0.6).stroke(LIGHT_GRAY);
    doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
       .text('Authorized Signatory', M + CW - 130, y + 4, { width: 130, align: 'center' });
    y += 20 + 8;   // y = 547

    // ── Footer ────────────────────────────────────────────────────────
    doc.moveTo(M - 8, y).lineTo(M + CW + 8, y).lineWidth(0.5).stroke(LIGHT_GRAY);
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(GRAY)
       .text(
         'This is an electronically generated receipt and does not require further validation.',
         M, y + 4, { width: CW, align: 'center' },
       );

    doc.end();
  });
}

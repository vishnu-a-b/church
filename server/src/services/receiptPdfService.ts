import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const LOGO_PATH = path.join(__dirname, '../assets/church-logo.jpg');

// Color palette
const NAVY      = '#1e3a5f';
const NAVY_MID  = '#2d4f78';
const GRAY      = '#666666';
const LIGHT_GRAY = '#c8c8c8';
const HDR_BG    = '#eef2f7';   // very light blue for header area
const ROW_BG    = '#f7f9fc';   // alternate row tint

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
}

export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 0 });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PW = doc.page.width;   // ~419
    const PH = doc.page.height;  // ~595
    const M  = 24;               // outer margin
    const CW = PW - M * 2;      // content width ~371

    // ── Outer card ──────────────────────────────────────────────────
    // Shadow layer (offset, light gray)
    doc.roundedRect(M + 2, M + 2, CW, PH - M * 2, 10).fill('#d8dde6');
    // White card
    doc.roundedRect(M, M, CW, PH - M * 2, 10).fill('#ffffff');
    // Thin navy border
    doc.roundedRect(M, M, CW, PH - M * 2, 10).lineWidth(0.8).stroke(NAVY);

    // ── Top accent bar (clipped to card shape) ───────────────────────
    doc.save();
    doc.roundedRect(M, M, CW, PH - M * 2, 10).clip();
    doc.rect(M, M, CW, 52).fill(NAVY);
    // thin gold line at bottom of bar
    doc.rect(M, M + 52, CW, 2).fill('#c8a84b');
    doc.restore();

    // ── HEADER (overlaid on accent bar) ──────────────────────────────
    const logoSize = 56;
    const logoX = M + 14;
    const logoY = M + (52 - logoSize) / 2;   // vertically centred in bar

    if (fs.existsSync(LOGO_PATH)) {
      // White ring behind logo
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 3).fill('#ffffff');
      // Circular-clipped photo
      doc.save();
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip();
      doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize });
      doc.restore();
    }

    // Church name & contact (white text on dark bar)
    const nameX = logoX + logoSize + 12;
    const nameW = CW - logoSize - 28;
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
       .text("St. Mary's Church, Elthuruth", nameX, M + 9, { width: nameW });
    doc.font('Helvetica').fontSize(7.5).fillColor('#c8dcf5')
       .text('Pin: 680611  \u2022  PH: 0487 2369929  \u2022  smcelth@gmail.com',
             nameX, M + 30, { width: nameW });

    // ── No / DATE row ────────────────────────────────────────────────
    const infoY = M + 54 + 10;
    const dateStr = data.date.toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    // Light background for this row
    doc.rect(M, infoY - 4, CW, 22).fill(HDR_BG);
    doc.font('Helvetica').fontSize(10).fillColor(NAVY)
       .text(`No:  ${data.receiptNumber}`, M + 12, infoY + 2);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
       .text(`Date:  ${dateStr}`, M, infoY + 2, { width: CW - 12, align: 'right' });

    // ── RECEIPT badge ────────────────────────────────────────────────
    const badgeW = 130;
    const badgeH = 26;
    const badgeX = (PW - badgeW) / 2;
    const badgeY = infoY + 28;
    // Outer glow / shadow
    doc.roundedRect(badgeX + 1.5, badgeY + 1.5, badgeW, badgeH, 6).fill(NAVY_MID);
    // Badge fill
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6).fill(NAVY);
    // Badge text
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff')
       .text('R E C E I P T', badgeX, badgeY + 6, { width: badgeW, align: 'center' });

    // ── Dashed separator ─────────────────────────────────────────────
    const dashY = badgeY + badgeH + 10;
    doc.save();
    doc.dash(4, { space: 4 });
    doc.moveTo(M + 10, dashY).lineTo(M + CW - 10, dashY).lineWidth(0.8).stroke(LIGHT_GRAY);
    doc.undash();
    doc.restore();

    // ── Items Table ──────────────────────────────────────────────────
    const tableY  = dashY + 10;
    const colItemW = Math.floor(CW * 0.67);
    const colAmtW  = CW - colItemW;
    const rowH     = 22;
    const bodyRows = Math.max(data.items.length, 5);
    const tableH   = (1 + bodyRows + 1) * rowH;   // header + body + total

    // Table shadow
    doc.roundedRect(M + 1.5, tableY + 1.5, CW, tableH, 5).fill('#d8dde6');
    // Table outer border
    doc.roundedRect(M, tableY, CW, tableH, 5).lineWidth(0.8).stroke(NAVY).fill('#ffffff');

    // Header fill
    doc.save();
    doc.roundedRect(M, tableY, CW, rowH, 5).clip();
    doc.rect(M, tableY, CW, rowH).fill(NAVY);
    doc.restore();

    // Header text
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#ffffff')
       .text('Items', M + 10, tableY + 6, { width: colItemW - 14 });
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#ffffff')
       .text('Amount', M + colItemW + 4, tableY + 6, { width: colAmtW - 10, align: 'right' });

    // Vertical column divider
    doc.moveTo(M + colItemW, tableY + rowH).lineTo(M + colItemW, tableY + tableH)
       .lineWidth(0.8).stroke(LIGHT_GRAY);

    // Item rows
    data.items.forEach((item, i) => {
      const rowY = tableY + rowH * (i + 1);
      // Alternate row tint
      if (i % 2 === 0) doc.rect(M, rowY, CW, rowH).fill(ROW_BG);
      doc.moveTo(M, rowY).lineTo(M + CW, rowY).lineWidth(0.5).stroke(LIGHT_GRAY);
      doc.font('Helvetica').fontSize(10).fillColor(NAVY)
         .text(item.description, M + 10, rowY + 6, { width: colItemW - 18 });
      doc.font('Helvetica').fontSize(10).fillColor(NAVY)
         .text(`Rs. ${item.amount.toLocaleString('en-IN')}`, M + colItemW + 4, rowY + 6, {
           width: colAmtW - 10, align: 'right',
         });
    });

    // Total row background
    const totalRowY = tableY + rowH * (bodyRows + 1);
    doc.rect(M, totalRowY, CW, rowH).fill(HDR_BG);
    doc.moveTo(M, totalRowY).lineTo(M + CW, totalRowY).lineWidth(1).stroke(NAVY);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY)
       .text('Total Amount', M + 10, totalRowY + 6, { width: colItemW - 18, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY)
       .text(`Rs. ${data.totalAmount.toLocaleString('en-IN')}`, M + colItemW + 4, totalRowY + 6, {
         width: colAmtW - 10, align: 'right',
       });

    // ── Amount in Words ──────────────────────────────────────────────
    const wordsY = tableY + tableH + 14;
    const words  = amountInWords(data.totalAmount);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY)
       .text('Amount in Words:', M + 12, wordsY);
    doc.save();
    doc.dash(2, { space: 3 });
    doc.moveTo(M + 12, wordsY + 16).lineTo(M + CW - 12, wordsY + 16)
       .lineWidth(0.6).stroke(LIGHT_GRAY);
    doc.undash();
    doc.restore();
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(NAVY)
       .text(words, M + 12, wordsY + 18, { width: CW - 24 });

    // ── Footer ───────────────────────────────────────────────────────
    const footerY = PH - M - 22;
    // thin separator above footer
    doc.moveTo(M + 20, footerY - 6).lineTo(M + CW - 20, footerY - 6)
       .lineWidth(0.5).stroke(LIGHT_GRAY);
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(GRAY)
       .text(
         'This is an electronically generated receipt and does not require further validation.',
         M + 12, footerY, { width: CW - 24, align: 'center' },
       );

    doc.end();
  });
}

import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const LOGO_PATH = path.join(__dirname, '../assets/church-logo.jpg');

const NAVY       = '#1e3a5f';
const GOLD       = '#c8a84b';
const GRAY       = '#555555';
const LIGHT_GRAY = '#c8c8c8';
const HDR_BG     = '#eef2f7';
const BOX_BG     = '#f4f7fb';

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
}

export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const M        = 22;       // outer margin
    const PW       = 419;      // A5 width
    const barH     = 56;       // navy accent bar
    const hdrH     = 24;       // table header row
    const rowH     = 22;       // table body row
    const wordsH   = 40;       // amount-in-words box

    const bodyRows = Math.max(data.items.length, 3);
    const tableH   = hdrH + bodyRows * rowH + hdrH;    // header + rows + total

    // Dynamic page height — no wasted whitespace
    // Fixed stack: M + bar(56) + gold(2.5) + noDate(24) + recipient(22) + gap(6) + badge(26)
    //              + badgeGap(12) + sepToTable(10) + table + wordsGap(12) + words(40)
    //              + sigSection(36) + footerSection(28) + M
    const PH = Math.ceil(M + 56 + 2.5 + 24 + 22 + 6 + 26 + 12 + 10 + tableH + 12 + wordsH + 36 + 28 + M);
    const CW = PW - M * 2;

    const doc = new PDFDocument({ size: [PW, PH], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Card ─────────────────────────────────────────────────────────
    // shadow
    doc.roundedRect(M + 2, M + 2, CW, PH - M * 2, 10).fill('#c4cbd5');
    // white card
    doc.roundedRect(M, M, CW, PH - M * 2, 10).fill('#ffffff').lineWidth(0.8).stroke(NAVY);

    // ── Accent bar (clipped to card) ──────────────────────────────────
    doc.save();
    doc.roundedRect(M, M, CW, PH - M * 2, 10).clip();
    doc.rect(M, M, CW, barH).fill(NAVY);
    doc.rect(M, M + barH, CW, 2.5).fill(GOLD);
    doc.restore();

    // ── Logo ──────────────────────────────────────────────────────────
    const logoSize = 58;
    const logoX    = M + 13;
    const logoY    = M + (barH - logoSize) / 2 - 1;
    const logoCX   = logoX + logoSize / 2;
    const logoCY   = logoY + logoSize / 2;

    if (fs.existsSync(LOGO_PATH)) {
      doc.circle(logoCX, logoCY, logoSize / 2 + 3.5).fill(GOLD);
      doc.circle(logoCX, logoCY, logoSize / 2 + 1.5).fill('#ffffff');
      doc.save();
      doc.circle(logoCX, logoCY, logoSize / 2).clip();
      doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize });
      doc.restore();
    }

    // ── Church name + contact ─────────────────────────────────────────
    const nameX = logoX + logoSize + 13;
    const nameW = CW - logoSize - 26;
    doc.font('Helvetica-Bold').fontSize(14.5).fillColor('#ffffff')
       .text("St. Mary's Church, Elthuruth", nameX, M + 10, { width: nameW });
    doc.font('Helvetica').fontSize(7.5).fillColor('#a8c8ee')
       .text(
         'Pin: 680611  \u2022  PH: 0487 2369929  \u2022  smcelth@gmail.com',
         nameX, M + 33, { width: nameW },
       );

    // ── No / Date ─────────────────────────────────────────────────────
    const noDateY = M + barH + 2.5;
    doc.rect(M, noDateY, CW, 24).fill(HDR_BG);

    const dateStr = data.date.toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    doc.font('Helvetica').fontSize(10).fillColor(NAVY)
       .text(`No:  ${data.receiptNumber}`, M + 10, noDateY + 7);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
       .text(`Date:  ${dateStr}`, M, noDateY + 7, { width: CW - 10, align: 'right' });

    // ── Received From row ─────────────────────────────────────────────
    const recipientY = noDateY + 24;
    doc.moveTo(M, recipientY).lineTo(M + CW, recipientY).lineWidth(0.4).stroke(LIGHT_GRAY);
    doc.font('Helvetica').fontSize(9.5).fillColor(GRAY)
       .text('Received From:', M + 10, recipientY + 6);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(NAVY)
       .text(data.recipientName || '—', M + 100, recipientY + 6, { width: CW - 110 });

    // ── RECEIPT badge ─────────────────────────────────────────────────
    const badgeW = 144;
    const badgeH = 26;
    const badgeX = (PW - badgeW) / 2;
    const badgeY = noDateY + 24 + 22 + 6;  // after noDate + recipient row + gap

    doc.roundedRect(badgeX + 2, badgeY + 2, badgeW, badgeH, 6).fill('#8a9fb8');  // shadow
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6).fill(NAVY);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 6).lineWidth(1.2).stroke(GOLD);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff')
       .text('R E C E I P T', badgeX, badgeY + 6, { width: badgeW, align: 'center' });

    // ── Decorative separator ──────────────────────────────────────────
    const sepY = badgeY + badgeH + 12;
    const midX = PW / 2;
    doc.moveTo(M + 12, sepY).lineTo(midX - 10, sepY).lineWidth(0.7).stroke(LIGHT_GRAY);
    doc.circle(midX, sepY, 3.5).fill(NAVY);
    doc.moveTo(midX + 10, sepY).lineTo(M + CW - 12, sepY).lineWidth(0.7).stroke(LIGHT_GRAY);

    // ── Items Table ───────────────────────────────────────────────────
    const tableY   = sepY + 10;
    const colItemW = Math.floor(CW * 0.67);
    const colAmtW  = CW - colItemW;

    // shadow + card
    doc.roundedRect(M + 1.5, tableY + 1.5, CW, tableH, 5).fill('#c4cbd5');
    doc.roundedRect(M, tableY, CW, tableH, 5).fill('#ffffff').lineWidth(0.7).stroke(NAVY);

    // Header (clipped rounded top)
    doc.save();
    doc.roundedRect(M, tableY, CW, hdrH, 5).clip();
    doc.rect(M, tableY, CW, hdrH).fill(NAVY);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#ffffff')
       .text('Items', M + 10, tableY + 7, { width: colItemW - 14 });
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#ffffff')
       .text('Amount', M + colItemW + 4, tableY + 7, { width: colAmtW - 10, align: 'right' });

    // Column divider
    doc.moveTo(M + colItemW, tableY + hdrH)
       .lineTo(M + colItemW, tableY + tableH)
       .lineWidth(0.5).stroke(LIGHT_GRAY);

    // Body rows — only shade cells that have data
    for (let i = 0; i < bodyRows; i++) {
      const rowY = tableY + hdrH + i * rowH;
      doc.moveTo(M, rowY).lineTo(M + CW, rowY).lineWidth(0.4).stroke(LIGHT_GRAY);

      const item = data.items[i];
      if (item) {
        if (i % 2 === 0) doc.rect(M, rowY, CW, rowH).fill('#f6f9fc');
        doc.font('Helvetica').fontSize(10).fillColor(NAVY)
           .text(item.description, M + 10, rowY + 6, { width: colItemW - 18 });
        doc.font('Helvetica').fontSize(10).fillColor(NAVY)
           .text(`Rs. ${item.amount.toLocaleString('en-IN')}`, M + colItemW + 4, rowY + 6, {
             width: colAmtW - 10, align: 'right',
           });
      }
    }

    // Total row
    const totalRowY = tableY + hdrH + bodyRows * rowH;
    doc.save();
    doc.roundedRect(M, tableY, CW, tableH, 5).clip();
    doc.rect(M, totalRowY, CW, hdrH).fill(HDR_BG);
    doc.restore();
    doc.moveTo(M, totalRowY).lineTo(M + CW, totalRowY).lineWidth(1).stroke(NAVY);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY)
       .text('Total Amount', M + 10, totalRowY + 7, { width: colItemW - 18, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY)
       .text(`Rs. ${data.totalAmount.toLocaleString('en-IN')}`, M + colItemW + 4, totalRowY + 7, {
         width: colAmtW - 10, align: 'right',
       });

    // ── Amount in Words ───────────────────────────────────────────────
    const wordsY = tableY + tableH + 12;
    const words  = amountInWords(data.totalAmount);

    doc.roundedRect(M, wordsY, CW, wordsH, 5).fill(BOX_BG).lineWidth(0.6).stroke(LIGHT_GRAY);
    // left accent strip
    doc.save();
    doc.roundedRect(M, wordsY, CW, wordsH, 5).clip();
    doc.rect(M, wordsY, 4.5, wordsH).fill(NAVY);
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(NAVY)
       .text('Amount in Words:', M + 12, wordsY + 6);
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(NAVY)
       .text(words, M + 12, wordsY + 20, { width: CW - 20 });

    // ── Authorized Signatory ──────────────────────────────────────────
    const sigY = wordsY + wordsH + 14;
    const sigRight = M + CW - 10;
    doc.moveTo(sigRight - 130, sigY).lineTo(sigRight, sigY).lineWidth(0.6).stroke(LIGHT_GRAY);
    doc.font('Helvetica').fontSize(8).fillColor(GRAY)
       .text('Authorized Signatory', sigRight - 130, sigY + 4, { width: 130, align: 'center' });

    // ── Footer ────────────────────────────────────────────────────────
    const footerY = sigY + 22;
    doc.moveTo(M + 20, footerY).lineTo(M + CW - 20, footerY).lineWidth(0.5).stroke(LIGHT_GRAY);
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(GRAY)
       .text(
         'This is an electronically generated receipt and does not require further validation.',
         M + 10, footerY + 6, { width: CW - 20, align: 'center' },
       );

    doc.end();
  });
}

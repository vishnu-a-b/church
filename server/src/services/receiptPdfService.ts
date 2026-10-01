import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

const LOGO_PATH = path.join(__dirname, '../assets/church-logo.jpg');
const DARK_NAVY = '#2d3a4a';
const GRAY = '#888888';
const LIGHT_GRAY = '#cccccc';

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
    // A5 page
    const doc = new PDFDocument({
      size: 'A5',
      margins: { top: 30, bottom: 30, left: 30, right: 30 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { width: pageWidth, height: pageHeight } = doc.page;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    // Outer rounded border
    doc.roundedRect(margin - 10, margin - 10, contentWidth + 20, pageHeight - margin * 2 + 20, 12)
       .stroke(LIGHT_GRAY);

    // ---- HEADER: Logo + Church name ----
    const logoSize = 60;
    const logoX = margin;
    const logoY = margin + 4;

    if (fs.existsSync(LOGO_PATH)) {
      doc.save();
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip();
      doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize });
      doc.restore();
    }

    const textX = logoX + logoSize + 14;
    const textW = contentWidth - logoSize - 14;
    doc.font('Helvetica-Bold').fontSize(15).fillColor(DARK_NAVY)
       .text("St. Mary's Church, Elthuruth", textX, logoY + 10, { width: textW });
    doc.font('Helvetica').fontSize(10).fillColor(GRAY)
       .text('Archdiocese of Thrissur', textX, logoY + 34, { width: textW });

    // Horizontal rule
    const ruleY = logoY + logoSize + 12;
    doc.moveTo(margin, ruleY).lineTo(margin + contentWidth, ruleY).lineWidth(1).stroke(DARK_NAVY);

    // ---- No + DATE ----
    const infoY = ruleY + 14;
    const dateStr = data.date.toLocaleDateString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    doc.font('Helvetica').fontSize(10).fillColor(DARK_NAVY)
       .text(`No  ${data.receiptNumber}`, margin, infoY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_NAVY)
       .text(`DATE ${dateStr}`, margin, infoY, { width: contentWidth, align: 'right' });

    // ---- RECEIPT badge ----
    const badgeW = 120;
    const badgeH = 26;
    const badgeX = (pageWidth - badgeW) / 2;
    const badgeY = infoY + 20;
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 5).fill(DARK_NAVY);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff')
       .text('RECEIPT', badgeX, badgeY + 6, { width: badgeW, align: 'center' });

    // ---- Dashed separator ----
    const dashY = badgeY + badgeH + 10;
    doc.save();
    doc.dash(4, { space: 4 });
    doc.moveTo(margin, dashY).lineTo(margin + contentWidth, dashY).lineWidth(0.8).stroke(LIGHT_GRAY);
    doc.undash();
    doc.restore();

    // ---- Items Table ----
    const tableY = dashY + 12;
    const colItemW = Math.floor(contentWidth * 0.67);
    const colAmtW = contentWidth - colItemW;
    const rowH = 22;
    const bodyRows = Math.max(data.items.length, 5); // min 5 body rows for spacing
    const totalRows = 1 + bodyRows + 1; // header + body + total
    const tableH = totalRows * rowH;

    // Table outer border
    doc.lineWidth(0.8);
    doc.roundedRect(margin, tableY, contentWidth, tableH, 4).stroke(DARK_NAVY);

    // Header row fill
    doc.rect(margin, tableY, contentWidth, rowH).fill(DARK_NAVY);

    // Header text
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff')
       .text('Items', margin + 8, tableY + 6, { width: colItemW - 12 });
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff')
       .text('Amount', margin + colItemW + 4, tableY + 6, { width: colAmtW - 8, align: 'right' });

    // Vertical column divider
    doc.moveTo(margin + colItemW, tableY).lineTo(margin + colItemW, tableY + tableH)
       .stroke(DARK_NAVY);

    // Item rows
    data.items.forEach((item, i) => {
      const rowY = tableY + rowH * (i + 1);
      doc.moveTo(margin, rowY).lineTo(margin + contentWidth, rowY)
         .lineWidth(0.5).stroke(LIGHT_GRAY);
      doc.font('Helvetica').fontSize(10).fillColor(DARK_NAVY)
         .text(item.description, margin + 8, rowY + 6, { width: colItemW - 16 });
      doc.font('Helvetica').fontSize(10).fillColor(DARK_NAVY)
         .text(`Rs. ${item.amount.toLocaleString('en-IN')}`, margin + colItemW + 4, rowY + 6, {
           width: colAmtW - 8, align: 'right',
         });
    });

    // Total row
    const totalRowY = tableY + rowH * (bodyRows + 1);
    doc.moveTo(margin, totalRowY).lineTo(margin + contentWidth, totalRowY)
       .lineWidth(1).stroke(DARK_NAVY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_NAVY)
       .text('Total Amount', margin + 8, totalRowY + 6, { width: colItemW - 16, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_NAVY)
       .text(`Rs. ${data.totalAmount.toLocaleString('en-IN')}`, margin + colItemW + 4, totalRowY + 6, {
         width: colAmtW - 8, align: 'right',
       });

    // ---- Amount in Words ----
    const wordsY = tableY + tableH + 16;
    const words = amountInWords(data.totalAmount);
    doc.font('Helvetica').fontSize(10).fillColor(DARK_NAVY).text('Amount in Words', margin, wordsY);
    // dotted line after label
    doc.save();
    doc.dash(2, { space: 3 });
    doc.moveTo(margin + 115, wordsY + 10).lineTo(margin + contentWidth, wordsY + 10)
       .lineWidth(0.7).stroke(LIGHT_GRAY);
    doc.undash();
    doc.restore();
    doc.font('Helvetica').fontSize(9).fillColor(DARK_NAVY)
       .text(words, margin + 118, wordsY + 1, { width: contentWidth - 118 });

    // ---- Footer ----
    const footerY = pageHeight - margin - 16;
    doc.font('Helvetica').fontSize(8).fillColor(GRAY)
       .text(
         'This is an electronically generated receipt and does not require further validation.',
         margin,
         footerY,
         { width: contentWidth, align: 'center' },
       );

    doc.end();
  });
}

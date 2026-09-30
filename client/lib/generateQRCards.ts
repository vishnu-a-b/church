import QRCode from 'qrcode';
import JSZip from 'jszip';

export interface DonorCardData {
  id: string;
  name: string;
  jgccNo?: string; // e.g. "JGCC 0001-JGCC 0030"
  planName: string;
}

const CARD_W = 420;
const CARD_H = 540;
const HEADER_H = 58;
const QR_SIZE = 230;
const ACCENT = '#1e40af'; // blue-800

async function drawCard(donor: DonorCardData, portalUrl: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Top header bar
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, CARD_W, HEADER_H);

  // Header text — plan name
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText(donor.planName, CARD_W / 2, 24, CARD_W - 32);
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText('Monthly Support · Supporter Portal', CARD_W / 2, 44);

  // QR code
  const qrDataUrl = await QRCode.toDataURL(portalUrl, {
    width: QR_SIZE,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, (CARD_W - QR_SIZE) / 2, HEADER_H + 18, QR_SIZE, QR_SIZE);
      resolve();
    };
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  const qrBottom = HEADER_H + 18 + QR_SIZE;

  // Donor name
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText(donor.name, CARD_W / 2, qrBottom + 30, CARD_W - 40);

  // JGCC number badge
  if (donor.jgccNo) {
    const label = donor.jgccNo;
    ctx.font = 'bold 13px Arial, sans-serif';
    const tw = ctx.measureText(label).width;
    const bx = (CARD_W - tw - 20) / 2;
    const by = qrBottom + 44;
    ctx.fillStyle = '#dbeafe'; // blue-100
    ctx.beginPath();
    ctx.roundRect(bx, by, tw + 20, 24, 12);
    ctx.fill();
    ctx.fillStyle = ACCENT;
    ctx.fillText(label, CARD_W / 2, by + 16);
  }

  // Divider
  const divY = donor.jgccNo ? qrBottom + 84 : qrBottom + 58;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(36, divY, CARD_W - 72, 1);

  // Instruction
  ctx.fillStyle = '#475569';
  ctx.font = 'italic 13px Arial, sans-serif';
  ctx.fillText('Scan to view your contribution history', CARD_W / 2, divY + 22);

  // URL (tiny, for reference)
  const shortUrl = portalUrl.replace(/^https?:\/\//, '');
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(
    shortUrl.length > 58 ? shortUrl.slice(0, 55) + '...' : shortUrl,
    CARD_W / 2,
    divY + 42,
    CARD_W - 32,
  );

  // Bottom accent stripe
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, CARD_H - 7, CARD_W, 7);

  return canvas.toDataURL('image/png');
}

function safeName(raw: string): string {
  return raw.replace(/[/\\:*?"<>|]/g, '-').trim().slice(0, 80);
}

export async function downloadQRCards(
  donors: DonorCardData[],
  baseUrl: string,
): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder('QR Cards')!;

  for (const donor of donors) {
    const portalUrl = `${baseUrl}/supporter?id=${encodeURIComponent(donor.id)}`;
    const folderName = safeName(
      donor.jgccNo ? `${donor.name} (${donor.jgccNo})` : donor.name,
    );
    const folder = root.folder(folderName)!;
    const dataUrl = await drawCard(donor, portalUrl);
    folder.file('portal-card.png', dataUrl.split(',')[1], { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'monthly-support-qr-cards.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

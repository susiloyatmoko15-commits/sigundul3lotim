import QRCode from 'qrcode';
import { LocationConfig } from '../types/game';

export async function generateQrDataUrl(text: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 320,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      ...options,
    });
  } catch (err) {
    console.error('Failed to generate QR Code Data URL', err);
    return '';
  }
}

export function downloadQrImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printQrCards(locations: LocationConfig[], qrDataUrls: Record<string, string>) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Harap izinkan popup di browser Anda untuk mencetak kartu QR.');
    return;
  }

  const cardsHtml = locations
    .filter(loc => loc.isActive)
    .map(loc => {
      const qrUrl = qrDataUrls[loc.id] || '';
      return `
      <div class="card ${loc.isFinal ? 'final-card' : ''}">
        <div class="header">
          <div class="badge">${loc.code}</div>
          <h2>${loc.name}</h2>
          ${loc.isFinal ? '<div class="final-tag">⭐ POS TERAKHIR / HARTA KARUN ⭐</div>' : ''}
        </div>
        <div class="qr-container">
          <img src="${qrUrl}" alt="${loc.code} QR Code" />
          <div class="code-text">${loc.qrCode}</div>
        </div>
        <div class="hint-box">
          <div class="hint-label">📜 Petunjuk Lokasi untuk Siswa:</div>
          <p class="hint-text">${loc.hint}</p>
        </div>
        <div class="footer">
          <span>📜 Detektif Literasi - Misteri Pusaka Aksara Nusantara</span>
          <span>Tempel di: <strong>${loc.name}</strong></span>
        </div>
      </div>
    `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cetak Kartu QR Code - Detektif Literasi</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #fff;
            color: #1e293b;
            margin: 0;
            padding: 10px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .card {
            border: 3px dashed #d97706;
            border-radius: 16px;
            padding: 16px;
            text-align: center;
            background: #fffbeb;
            page-break-inside: avoid;
            box-sizing: border-box;
            position: relative;
          }
          .card.final-card {
            border: 3px solid #b45309;
            background: #fef3c7;
          }
          .header {
            margin-bottom: 8px;
          }
          .badge {
            display: inline-block;
            background: #f59e0b;
            color: #fff;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 9999px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .final-tag {
            color: #b45309;
            font-weight: bold;
            font-size: 12px;
            margin-top: 4px;
          }
          h2 {
            margin: 6px 0 2px 0;
            font-size: 20px;
            color: #78350f;
          }
          .qr-container {
            background: #fff;
            padding: 10px;
            display: inline-block;
            border-radius: 12px;
            border: 2px solid #fde68a;
            margin: 8px 0;
          }
          .qr-container img {
            width: 170px;
            height: 170px;
            display: block;
            margin: 0 auto;
          }
          .code-text {
            font-family: monospace;
            font-weight: bold;
            font-size: 13px;
            color: #475569;
            margin-top: 6px;
            background: #f1f5f9;
            padding: 3px 8px;
            border-radius: 6px;
          }
          .hint-box {
            background: #fff;
            border-left: 4px solid #f59e0b;
            padding: 8px 12px;
            text-align: left;
            border-radius: 6px;
            margin: 8px 0;
          }
          .hint-label {
            font-size: 11px;
            font-weight: bold;
            color: #92400e;
            text-transform: uppercase;
          }
          .hint-text {
            margin: 4px 0 0 0;
            font-size: 13px;
            line-height: 1.3;
            color: #334155;
          }
          .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px dotted #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: center; padding: 10px; background: #e0f2fe; border-radius: 8px;">
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer;">
            🖨️ Cetak Kartu Sekarang
          </button>
          <span style="margin-left: 15px; color: #0369a1; font-size: 14px;">Gunting kartu ini dan tempelkan di lokasi sekolah masing-masing!</span>
        </div>
        <div class="grid">
          ${cardsHtml}
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

import { Order, User, SalonTillInfo } from '../types';
import { formatCurrency } from '../i18n';

/**
 * Utility to download CSV files in browser with UTF-8 BOM
 */
export const exportToCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const processRow = (row: (string | number)[]) => {
    return row.map(val => {
      const strVal = val === null || val === undefined ? '' : String(val);
      const escaped = strVal.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  };

  const csvContent = '\uFEFF' + [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(r => processRow(r))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface ReportStatItem {
  label: string;
  value: string | number;
}

export interface PrintableReportConfig {
  title: string;
  subtitle?: string;
  managerOrStaffName?: string;
  periodLabel?: string;
  stats?: ReportStatItem[];
  headers: string[];
  rows: (string | number)[][];
  footerNote?: string;
}

/**
 * Opens a print dialog to save as PDF or print report
 */
export const printPdfReport = (config: PrintableReportConfig) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Tafadhali ruhusu pop-up ili kufungua ripoti.');
    return;
  }

  const currentDateStr = new Date().toLocaleString('sw-TZ', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const statsHtml = config.stats && config.stats.length > 0
    ? `<div class="stats-grid">
        ${config.stats.map(s => `
          <div class="stat-card">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value">${s.value}</div>
          </div>
        `).join('')}
      </div>`
    : '';

  const tableHeaderHtml = `
    <tr>
      ${config.headers.map(h => `<th>${h}</th>`).join('')}
    </tr>
  `;

  const tableBodyHtml = config.rows.length > 0
    ? config.rows.map((row, idx) => `
        <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
          ${row.map(cell => `<td>${cell}</td>`).join('')}
        </tr>
      `).join('')
    : `<tr><td colspan="${config.headers.length}" style="text-align: center; color: #888;">Hakuna taarifa za kuonyesha.</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html lang="sw">
    <head>
      <meta charset="utf-8" />
      <title>${config.title} - DREADLOCKS AND HAIR DRESSING SALOON</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        body {
          color: #1e293b;
          background: #ffffff;
          padding: 24px;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          border-bottom: 2px solid #8b5cf6;
          padding-bottom: 14px;
          margin-bottom: 18px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .brand-title {
          font-size: 18px;
          font-weight: 800;
          color: #5b21b6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .report-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 4px;
        }
        .meta-info {
          font-size: 11px;
          color: #64748b;
          text-align: right;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .stat-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 15px;
          font-weight: 800;
          color: #5b21b6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-align: left;
          padding: 8px 10px;
          border-bottom: 2px solid #cbd5e1;
          font-size: 11px;
          text-transform: uppercase;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }
        tr.even {
          background: #ffffff;
        }
        tr.odd {
          background: #f8fafc;
        }
        .footer {
          margin-top: 24px;
          padding-top: 12px;
          border-top: 1px dashed #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
        }
        .print-btn-bar {
          margin-bottom: 16px;
          text-align: right;
        }
        .print-btn {
          background: #7c3aed;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-weight: 700;
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        @media print {
          .print-btn-bar {
            display: none;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar">
        <button class="print-btn" onclick="window.print()">🖨️ Chapisha / Hifadhi kama PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="brand-title">DREADLOCKS AND HAIR DRESSING SALOON</div>
          <div class="report-title">${config.title}</div>
          ${config.subtitle ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${config.subtitle}</div>` : ''}
        </div>
        <div class="meta-info">
          <div><strong>Kipindi:</strong> ${config.periodLabel || 'Kazi Zote'}</div>
          <div><strong>Tarehe ya Kutolewa:</strong> ${currentDateStr}</div>
          ${config.managerOrStaffName ? `<div><strong>Mhusika:</strong> ${config.managerOrStaffName}</div>` : ''}
        </div>
      </div>

      ${statsHtml}

      <table>
        <thead>
          ${tableHeaderHtml}
        </thead>
        <tbody>
          ${tableBodyHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>${config.footerNote || 'DREADLOCKS AND HAIR DRESSING SALOON • Mfumo Rasmi wa Usimamizi'}</div>
        <div>Ukurasa 1 / 1 • Imetolewa Kiotomatiki</div>
      </div>

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Print individual customer receipt
 */
export const printCustomerReceipt = (order: Order, tillDetails?: SalonTillInfo[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Tafadhali ruhusu pop-up ili kufungua risiti.');
    return;
  }

  const till = tillDetails?.find(t => t.provider === order.paymentProvider) || tillDetails?.[0];

  const html = `
    <!DOCTYPE html>
    <html lang="sw">
    <head>
      <meta charset="utf-8" />
      <title>Risiti ya Oda #${order.bookingCode} - DREADLOCKS AND HAIR DRESSING SALOON</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
        }
        body {
          background: #ffffff;
          color: #0f172a;
          padding: 24px;
          display: flex;
          justify-content: center;
        }
        .receipt-card {
          width: 340px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #cbd5e1;
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .salon-name {
          font-size: 13px;
          font-weight: 800;
          color: #5b21b6;
        }
        .receipt-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 3px 8px;
          background: #f1f5f9;
          border-radius: 4px;
          margin-top: 6px;
        }
        .code-box {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #1e293b;
          margin: 8px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 6px;
          color: #475569;
        }
        .info-row strong {
          color: #0f172a;
        }
        .items-section {
          border-top: 1px dashed #cbd5e1;
          border-bottom: 1px dashed #cbd5e1;
          padding: 10px 0;
          margin: 10px 0;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .total-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 900;
          color: #5b21b6;
          padding: 8px 0;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          margin-top: 14px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 10px;
        }
        .print-btn-bar {
          margin-bottom: 14px;
          text-align: center;
        }
        .print-btn {
          background: #7c3aed;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-weight: 700;
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
        }
        @media print {
          .print-btn-bar { display: none; }
          body { padding: 0; }
          .receipt-card { border: none; box-shadow: none; width: 100%; }
        }
      </style>
    </head>
    <body>
      <div>
        <div class="print-btn-bar">
          <button class="print-btn" onclick="window.print()">🖨️ Chapisha Risiti</button>
        </div>
        <div class="receipt-card">
          <div class="header">
            <div class="salon-name">DREADLOCKS AND HAIR DRESSING SALOON</div>
            <div class="receipt-badge">Risiti Rasmi ya Huduma</div>
            <div class="code-box">#${order.bookingCode}</div>
            <div style="font-size: 10px; color: #64748b;">${new Date(order.createdAt).toLocaleString('sw-TZ')}</div>
          </div>

          <div class="info-row">
            <span>Mteja:</span>
            <strong>${order.customerName}</strong>
          </div>
          <div class="info-row">
            <span>Simu:</span>
            <strong>${order.customerPhone}</strong>
          </div>
          ${order.assignedStaffName ? `
            <div class="info-row">
              <span>Fundi Aliyepewa:</span>
              <strong>${order.assignedStaffName}</strong>
            </div>
          ` : ''}
          <div class="info-row">
            <span>Hali ya Oda:</span>
            <strong>${order.status.toUpperCase()}</strong>
          </div>

          <div class="items-section">
            ${order.items.map(item => `
              <div class="item-row">
                <span>${item.nameSw} (x${item.count})</span>
                <strong>${formatCurrency(item.selectedPrice * item.count)}</strong>
              </div>
            `).join('')}
          </div>

          <div class="total-box">
            <span>JUMLA KUU:</span>
            <span>${formatCurrency(order.totalAmount)}</span>
          </div>

          ${till ? `
            <div class="info-row" style="margin-top: 6px; font-size: 10px;">
              <span>Lipa Namba:</span>
              <strong>${till.tillNumber} (${till.name})</strong>
            </div>
          ` : ''}

          <div class="footer">
            <p>Asante kwa kuchagua huduma zetu!</p>
            <p>Karibu Tena • DREADLOCKS & HAIR DRESSING</p>
          </div>
        </div>
      </div>
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

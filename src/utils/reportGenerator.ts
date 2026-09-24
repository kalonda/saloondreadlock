import { Order, SalonTillInfo } from '../types';
import { formatCurrency } from '../i18n';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Utility to download or share CSV files on Android (via Native Share/Save) and Web browsers (via Blob download)
 */
export const exportToCsv = async (filename: string, headers: string[], rows: (string | number)[][]) => {
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

  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

  // Native Android / iOS saving & sharing
  if (Capacitor.isNativePlatform()) {
    try {
      const fileResult = await Filesystem.writeFile({
        path: cleanFilename,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      await Share.share({
        title: filename,
        text: `Ripoti ya Saluni: ${cleanFilename}`,
        url: fileResult.uri,
        dialogTitle: 'Hifadhi au Shiriki CSV'
      });
      return;
    } catch (err) {
      console.error('Native CSV export/share error, falling back:', err);
    }
  }

  // Web Browser fallback
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
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
 * Generates a PDF Report and saves/shares on Android phone or downloads on Web
 */
export const printPdfReport = async (config: PrintableReportConfig) => {
  const currentDateStr = new Date().toLocaleString('sw-TZ', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Purple luxury header banner
  doc.setFillColor(124, 58, 237); // #7c3aed
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('DREADLOCKS AND HAIR DRESSING SALOON', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mfumo Rasmi wa Usimamizi na Ripoti za Biashara', 14, 17);

  // Title & Subtitle
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(config.title, 14, 34);

  let currentY = 40;
  if (config.subtitle) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(config.subtitle, 14, currentY);
    currentY += 6;
  }

  // Meta Information Bar
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const metaText = `Kipindi: ${config.periodLabel || 'Kazi Zote'}   |   Tarehe: ${currentDateStr}${config.managerOrStaffName ? `   |   Mhusika: ${config.managerOrStaffName}` : ''}`;
  doc.text(metaText, 14, currentY);
  currentY += 7;

  // Stat summary cards
  if (config.stats && config.stats.length > 0) {
    const cardWidth = Math.min(56, (182 / config.stats.length) - 3);
    config.stats.forEach((s, idx) => {
      const x = 14 + idx * (cardWidth + 3);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, currentY, cardWidth, 15, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(String(s.label).toUpperCase(), x + 3, currentY + 4.5);

      doc.setFontSize(10.5);
      doc.setTextColor(124, 58, 237);
      doc.text(String(s.value), x + 3, currentY + 11.5);
    });
    currentY += 20;
  }

  // Data Table
  autoTable(doc, {
    startY: currentY,
    head: [config.headers],
    body: config.rows.map(r => r.map(c => String(c ?? ''))),
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 },
    foot: [[config.footerNote || 'DREADLOCKS AND HAIR DRESSING SALOON • Imetolewa Kiotomatiki', ...Array(config.headers.length - 1).fill('')]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [100, 116, 139],
      fontSize: 7.5,
      fontStyle: 'normal'
    }
  });

  const cleanFilename = `${config.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

  // Native Android / iOS saving & sharing
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileResult = await Filesystem.writeFile({
        path: cleanFilename,
        data: pdfBase64,
        directory: Directory.Cache
      });

      await Share.share({
        title: config.title,
        text: `Ripoti ya Saluni: ${config.title}`,
        url: fileResult.uri,
        dialogTitle: 'Hifadhi au Shiriki PDF'
      });
      return;
    } catch (err) {
      console.error('Native PDF save/share error, falling back:', err);
    }
  }

  // Web Browser fallback: Download PDF
  try {
    doc.save(cleanFilename);
  } catch (err) {
    console.error('PDF download error:', err);
  }
};

/**
 * Print or Save individual customer receipt (Native Share sheet on Android, PDF download on web)
 */
export const printCustomerReceipt = async (order: Order, tillDetails?: SalonTillInfo[]) => {
  const till = tillDetails?.find(t => t.provider === order.paymentProvider) || tillDetails?.[0];
  const dateStr = new Date(order.createdAt).toLocaleString('sw-TZ');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 170] // Receipt card format
  });

  // Purple top header
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, 105, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DREADLOCKS & SALOON', 52.5, 7.5, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Risiti Rasmi ya Huduma', 52.5, 12.5, { align: 'center' });

  // Receipt details
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${order.bookingCode}`, 52.5, 25, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(dateStr, 52.5, 30, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.line(8, 34, 97, 34);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.text(`Mteja: ${order.customerName}`, 8, 40);
  doc.text(`Simu: ${order.customerPhone}`, 8, 45);
  if (order.assignedStaffName) {
    doc.text(`Fundi: ${order.assignedStaffName}`, 8, 50);
  }
  doc.text(`Hali ya Oda: ${order.status.toUpperCase()}`, 8, order.assignedStaffName ? 55 : 50);

  let curY = order.assignedStaffName ? 61 : 56;
  doc.line(8, curY - 2, 97, curY - 2);

  // Items table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('HUDUMA', 8, curY + 2);
  doc.text('BEI', 97, curY + 2, { align: 'right' });
  curY += 6;

  doc.setFont('helvetica', 'normal');
  order.items.forEach(item => {
    doc.text(`${item.nameSw} (x${item.count})`, 8, curY);
    doc.text(formatCurrency(item.selectedPrice * item.count), 97, curY, { align: 'right' });
    curY += 5;
  });

  doc.line(8, curY + 1, 97, curY + 1);
  curY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(124, 58, 237);
  doc.text('JUMLA KUU:', 8, curY);
  doc.text(formatCurrency(order.totalAmount), 97, curY, { align: 'right' });
  curY += 7;

  if (till) {
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Lipa Namba: ${till.tillNumber} (${till.name})`, 52.5, curY, { align: 'center' });
    curY += 5;
  }

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Asante kwa kuchagua huduma zetu! Karibu tena.', 52.5, curY + 4, { align: 'center' });

  const cleanFilename = `Risiti_${order.bookingCode}.pdf`;

  // Native Android / iOS saving & sharing
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const fileResult = await Filesystem.writeFile({
        path: cleanFilename,
        data: pdfBase64,
        directory: Directory.Cache
      });

      await Share.share({
        title: `Risiti ya Oda #${order.bookingCode}`,
        text: `Risiti ya Saluni - Oda #${order.bookingCode}`,
        url: fileResult.uri,
        dialogTitle: 'Hifadhi au Shiriki Risiti'
      });
      return;
    } catch (err) {
      console.error('Native receipt save/share error, falling back:', err);
    }
  }

  // Web Browser fallback
  try {
    doc.save(cleanFilename);
  } catch (err) {
    console.error('Receipt download error:', err);
  }
};

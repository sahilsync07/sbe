import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format currency with commas (INR style)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
};

const monthMap = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseEntryDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [day, monthStr, yearShort] = parts;
  const month = monthMap[monthStr];
  if (month === undefined) return null;
  let year = parseInt(yearShort, 10);
  year = year < 50 ? 2000 + year : 1900 + year;
  return new Date(year, month, parseInt(day, 10));
};

const formatDateStr = (dateObj) => {
  if (!dateObj) return '';
  const d = dateObj.getDate();
  const m = monthNames[dateObj.getMonth()];
  const y = String(dateObj.getFullYear()).slice(-2);
  return `${d}-${m}-${y}`;
};

/**
 * Computes Customer-Centric Invoice Tenure & Detailed Pending Invoices
 */
const computeLedgerAgingAndBills = (ledger, effectiveOpeningBalance, latestDateObj) => {
  const refDate = latestDateObj || new Date();
  const closing = ledger.closingBalance !== undefined ? ledger.closingBalance : 0;
  const totalOutstanding = Math.abs(closing);

  const allEntries = (ledger.entries || []).map(e => ({
    ...e,
    _parsedDate: parseEntryDate(e.date)
  })).filter(e => e._parsedDate !== null);

  // Sort newest first to allocate outstanding balance
  allEntries.sort((a, b) => b._parsedDate - a._parsedDate);

  let unallocatedBalance = totalOutstanding;
  let b0_30 = 0, b31_60 = 0, b61_90 = 0, b90_180 = 0, b180_plus = 0;
  const pendingBills = [];

  const invoiceEntries = allEntries.filter(e => e.drCr === 'Dr' || e.type === 'Tax Invoice' || e.type === 'Sales');

  for (const inv of invoiceEntries) {
    if (unallocatedBalance <= 0) break;

    const daysOld = Math.max(0, Math.floor((refDate - inv._parsedDate) / (1000 * 60 * 60 * 24)));
    const amountToAllocate = Math.min(unallocatedBalance, inv.amount || 0);

    let bucket = '0–30 Days';
    if (daysOld <= 30) {
      b0_30 += amountToAllocate;
      bucket = '0–30 Days';
    } else if (daysOld <= 60) {
      b31_60 += amountToAllocate;
      bucket = '31–60 Days';
    } else if (daysOld <= 90) {
      b61_90 += amountToAllocate;
      bucket = '61–90 Days';
    } else if (daysOld <= 180) {
      b90_180 += amountToAllocate;
      bucket = '90–180 Days';
    } else {
      b180_plus += amountToAllocate;
      bucket = '180+ Days';
    }

    pendingBills.push({
      date: inv.date,
      voucherNo: inv.voucherNo ? `Bill #${inv.voucherNo}` : (inv.type || 'Invoice'),
      amount: amountToAllocate,
      daysOld,
      bucket,
      _parsedDate: inv._parsedDate
    });

    unallocatedBalance -= amountToAllocate;
  }

  if (unallocatedBalance > 0) {
    b180_plus += unallocatedBalance;
    pendingBills.push({
      date: 'Prior / Opening',
      voucherNo: 'Opening / Prior Balance',
      amount: unallocatedBalance,
      daysOld: 180,
      bucket: 'Prior Invoices',
      _parsedDate: new Date(2000, 0, 1)
    });
  }

  // Sort oldest to newest (ascending order)
  pendingBills.sort((a, b) => a._parsedDate - b._parsedDate);

  return {
    totalOutstanding,
    b0_30,
    b31_60,
    b61_90,
    b90_180,
    b180_plus,
    pendingBills
  };
};

export const generateLedgerPDF = (ledger, options = {}) => {
  // 1. Initialize Document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Custom Styles to match Tally
  const primaryFont = 'helvetica';
  const tableFontSize = 8;
  const headerFontSize = 9;

  // Filter entries if monthsLimit specified (e.g. last 6 months)
  const allRawEntries = (ledger.entries || []).map(e => ({
    ...e,
    _parsedDate: parseEntryDate(e.date)
  }));

  let latestDateObj = new Date();
  allRawEntries.forEach(e => {
    if (e._parsedDate && e._parsedDate > latestDateObj) {
      latestDateObj = e._parsedDate;
    }
  });

  let cutoffDate = null;
  if (options.monthsLimit && typeof options.monthsLimit === 'number') {
    cutoffDate = new Date(latestDateObj);
    cutoffDate.setMonth(cutoffDate.getMonth() - options.monthsLimit);
  }

  let effectiveOpeningBalance = ledger.openingBalance || 0;
  let effectiveEntries = [];

  if (cutoffDate) {
    allRawEntries.forEach(entry => {
      if (entry._parsedDate && entry._parsedDate < cutoffDate) {
        if (entry.drCr === 'Dr') {
          effectiveOpeningBalance -= Math.abs(entry.amount);
        } else {
          effectiveOpeningBalance += Math.abs(entry.amount);
        }
      } else {
        effectiveEntries.push(entry);
      }
    });
  } else {
    effectiveEntries = allRawEntries;
  }

  // Track Totals exactly
  let totalDrAmount = 0;
  let totalCrAmount = 0;
  let currentRunningBalance = effectiveOpeningBalance;
  
  // Get date range
  const firstDate = effectiveEntries.length > 0 && effectiveEntries[0].date 
    ? effectiveEntries[0].date 
    : (cutoffDate ? formatDateStr(cutoffDate) : '1-Apr-25');
  const lastDate = effectiveEntries.length > 0 && effectiveEntries[effectiveEntries.length - 1].date 
    ? effectiveEntries[effectiveEntries.length - 1].date 
    : formatDateStr(latestDateObj);
  const dateRangeStr = `${firstDate} to ${lastDate}`;

  // 2. Build the Document Header
  const drawPage1Header = () => {
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(12);
    doc.text('M/S.SRI BRUNDABANA ENTERPRISES - (25-26)', pageWidth / 2, 40, { align: 'center' });
    
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(10);
    doc.text('NEW COLONY,KAPILAS ROAD', pageWidth / 2, 55, { align: 'center' });
    doc.text('RAYAGADA-765001', pageWidth / 2, 70, { align: 'center' });
    doc.text('TIN/CST NO-21051606485', pageWidth / 2, 85, { align: 'center' });
    
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    const tinWidth = doc.getTextWidth('TIN/CST NO-21051606485');
    doc.line((pageWidth / 2) - (tinWidth/2), 87, (pageWidth / 2) + (tinWidth/2), 87);

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(14);
    doc.text((ledger.ledgerName || 'LEDGER').toUpperCase(), pageWidth / 2, 115, { align: 'center' });
    
    doc.setFont(primaryFont, 'normal');
    doc.setFontSize(10);
    doc.text('Ledger Account', pageWidth / 2, 130, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(dateRangeStr, pageWidth / 2, 160, { align: 'center' });
  };

  const drawContinuedHeader = (data) => {
    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(9);
    doc.text('M/S.SRI BRUNDABANA ENTERPRISES - (25-26)', 40, 40);
    doc.setFont(primaryFont, 'normal');
    let titleStr = `${(ledger.ledgerName || 'LEDGER').toUpperCase()}   Ledger Account     : ${dateRangeStr}`;
    doc.text(titleStr, 40, 52);
    doc.text(`Page ${data.pageNumber}`, pageWidth - 40, 52, { align: 'right' });
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(40, 56, pageWidth - 40, 56);
  };

  const getBalanceString = (bal) => {
    const type = bal < 0 ? 'Dr' : (bal > 0 ? 'Cr' : '');
    return `${formatCurrency(Math.abs(bal))} ${type}`.trim();
  };

  // 3. Prepare Table Data
  const tableRows = [];

  // Opening Balance Row
  let obDr = '';
  let obCr = '';
  if (effectiveOpeningBalance < 0) {
     obDr = formatCurrency(effectiveOpeningBalance);
     totalDrAmount += Math.abs(effectiveOpeningBalance);
  } else if (effectiveOpeningBalance > 0) {
     obCr = formatCurrency(effectiveOpeningBalance);
     totalCrAmount += Math.abs(effectiveOpeningBalance);
  }
  
  if (effectiveOpeningBalance !== 0 || effectiveEntries.length === 0) {
    tableRows.push([
        { content: firstDate, styles: { fontStyle: 'normal' } },
        { content: 'Opening Balance', styles: { fontStyle: 'bold' } },
        '',
        '',
        { content: obDr, styles: { fontStyle: 'bold' } },
        { content: obCr, styles: { fontStyle: 'bold' } },
        { content: getBalanceString(currentRunningBalance), styles: { fontStyle: 'normal' } }
    ]);
  }

  // Entries
  effectiveEntries.forEach(entry => {
     let dr = '';
     let cr = '';
     if (entry.drCr === 'Dr') {
         dr = formatCurrency(entry.amount);
         currentRunningBalance -= Math.abs(entry.amount); 
         totalDrAmount += entry.amount;
     } else {
         cr = formatCurrency(entry.amount);
         currentRunningBalance += Math.abs(entry.amount);
         totalCrAmount += entry.amount;
     }
     tableRows.push([
         entry.date || '',
         entry.type || '',
         entry.type || '',
         entry.voucherNo?.toString() || '',
         dr,
         cr,
         getBalanceString(currentRunningBalance)
     ]);
  });

  // Calculate Balancing Closing Balance
  let cbDr = '';
  let cbCr = '';
  if (totalDrAmount > totalCrAmount) {
      const diff = totalDrAmount - totalCrAmount;
      cbCr = formatCurrency(diff);
      totalCrAmount += diff;
  } else if (totalCrAmount > totalDrAmount) {
      const diff = totalCrAmount - totalDrAmount;
      cbDr = formatCurrency(diff);
      totalDrAmount += diff;
  }

  tableRows.push([
      { content: lastDate, styles: { fontStyle: 'normal' } },
      { content: 'Closing Balance', colSpan: 3, styles: { fontStyle: 'bold', halign: 'right', cellPadding: { right: 20 } } },
      { content: cbDr, styles: { fontStyle: 'bold' } },
      { content: cbCr, styles: { fontStyle: 'bold' } },
      ''
  ]);

  // Grand Totals Push
  tableRows.push([
      '', '', '', '',
      { content: formatCurrency(totalDrAmount), styles: { fontStyle: 'bold' } },
      { content: formatCurrency(totalCrAmount), styles: { fontStyle: 'bold' } },
      ''
  ]);

  // 4. Draw Table Using AutoTable
  drawPage1Header();
  doc.text('Page 1', pageWidth - 40, 180, { align: 'right' });

  autoTable(doc, {
    startY: 185,
    head: [['Date', 'Particulars', 'Vch Type', 'Vch No.', 'Debit', 'Credit', 'Balance']],
    body: tableRows,
    theme: 'plain',
    styles: {
      font: primaryFont,
      fontSize: tableFontSize,
      cellPadding: 3,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fontStyle: 'bold',
      fontSize: headerFontSize,
      lineColor: [0, 0, 0],
      lineWidth: { top: 1, bottom: 1, left: 0, right: 0 } 
    },
    columnStyles: {
      0: { cellWidth: 55 },   
      1: { cellWidth: 140 },  
      2: { cellWidth: 70 },   
      3: { cellWidth: 60, halign: 'right' },   
      4: { cellWidth: 60, halign: 'right' },   
      5: { cellWidth: 60, halign: 'right' },   
      6: { cellWidth: 'auto', halign: 'right' } 
    },
    didDrawPage: function (data) {
      if (data.pageNumber > 1) drawContinuedHeader(data);
    },
    margin: { top: 70, left: 40, right: 40, bottom: 50 }
  });

  const finalY = doc.lastAutoTable.finalY || 0;
  if(finalY > 0) {
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.line(40, finalY, pageWidth - 40, finalY);
    doc.line(40, finalY + 2, pageWidth - 40, finalY + 2);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. CUSTOMER-CENTRIC ACCOUNT STATEMENT & INVOICE SUMMARY (ANNEXURE)
  // ═══════════════════════════════════════════════════════════════════════
  doc.addPage();

  const marginX = 36;
  const contentW = pageWidth - marginX * 2;

  const agingData = computeLedgerAgingAndBills(ledger, effectiveOpeningBalance, latestDateObj);
  const partyName = (ledger.ledgerName || 'Valued Partner').toUpperCase();
  const groupName = ledger.groupName || 'Rayagada Local';

  // 5.1 Company Header
  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text('M/S. SRI BRUNDABANA ENTERPRISES', pageWidth / 2, 38, { align: 'center' });

  doc.setFont(primaryFont, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // #475569
  doc.text('NEW COLONY, KAPILAS ROAD, RAYAGADA-765001 (ODISHA) • WHOLESALE FOOTWEAR DISTRIBUTORS', pageWidth / 2, 50, { align: 'center' });

  // 5.2 Customer-Centric Title Banner (No aggressive/audit words)
  doc.setFillColor(30, 41, 59); // #1e293b
  doc.roundedRect(marginX, 60, contentW, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(9.5);
  doc.text('STATEMENT OF ACCOUNT & PENDING INVOICE SUMMARY', pageWidth / 2, 74, { align: 'center' });

  // 5.3 Party Info Row
  let annY = 96;
  doc.setTextColor(15, 23, 42);
  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(10);
  doc.text(`Party: ${partyName}`, marginX, annY);

  doc.setTextColor(180, 83, 9); // Amber-700
  const closingStr = ledger.closingBalance < 0 
    ? `Rs. ${formatCurrency(ledger.closingBalance)} Dr` 
    : (ledger.closingBalance > 0 ? `Rs. ${formatCurrency(ledger.closingBalance)} Cr` : 'Rs. 0.00 Nil');
  doc.text(`Net Balance Due: ${closingStr}`, pageWidth - marginX, annY, { align: 'right' });

  annY += 13;
  doc.setTextColor(100, 116, 139);
  doc.setFont(primaryFont, 'normal');
  doc.setFontSize(8);
  doc.text(`Area / Line: ${groupName}`, marginX, annY);
  doc.text(`Statement Period: ${dateRangeStr}`, pageWidth - marginX, annY, { align: 'right' });

  // 5.4 Financial Metric Cards (4 Cards - No Unicode Currency Bugs)
  annY += 10;
  const cardW = (contentW - 18) / 4;
  const cardH = 36;
  const metrics = [
    { label: 'OPENING BALANCE', val: `Rs. ${formatCurrency(effectiveOpeningBalance)} ${effectiveOpeningBalance < 0 ? 'Dr' : (effectiveOpeningBalance > 0 ? 'Cr' : 'Nil')}` },
    { label: 'TOTAL INVOICES (DR)', val: `Rs. ${formatCurrency(totalDrAmount)}` },
    { label: 'TOTAL PAYMENTS (CR)', val: `Rs. ${formatCurrency(totalCrAmount)}` },
    { label: 'CLOSING BALANCE', val: closingStr }
  ];

  metrics.forEach((m, idx) => {
    const cx = marginX + idx * (cardW + 6);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(cx, annY, cardW, cardH, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.roundedRect(cx, annY, cardW, cardH, 3, 3, 'D');

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, cx + cardW / 2, annY + 12, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setTextColor(idx === 3 ? 180 : 15, idx === 3 ? 83 : 23, idx === 3 ? 9 : 42);
    doc.text(m.val, cx + cardW / 2, annY + 26, { align: 'center' });
  });

  // 5.5 Customer-Centric Invoice Tenure Badges (Polite language, NO Critical / Severe)
  annY += cardH + 8;
  const activeTenureBuckets = [];
  if (agingData.b0_30 > 0) activeTenureBuckets.push({ label: '0–30 Days (Recent)', val: `Rs. ${formatCurrency(agingData.b0_30)}` });
  if (agingData.b31_60 > 0) activeTenureBuckets.push({ label: '31–60 Days Invoices', val: `Rs. ${formatCurrency(agingData.b31_60)}` });
  if (agingData.b61_90 > 0) activeTenureBuckets.push({ label: '61–90 Days Invoices', val: `Rs. ${formatCurrency(agingData.b61_90)}` });
  if (agingData.b90_180 > 0) activeTenureBuckets.push({ label: '90–180 Days Invoices', val: `Rs. ${formatCurrency(agingData.b90_180)}` });
  if (agingData.b180_plus > 0) activeTenureBuckets.push({ label: 'Prior Balance / Older', val: `Rs. ${formatCurrency(agingData.b180_plus)}` });

  if (activeTenureBuckets.length === 0) {
    activeTenureBuckets.push({ label: 'Account Status', val: 'All Invoices Cleared / Nil Balance' });
  }

  const tBadgeW = (contentW - (activeTenureBuckets.length - 1) * 6) / activeTenureBuckets.length;
  activeTenureBuckets.forEach((b, idx) => {
    const bx = marginX + idx * (tBadgeW + 6);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(bx, annY, tBadgeW, 26, 3, 3, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.75);
    doc.roundedRect(bx, annY, tBadgeW, 26, 3, 3, 'D');

    doc.setFont(primaryFont, 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(b.label, bx + tBadgeW / 2, annY + 9.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(b.val, bx + tBadgeW / 2, annY + 19.5, { align: 'center' });
  });

  // 5.6 Detailed Outstanding Invoices Table
  annY += 34;
  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OUTSTANDING INVOICES SUMMARY (OLDEST TO RECENT)', marginX, annY);

  const billRows = (agingData.pendingBills || []).map((b, idx) => [
    `${idx + 1}`,
    b.voucherNo,
    b.date,
    formatCurrency(b.amount),
    `${b.daysOld} Days`,
    b.bucket
  ]);

  if (billRows.length === 0) {
    billRows.push(['1', 'Current Account', lastDate, '0.00', '0 Days', 'All Invoices Settled']);
  }

  autoTable(doc, {
    startY: annY + 5,
    head: [['Sl', 'Invoice / Voucher No.', 'Invoice Date', 'Unpaid Amount (Rs.)', 'Age', 'Invoice Tenure']],
    body: billRows,
    theme: 'striped',
    styles: { font: primaryFont, fontSize: 7, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 140 },
      2: { cellWidth: 70 },
      3: { cellWidth: 95, halign: 'right' },
      4: { cellWidth: 60, halign: 'center' },
      5: { cellWidth: 'auto' }
    },
    margin: { left: marginX, right: marginX, bottom: 90 }
  });

  const finalAnnTableY = doc.lastAutoTable.finalY || annY + 100;

  // 5.7 Warm Partnership & Prosperity Note (No broken emojis)
  let noteY = finalAnnTableY + 8;
  if (noteY + 70 > pageHeight - 40) {
    doc.addPage();
    noteY = 40;
  }

  const noteH = 58;
  doc.setFillColor(254, 252, 232); // #fefce8 warm gold background
  doc.roundedRect(marginX, noteY, contentW, noteH, 3, 3, 'F');
  doc.setDrawColor(254, 240, 138); // #fef08a border
  doc.setLineWidth(0.75);
  doc.roundedRect(marginX, noteY, contentW, noteH, 3, 3, 'D');

  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text('A NOTE OF APPRECIATION & PROSPERITY • SRI BRUNDABANA ENTERPRISES', marginX + 8, noteY + 12);

  doc.setFont(primaryFont, 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  const noteMsg = 'Dear Valued Business Partner, We sincerely appreciate and cherish our enduring partnership with you. At Sri Brundabana Enterprises, Rayagada, your retail prosperity and business growth are at the core of our business. We constantly strive to provide you with the freshest footwear collections at the lowest wholesale prices.\n\nTimely settlement of outstanding invoices ensures smooth credit cycles, immediate dispatches, and priority allocation of high-demand articles. We wish you and your enterprise boundless success, soaring sales, and continued prosperity ahead!';
  doc.text(doc.splitTextToSize(noteMsg, contentW - 16), marginX + 8, noteY + 23);

  // 5.8 Authorised Signatory Footer (Stacked cleanly with zero collision)
  const footerY = noteY + noteH + 10;
  doc.setFont(primaryFont, 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Please review the statement above and kindly arrange for invoice settlement at your convenience.', marginX, footerY + 8);

  doc.setFont(primaryFont, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('For M/S. SRI BRUNDABANA ENTERPRISES', pageWidth - marginX, footerY, { align: 'right' });
  doc.setFont(primaryFont, 'normal');
  doc.setFontSize(7);
  doc.text('Authorised Signatory / Accounts Desk • Rayagada, Odisha', pageWidth - marginX, footerY + 10, { align: 'right' });

  // 6. Page Numbers & Continuation Markers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
     doc.setPage(i);
     if (i < pageCount) {
         doc.setFont(primaryFont, 'normal');
         doc.setFontSize(8);
         doc.setTextColor(100, 116, 139);
         doc.text('continued ...', pageWidth - 40, doc.internal.pageSize.height - 20, { align: 'right' });
     }
  }

  if (options.returnBase64) {
    return doc.output('datauristring');
  }

  if (options.returnBlob) {
    return doc.output('blob');
  }

  const safeName = ledger.ledgerName ? ledger.ledgerName.replace(/[^a-zA-Z0-9]/g, '_') : 'Ledger';
  doc.save(`${safeName}-${firstDate}-to-${lastDate}.pdf`);
};

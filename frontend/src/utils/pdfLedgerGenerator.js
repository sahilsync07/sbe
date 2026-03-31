import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to format currency with commas (INR style)
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Math.abs(amount));
};

export const generateLedgerPDF = (ledger) => {
  // 1. Initialize Document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  
  // Custom Styles to match Tally
  const primaryFont = 'helvetica';
  const tableFontSize = 8;
  const headerFontSize = 9;

  // Track Totals exactly
  let totalDrAmount = 0;
  let totalCrAmount = 0;
  let currentRunningBalance = ledger.openingBalance || 0; 
  
  // Get date range
  const firstDate = ledger.entries?.length > 0 ? ledger.entries[0].date : '1-Apr-25';
  const lastDate = ledger.entries?.length > 0 ? ledger.entries[ledger.entries.length - 1].date : '31-Mar-26';
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
    doc.text(ledger.ledgerName.toUpperCase(), pageWidth / 2, 115, { align: 'center' });
    
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
    let titleStr = `${ledger.ledgerName.toUpperCase()}   Ledger Account     : ${dateRangeStr}`;
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
  if (ledger.openingBalance < 0) {
     obDr = formatCurrency(ledger.openingBalance);
     totalDrAmount += Math.abs(ledger.openingBalance);
  } else if (ledger.openingBalance > 0) {
     obCr = formatCurrency(ledger.openingBalance);
     totalCrAmount += Math.abs(ledger.openingBalance);
  }
  
  if (ledger.openingBalance !== 0) {
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
  const entries = ledger.entries || [];
  entries.forEach(entry => {
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
         entry.type,
         entry.type,
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

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
     doc.setPage(i);
     if (i < pageCount) {
         doc.text('continued ...', pageWidth - 40, doc.internal.pageSize.height - 20, { align: 'right' });
     }
  }

  const safeName = ledger.ledgerName ? ledger.ledgerName.replace(/[^a-zA-Z0-9]/g, '_') : 'Ledger';
  doc.save(`${safeName}-${firstDate}-to-${lastDate}.pdf`);
};

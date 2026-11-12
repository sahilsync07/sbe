import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robotoRegularBase64, robotoBoldBase64 } from './fonts.js';

/**
 * Parses a ledger date string (e.g., "25-Apr-26") into a Date object.
 */
export const parseLedgerDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const yearStr = parts[2];
  
  const months = {Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11};
  let year = parseInt(yearStr, 10);
  if (year < 100) year += 2000;
  
  return new Date(year, months[monthStr] !== undefined ? months[monthStr] : 0, day);
};

/**
 * Formats a lastSync timestamp from ledger-data.json into a human-readable string.
 * e.g., "2026-11-03T14:47:05.064Z" -> "03-Nov-2026, 08:17 PM"
 */
export const formatLedgerLastUpdated = (lastSync) => {
  if (!lastSync) return '';
  const d = new Date(lastSync);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  return `${day}-${month}-${year}, ${timeStr}`;
};

/**
 * Generates standardized filename based on selected lines, date range, and style.
 * e.g., "LineList_Detailed_ANDRA_LINE_PARVATHIPURAM_01Apr2026_to_31Oct2026.pdf"
 */
export const getLineListFileName = (selectedLines, fromDate, toDate, style = 'classic', isAll = false) => {
  // 1. Line Part
  let linePart = 'All_Lines';
  if (Array.isArray(selectedLines) && selectedLines.length > 0 && !isAll) {
    if (selectedLines.length === 1) {
      linePart = selectedLines[0]
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    } else if (selectedLines.length <= 3) {
      linePart = selectedLines
        .map(l => l.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, ''))
        .join('_');
    } else {
      linePart = `${selectedLines.length}_Lines`;
    }
  }

  // 2. Date Range Part
  const fmtDate = (d) => {
    if (!d || isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}${month}${year}`;
  };

  let datePart = 'All_Time';
  if (fromDate && toDate) {
    datePart = `${fmtDate(fromDate)}_to_${fmtDate(toDate)}`;
  } else if (fromDate) {
    datePart = `From_${fmtDate(fromDate)}`;
  } else if (toDate) {
    datePart = `UpTo_${fmtDate(toDate)}`;
  }

  const stylePrefix = style === 'extra_detailed' ? 'ExtraDetailed_' : (style === 'detailed' ? 'Detailed_' : '');
  return `LineList_${stylePrefix}${linePart}_${datePart}.pdf`;
};

/**
 * Converts a string to Title Case (Camel Casing for display).
 * e.g., "ABDUL HAZI (PALAK BEGAM)" → "Abdul Hazi (Palak Begam)"
 */
const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(?:^|\s|\(|\/|-)\S/g, (match) => match.toUpperCase());
};


/**
 * Parses a party name string. Text before comma = name, text after comma = city.
 * e.g., "HARI F/W, B.CUTTACK" → { name: "Hari F/W", city: "B.Cuttack" }
 */
const parsePartyName = (raw) => {
  if (!raw) return { name: '', city: '' };
  const commaIndex = raw.indexOf(',');
  if (commaIndex === -1) return { name: toTitleCase(raw.trim()), city: '' };
  return {
    name: toTitleCase(raw.substring(0, commaIndex).trim()),
    city: toTitleCase(raw.substring(commaIndex + 1).trim())
  };
};

/**
 * Format a currency value for PDF display.
 */
const fmtINR = (val) => {
  if (Math.abs(val) < 0.5) return "-";
  return `\u20B9 ${Math.round(Math.abs(val)).toLocaleString('en-IN')}`;
};

const formatBalance = (val) => {
  if (Math.abs(val) < 0.5) return "-";
  const amt = Math.round(Math.abs(val));
  // val < 0 is Debit (they owe us), so positive. val > 0 is Credit (we owe them), so negative.
  return val < 0 ? `\u20B9 ${amt}` : `-\u20B9 ${amt}`;
};

/**
 * Generates Line List PDF.
 * 
 * @param {string[]} selectedLines - Array of line/group names to include.
 * @param {Date|null} fromDate - Start date filter (inclusive).
 * @param {Date|null} toDate - End date filter (inclusive).
 * @param {Array} ledgerData - Full ledger data array.
 * @param {Object} options
 * @param {boolean} options.returnBase64 - Return as data URI string.
 * @param {boolean} options.returnBlob - Return as Blob.
 * @param {'classic'|'detailed'|'extra_detailed'} options.style - 'classic' = combined totals, 'detailed' = itemized bills/payments, 'extra_detailed' = itemized opening bills (FIFO) + bad debts sorted last.
 */
export const generateLineListPDF = (selectedLines, fromDate, toDate, ledgerData, options = {}) => {
  const style = options.style || 'classic';
  const isItemized = style === 'detailed' || style === 'extra_detailed';
  const isExtraDetailed = style === 'extra_detailed';

  // Read any staged (not-yet-committed) Party Tagger statuses so bad debt marks apply immediately
  let stagedTags = options.stagedPartyTags || null;
  if (!stagedTags && typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('sbe_staged_party_tags');
      if (raw) stagedTags = JSON.parse(raw);
    } catch (e) {
      stagedTags = null;
    }
  }

  return new Promise((resolve) => {
    try {
      const periodData = [];

      // Ensure dates have no time components for strict comparison
      if (fromDate) fromDate.setHours(0, 0, 0, 0);
      if (toDate) toDate.setHours(23, 59, 59, 999); // End of day

      for (const line of selectedLines) {
        const group = ledgerData.find(g => g.groupName === line);
        if (!group) continue;

        for (const ledger of group.ledgers) {
          let openingBalanceRaw = ledger.openingBalance || 0;
          let periodCr = 0;
          let periodDr = 0;

          // Collect pre-period bills (Dr before fromDate) for Extra Detailed FIFO opening breakdown
          const preDrEntries = [];
          // Collect individual bills (Dr) and payments (Cr) within the date range
          const billEntries = [];   // individual Dr entries in range
          const paymentEntries = []; // individual Cr entries in range

          for (let idx = 0; idx < (ledger.entries || []).length; idx++) {
            const entry = ledger.entries[idx];
            const entryDate = parseLedgerDate(entry.date);
            entryDate.setHours(0, 0, 0, 0);

            if (fromDate && entryDate < fromDate) {
              // Adjust opening balance for transactions prior to 'from date'
              if (entry.drCr === 'Dr') {
                openingBalanceRaw -= entry.amount;
                preDrEntries.push({
                  date: entry.date,
                  voucherNo: entry.voucherNo || '',
                  type: entry.type || 'Invoice',
                  amount: entry.amount || 0,
                  _parsedDate: entryDate,
                  _idx: idx
                });
              } else if (entry.drCr === 'Cr') {
                openingBalanceRaw += entry.amount;
              }
            } else if ((!fromDate || entryDate >= fromDate) && (!toDate || entryDate <= toDate)) {
              // Transactions within the period
              if (entry.drCr === 'Dr') {
                periodDr += entry.amount;
                billEntries.push({
                  date: entry.date,
                  voucherNo: entry.voucherNo || '',
                  type: entry.type || 'Invoice',
                  amount: entry.amount
                });
              } else if (entry.drCr === 'Cr') {
                periodCr += entry.amount;
                paymentEntries.push({
                  date: entry.date,
                  voucherNo: entry.voucherNo || '',
                  type: entry.type || 'Payment',
                  amount: entry.amount
                });
              }
            }
          }

          // Closing Balance for period
          const closingBalanceRaw = openingBalanceRaw - periodDr + periodCr;

          // Skip if zero opening balance and no activity
          if (Math.abs(openingBalanceRaw) < 0.01 && periodDr === 0 && periodCr === 0 && Math.abs(closingBalanceRaw) < 0.01) {
            continue;
          }

          // FIFO allocation for Extra Detailed Opening Balance: only unpaid/partially paid bills adding up to openingDebt
          const openingDebt = openingBalanceRaw < 0 ? Math.abs(openingBalanceRaw) : 0;
          const openingBills = [];
          if (isExtraDetailed && openingDebt >= 0.5 && preDrEntries.length > 0) {
            // Walk newest pre-period bills backward until full openingDebt is accounted for
            const sortedPre = [...preDrEntries].sort((a, b) => (b._parsedDate - a._parsedDate) || (b._idx - a._idx));
            let remaining = openingDebt;
            for (const inv of sortedPre) {
              if (remaining < 0.5) break;
              const invAmt = inv.amount || 0;
              if (invAmt < 0.5) continue;
              const pendingAmt = Math.min(remaining, invAmt);
              openingBills.push({
                date: inv.date,
                type: inv.type,
                amount: pendingAmt,
                fullAmount: invAmt,
                isPartial: pendingAmt < invAmt - 0.5,
                isPrior: false
              });
              remaining -= pendingAmt;
            }
            if (remaining >= 0.5) {
              openingBills.push({
                date: 'Prior Bal',
                type: 'Prior',
                amount: remaining,
                fullAmount: remaining,
                isPartial: false,
                isPrior: true
              });
            }
            openingBills.reverse(); // Display chronologically (oldest to newest)
          }

          const ledgerKey = (ledger.ledgerName || '').trim().toLowerCase();
          const effCreditStatus = stagedTags?.[ledgerKey]?.creditStatus ?? ledger.creditStatus ?? 'normal';
          const isBadDebt = effCreditStatus === 'bad_debt';

          periodData.push({
            partyName: ledger.ledgerName,
            lineName: line,
            opening: formatBalance(openingBalanceRaw),
            credit: periodCr >= 0.5 ? `\u20B9 ${Math.round(periodCr)}` : "-",
            debit: periodDr >= 0.5 ? `\u20B9 ${Math.round(periodDr)}` : "-",
            closing: formatBalance(closingBalanceRaw),
            // Detailed / Extra Detailed mode data
            billEntries,
            paymentEntries,
            periodDr,
            periodCr,
            openingBills,
            openingDebt,
            isBadDebt
          });
        }
      }

      // Sort alphabetically by party name; in Extra Detailed mode, push Bad Debt parties to the end
      periodData.sort((a, b) => {
        if (isExtraDetailed && a.isBadDebt !== b.isBadDebt) {
          return a.isBadDebt ? 1 : -1;
        }
        return a.partyName.localeCompare(b.partyName);
      });

      // Build PDF
      const doc = new jsPDF('p', 'pt', 'a4');
      
      doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

      const pw = doc.internal.pageSize.getWidth();
      const mL = 40, mR = 40;

      // ── Meta line: Multi-tier layout with Last Updated timestamp ──
      // Extract last updated date from options or ledgerData metadata (_META_DATA_)
      let lastUpdatedDate = null;
      if (options.lastUpdated) {
        lastUpdatedDate = new Date(options.lastUpdated);
      } else if (Array.isArray(ledgerData)) {
        const meta = ledgerData.find(g => g && (g.groupName === '_META_DATA_' || g.group === '_META_DATA_'));
        if (meta && meta.lastSync) {
          lastUpdatedDate = new Date(meta.lastSync);
        }
      }
      const lastUpdatedText = lastUpdatedDate ? formatLedgerLastUpdated(lastUpdatedDate) : '';

      let lineText = selectedLines.join("  \u2022  ");
      if (lineText.length > 55) lineText = lineText.substring(0, 52) + "...";

      let dateText = "All Time";
      if (fromDate && toDate) {
          dateText = `${fromDate.toLocaleDateString('en-IN')} to ${toDate.toLocaleDateString('en-IN')}`;
      } else if (fromDate) {
          dateText = `From ${fromDate.toLocaleDateString('en-IN')}`;
      } else if (toDate) {
          dateText = `Until ${toDate.toLocaleDateString('en-IN')}`;
      }

      // Tier 1: Centered company name (prominent, executive)
      doc.setFont("Roboto", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Sri Brundabana Enterprises, Rayagada.", pw / 2, 17, { align: "center" });

      // Tier 2: Last Updated timestamp from ledger-data.json
      if (lastUpdatedText) {
        doc.setFont("Roboto", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text(`Last Updated on: ${lastUpdatedText}`, pw / 2, 26, { align: "center" });
      }

      // Tier 3: Line name (left) & Period (right)
      doc.setFont("Roboto", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(`Line: ${lineText}`, mL, 37);
      doc.text(`Period: ${dateText}`, pw - mR, 37, { align: "right" });

      // Thin crisp hairline separator
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.5);
      doc.line(mL, 41, pw - mR, 41);

      const tableStartY = 45;

      // ── Table ─────────────────────────────────────────────
      const tableColumns = [
        { header: "Party Name", dataKey: "partyName" },
        { header: "Old\nBalance", dataKey: "opening" },
        { header: "Bills\n(Dr)", dataKey: "debit" },
        { header: "Payments\n(Cr)", dataKey: "credit" },
        { header: "Current\nBalance", dataKey: "closing" },
        { header: "Cash", dataKey: "cash" },
        { header: "UPI", dataKey: "upi" }
      ];

      // Helpers for entry classification and clean dates (B&W print friendly)
      const cleanDateStr = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.replace(/-\d{2,4}$/, ''); // Strip year (e.g. 17-Oct-26 -> 17-Oct)
      };

      const isCreditNote = (entry) => {
        const t = (entry.type || '').toLowerCase();
        return t.includes('credit') || t.includes('cr note') || t.includes('c/n');
      };

      const isDebitNote = (entry) => {
        const t = (entry.type || '').toLowerCase();
        return t.includes('debit') || t.includes('dr note') || t.includes('d/n');
      };

      const isJournal = (entry) => {
        const t = (entry.type || '').toLowerCase();
        return t.includes('journal') || t.includes('jrn');
      };

      const tableRows = periodData.map(d => {
        const parsed = parsePartyName(d.partyName);

        // For detailed / extra_detailed modes, build multi-line cell content
        let openingCell = d.opening;
        let debitCell = d.debit;
        let creditCell = d.credit;

        if (isExtraDetailed && d.openingBills.length > 0) {
          const formatOpeningBillLine = (b) => {
            if (b.isPrior) {
              return `Prior Bal: \u20B9${Math.round(b.amount).toLocaleString('en-IN')}`;
            }
            const tag = isDebitNote(b) ? '[DN] ' : '';
            const star = b.isPartial ? '*' : '';
            const dStr = cleanDateStr(b.date) || b.type;
            return `${tag}${dStr}${star}: \u20B9${Math.round(b.amount).toLocaleString('en-IN')}`;
          };

          if (d.openingBills.length === 1) {
            openingCell = formatOpeningBillLine(d.openingBills[0]);
          } else {
            const lines = d.openingBills.map(formatOpeningBillLine);
            // Reserve space for bold total rendered in didDrawCell
            lines.push('');
            openingCell = lines.join('\n');
          }
        }

        if (isItemized) {
          // Bills column: list each bill individually (Total drawn cleanly via didDrawCell)
          if (d.billEntries.length > 0) {
            if (d.billEntries.length === 1) {
              const b = d.billEntries[0];
              const tag = isDebitNote(b) ? '[DN] ' : '';
              const dStr = cleanDateStr(b.date);
              debitCell = dStr ? `${tag}${dStr}: \u20B9${Math.round(b.amount).toLocaleString('en-IN')}` : `\u20B9 ${Math.round(d.periodDr).toLocaleString('en-IN')}`;
            } else {
              const lines = d.billEntries.map(b => {
                const tag = isDebitNote(b) ? '[DN] ' : '';
                const dStr = cleanDateStr(b.date) || b.type;
                return `${tag}${dStr}: \u20B9${Math.round(b.amount).toLocaleString('en-IN')}`;
              });
              // Append blank line to reserve height for bold total rendered in didDrawCell
              lines.push('');
              debitCell = lines.join('\n');
            }
          }

          // Payments column: distinguish Credit Notes [CN] from payments in B&W print
          if (d.paymentEntries.length > 0) {
            if (d.paymentEntries.length === 1) {
              const p = d.paymentEntries[0];
              const dStr = cleanDateStr(p.date);
              if (isCreditNote(p)) {
                // If single transaction is a Credit Note, explicitly tag it so it's not mistaken for payment
                creditCell = dStr ? `[CN] ${dStr}: \u20B9${Math.round(p.amount).toLocaleString('en-IN')}` : `[CN] \u20B9${Math.round(p.amount).toLocaleString('en-IN')}`;
              } else {
                creditCell = dStr ? `${dStr}: \u20B9${Math.round(p.amount).toLocaleString('en-IN')}` : `\u20B9 ${Math.round(d.periodCr).toLocaleString('en-IN')}`;
              }
            } else {
              const lines = d.paymentEntries.map(p => {
                const tag = isCreditNote(p) ? '[CN] ' : (isJournal(p) ? '[JRN] ' : '');
                const dStr = cleanDateStr(p.date) || p.type;
                return `${tag}${dStr}: \u20B9${Math.round(p.amount).toLocaleString('en-IN')}`;
              });
              // Append blank line to reserve height for bold total rendered in didDrawCell
              lines.push('');
              creditCell = lines.join('\n');
            }
          }
        }

        return {
          ...d,
          partyName: parsed.name,
          _city: parsed.city,
          opening: openingCell,
          debit: debitCell,
          credit: creditCell,
          cash: "",
          upi: "",
          _openingBillCount: d.openingBills.length,
          _openingDebt: d.openingDebt,
          _billCount: d.billEntries.length,
          _paymentCount: d.paymentEntries.length,
          _periodDr: d.periodDr,
          _periodCr: d.periodCr
        };
      });

      const drawCellTotal = (data, totalAmount) => {
        const totalText = `Total: \u20B9${Math.round(totalAmount).toLocaleString('en-IN')}`;
        const sepY = data.cell.y + data.cell.height - 9.5;
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.4);
        doc.line(data.cell.x + 2, sepY, data.cell.x + data.cell.width - 2, sepY);
        doc.setFont("Roboto", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(0, 0, 0);
        doc.text(
          totalText,
          data.cell.x + data.cell.width - 2.5,
          data.cell.y + data.cell.height - 2.5,
          { align: "right" }
        );
      };

      autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: tableStartY,
        rowPageBreak: 'avoid',
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 },
          valign: 'middle',
          font: 'Roboto',
          textColor: [0, 0, 0],
          lineColor: [120, 120, 120],
          lineWidth: 0.4
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8,
          cellPadding: { top: 2, right: 2.5, bottom: 2, left: 2.5 }
        },
        columnStyles: {
          partyName: { cellWidth: isExtraDetailed ? 148 : (isItemized ? 154 : 168), fontStyle: 'bold', textColor: [0, 0, 0], fontSize: 8.5 },
          opening: { halign: 'right', cellWidth: isExtraDetailed ? 64 : (isItemized ? 48 : 49.5) },
          debit: { halign: 'right', cellWidth: isItemized ? 64 : 40.5, fontSize: isItemized ? 6 : 8, valign: 'top' },
          credit: { halign: 'right', cellWidth: isExtraDetailed ? 66 : (isItemized ? 68 : 45), fontSize: isItemized ? 6 : 8, valign: 'top' },
          closing: { halign: 'right', cellWidth: isItemized ? 52 : 54, fontStyle: 'bold', textColor: [0, 0, 0] },
          cash: { cellWidth: isExtraDetailed ? 59 : (isItemized ? 63 : 79) },
          upi: { cellWidth: isExtraDetailed ? 59 : (isItemized ? 63 : 79) }
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        margin: { left: mL, right: mR },
        didParseCell: function (data) {
          if (data.section === 'head') {
              if (['opening', 'debit', 'credit', 'closing'].includes(data.column.dataKey)) {
                 data.cell.styles.fontSize = 8;
                 data.cell.styles.cellPadding = { top: 2, right: 2.5, bottom: 2, left: 2.5 };
              }
          }
          if (data.section === 'body' && data.column.dataKey === 'partyName') {
            const rowData = tableRows[data.row.index];
            if (rowData && (rowData._city || (isExtraDetailed && rowData.isBadDebt))) {
              // Extra space at bottom of cell for city and/or bad debt tag sub-line
              data.cell.styles.cellPadding = { top: 2, right: 2.5, bottom: 8, left: 2.5 };
            }
          }
          if (isItemized && data.section === 'body') {
            const rowData = tableRows[data.row.index];
            if (isExtraDetailed && data.column.dataKey === 'opening') {
              if (rowData && rowData._openingBillCount > 0) {
                data.cell.styles.fontSize = 6;
                data.cell.styles.valign = 'top';
              } else {
                data.cell.styles.fontSize = 8;
                data.cell.styles.valign = 'middle';
              }
              data.cell.styles.textColor = [0, 0, 0];
            }
            if (data.column.dataKey === 'debit' || data.column.dataKey === 'credit') {
              data.cell.styles.valign = 'top';
              data.cell.styles.textColor = [0, 0, 0]; // Pure black for B&W printing
            }
          }
        },
        didDrawCell: function (data) {
          // Custom render for multi-line headers
          if (data.section === 'head') {
             const key = data.column.dataKey;
             if (['opening', 'debit', 'credit', 'closing'].includes(key)) {
                // Clear the cell background
                doc.setFillColor(230, 230, 230);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                
                // Draw crisp border
                doc.setDrawColor(120, 120, 120);
                doc.setLineWidth(0.4);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'S');

                const textX = data.cell.x + (data.cell.width / 2);
                const textYBase = data.cell.y + (data.cell.height / 2);
                
                doc.setTextColor(0, 0, 0);
                doc.setFont("Roboto", "bold");
                
                let line1 = "";
                let line2 = "";
                
                if (key === 'opening') { line1 = "Old"; line2 = "Balance"; }
                if (key === 'debit') { line1 = "Bills"; line2 = "(Dr)"; }
                if (key === 'credit') { line1 = "Payments"; line2 = "(Cr)"; }
                if (key === 'closing') { line1 = "Current"; line2 = "Balance"; }
                
                // Draw line 1 (Big)
                doc.setFontSize(8.5);
                doc.text(line1, textX, textYBase - 1, { align: "center", baseline: "middle" });
                
                // Draw line 2 (Small)
                doc.setFontSize(6.5);
                doc.text(line2, textX, textYBase + 6, { align: "center", baseline: "middle" });
             }
          }

          // In detailed / extra_detailed modes, render the bold total line at bottom of itemized cells
          if (isItemized && data.section === 'body') {
            const rowData = tableRows[data.row.index];
            if (!rowData) return;

            // Only draw total if cell has the reserved empty slot at the end (safeguard against partial split cells)
            const hasReservedSlot = Array.isArray(data.cell.text) && data.cell.text[data.cell.text.length - 1] === '';

            if (isExtraDetailed && data.column.dataKey === 'opening' && rowData._openingBillCount > 1 && hasReservedSlot) {
              drawCellTotal(data, rowData._openingDebt);
            }

            if (data.column.dataKey === 'debit' && rowData._billCount > 1 && hasReservedSlot) {
              drawCellTotal(data, rowData._periodDr);
            }

            if (data.column.dataKey === 'credit' && rowData._paymentCount > 1 && hasReservedSlot) {
              drawCellTotal(data, rowData._periodCr);
            }
          }

          if (data.section === 'body' && data.column.dataKey === 'partyName') {
            const rowData = tableRows[data.row.index];
            if (rowData && (rowData._city || (isExtraDetailed && rowData.isBadDebt))) {
              const subParts = [];
              if (rowData._city) subParts.push(rowData._city);
              if (isExtraDetailed && rowData.isBadDebt) subParts.push('[BAD DEBT]');
              doc.setFont('Roboto', 'normal');
              doc.setFontSize(6);
              doc.setTextColor(80, 80, 80);
              doc.text(
                subParts.join('  •  '),
                data.cell.x + 2.5,
                data.cell.y + data.cell.height - 2.5
              );
              // Restore
              doc.setFont('Roboto', 'bold');
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
            }
          }
        },
        didDrawPage: function (data) {
          // Footer: page number right, company stamp + last updated left
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFontSize(6.5);
          doc.setTextColor(140, 140, 140);
          const updatedStamp = lastUpdatedText ? ` • Updated: ${lastUpdatedText}` : '';
          doc.text(`Sri Brundabana Enterprises${updatedStamp}`, mL, pageH - 14);
          const styleLabel = isExtraDetailed
            ? ' • Extra Detailed (*Partial Pending)'
            : (style === 'detailed' ? ' • Detailed' : '');
          doc.text("Page " + doc.internal.getNumberOfPages() + styleLabel, pw - mR, pageH - 14, { align: "right" });
        }
      });

      if (options.returnBase64) {
        resolve(doc.output('datauristring'));
        return;
      }
      if (options.returnBlob) {
        resolve(doc.output('blob'));
        return;
      }

      const fileName = options.fileName || getLineListFileName(selectedLines, fromDate, toDate, style);
      doc.save(fileName);
      resolve(true);
    } catch (e) {
      console.error("PDF Gen Error:", e);
      resolve(false);
    }
  });
};

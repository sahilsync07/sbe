import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { robotoRegularBase64, robotoBoldBase64 } from './fonts';

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
 * @param {'classic'|'detailed'} options.style - 'classic' = combined totals (old), 'detailed' = itemized bills/payments (new).
 */
export const generateLineListPDF = (selectedLines, fromDate, toDate, ledgerData, options = {}) => {
  const style = options.style || 'classic';

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

          // Collect individual bills (Dr) and payments (Cr) within the date range
          const billEntries = [];   // individual Dr entries in range
          const paymentEntries = []; // individual Cr entries in range

          for (const entry of ledger.entries) {
            const entryDate = parseLedgerDate(entry.date);
            entryDate.setHours(0, 0, 0, 0);

            if (fromDate && entryDate < fromDate) {
              // Adjust opening balance for transactions prior to 'from date'
              if (entry.drCr === 'Dr') {
                openingBalanceRaw -= entry.amount;
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

          periodData.push({
            partyName: ledger.ledgerName,
            lineName: line,
            opening: formatBalance(openingBalanceRaw),
            credit: periodCr >= 0.5 ? `\u20B9 ${Math.round(periodCr)}` : "-",
            debit: periodDr >= 0.5 ? `\u20B9 ${Math.round(periodDr)}` : "-",
            closing: formatBalance(closingBalanceRaw),
            // Detailed mode data
            billEntries,
            paymentEntries,
            periodDr,
            periodCr
          });
        }
      }

      // Sort alphabetically by party name
      periodData.sort((a, b) => a.partyName.localeCompare(b.partyName));

      // Build PDF
      const doc = new jsPDF('p', 'pt', 'a4');
      
      doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
      doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

      const pw = doc.internal.pageSize.getWidth();
      const mL = 40, mR = 40;

      // ── Meta line: Line Name • Company • Date (single compact row, no big title) ──
      let lineText = selectedLines.join("  \u2022  ");
      if (lineText.length > 40) lineText = lineText.substring(0, 37) + "...";

      let dateText = "All Time";
      if (fromDate && toDate) {
          dateText = `${fromDate.toLocaleDateString('en-IN')} to ${toDate.toLocaleDateString('en-IN')}`;
      } else if (fromDate) {
          dateText = `From ${fromDate.toLocaleDateString('en-IN')}`;
      } else if (toDate) {
          dateText = `Until ${toDate.toLocaleDateString('en-IN')}`;
      }

      const metaY = 24;

      // Line name – bold and prominent
      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(lineText, mL, metaY);

      // Company name – centered, same style
      doc.setFont("Roboto", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Sri Brundabana Enterprises, Rayagada.", pw / 2, metaY, { align: "center" });

      // Date – bold, right-aligned
      doc.setFont("Roboto", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(dateText, pw - mR, metaY, { align: "right" });

      // Thin hairline separator
      doc.setDrawColor(160, 160, 160);
      doc.setLineWidth(0.5);
      doc.line(mL, metaY + 5, pw - mR, metaY + 5);

      const tableStartY = metaY + 10;

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

      const tableRows = periodData.map(d => {
        const parsed = parsePartyName(d.partyName);

        // For detailed mode, build multi-line cell content for bills and payments
        let debitCell = d.debit;
        let creditCell = d.credit;

        if (style === 'detailed') {
          // Bills column: list each bill individually (Total drawn separately via didDrawCell)
          if (d.billEntries.length > 0) {
            const lines = d.billEntries.map(b => {
              const label = b.date || b.type;
              return `\u25B8 ${label}:  \u20B9${Math.round(b.amount).toLocaleString('en-IN')}`;
            });
            if (d.billEntries.length === 1) {
              // Single bill — just show the amount cleanly, no total needed
              debitCell = `\u20B9 ${Math.round(d.periodDr).toLocaleString('en-IN')}`;
            } else {
              // Multiple bills — list each, total drawn by didDrawCell
              debitCell = lines.join('\n');
            }
          }

          // Payments column: list each payment individually (Total drawn separately via didDrawCell)
          if (d.paymentEntries.length > 0) {
            const lines = d.paymentEntries.map(p => {
              const label = p.date || p.type;
              return `\u25C2 ${label}:  \u20B9${Math.round(p.amount).toLocaleString('en-IN')}`;
            });
            if (d.paymentEntries.length === 1) {
              // Single payment — just show the amount cleanly
              creditCell = `\u20B9 ${Math.round(d.periodCr).toLocaleString('en-IN')}`;
            } else {
              // Multiple payments — list each, total drawn by didDrawCell
              creditCell = lines.join('\n');
            }
          }
        }

        return {
          ...d,
          partyName: parsed.name,
          _city: parsed.city,
          debit: debitCell,
          credit: creditCell,
          cash: "",
          upi: "",
          _billCount: d.billEntries.length,
          _paymentCount: d.paymentEntries.length,
          _periodDr: d.periodDr,
          _periodCr: d.periodCr
        };
      });

      autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: tableStartY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: { top: 1.5, right: 3, bottom: 1.5, left: 3 },
          valign: 'middle',
          font: 'Roboto',
          textColor: [0, 0, 0],
          lineColor: [190, 190, 190],
          lineWidth: 0.4
        },
        headStyles: {
          fillColor: [225, 225, 225],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8,
          cellPadding: { top: 2, right: 3, bottom: 2, left: 3 }
        },
        columnStyles: {
          partyName: { cellWidth: 168, fontStyle: 'bold', textColor: [0, 0, 0], fontSize: 8.5 },
          opening: { halign: 'right', cellWidth: 49.5 },
          debit: { halign: 'right', cellWidth: style === 'detailed' ? 56 : 40.5, fontSize: style === 'detailed' ? 6.5 : 8, valign: 'top' },
          credit: { halign: 'right', cellWidth: style === 'detailed' ? 60 : 45, fontSize: style === 'detailed' ? 6.5 : 8, valign: 'top' },
          closing: { halign: 'right', cellWidth: 54, fontStyle: 'bold', textColor: [0, 0, 0] },
          cash: { cellWidth: style === 'detailed' ? 63 : 79 },
          upi: { cellWidth: style === 'detailed' ? 63 : 79 }
        },
        alternateRowStyles: {
          fillColor: [232, 232, 232]
        },
        margin: { left: mL, right: mR },
        didParseCell: function (data) {
          if (data.section === 'head') {
             // Multi-line header styles
              if (data.column.dataKey === 'opening' || data.column.dataKey === 'debit' || data.column.dataKey === 'credit' || data.column.dataKey === 'closing') {
                 data.cell.styles.fontSize = 8;
                 data.cell.styles.cellPadding = { top: 2, right: 3, bottom: 2, left: 3 };
              }
          }
          if (data.section === 'body' && data.column.dataKey === 'partyName') {
            const rowData = tableRows[data.row.index];
            if (rowData && rowData._city) {
              // Minimal extra room for the city sub-line
              data.cell.styles.cellPadding = { top: 1.5, right: 3, bottom: 7, left: 3 };
            }
          }
          // In detailed mode, bills/payments cells need generous bottom padding for bold total line
          if (style === 'detailed' && data.section === 'body') {
            const rowData = tableRows[data.row.index];
            if (data.column.dataKey === 'debit') {
              data.cell.styles.valign = 'top';
              data.cell.styles.textColor = [30, 30, 30];
              if (rowData && rowData._billCount > 1) {
                // Extra bottom space reserved for the bold total drawn by didDrawCell
                data.cell.styles.cellPadding = { top: 3, right: 3, bottom: 14, left: 3 };
              } else {
                data.cell.styles.cellPadding = { top: 3, right: 3, bottom: 3, left: 3 };
              }
            }
            if (data.column.dataKey === 'credit') {
              data.cell.styles.valign = 'top';
              data.cell.styles.textColor = [0, 100, 0]; // Dark green for payments to distinguish from bills
              if (rowData && rowData._paymentCount > 1) {
                // Extra bottom space reserved for the bold total drawn by didDrawCell
                data.cell.styles.cellPadding = { top: 3, right: 3, bottom: 14, left: 3 };
              } else {
                data.cell.styles.cellPadding = { top: 3, right: 3, bottom: 3, left: 3 };
              }
            }
          }
        },
        didDrawCell: function (data) {
          // Custom render for multi-line headers
          if (data.section === 'head') {
             const key = data.column.dataKey;
             if (['opening', 'debit', 'credit', 'closing'].includes(key)) {
                // Clear the cell background
                doc.setFillColor(225, 225, 225);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                
                // Draw borders
                doc.setDrawColor(190, 190, 190);
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

          // In detailed mode, render the total line in bold at the bottom of bills/payments cells
          if (style === 'detailed' && data.section === 'body') {
            const rowData = tableRows[data.row.index];
            if (!rowData) return;

            if (data.column.dataKey === 'debit' && rowData._billCount > 1) {
              const totalText = `Total: \u20B9${Math.round(rowData._periodDr).toLocaleString('en-IN')}`;
              // Thin separator line above total
              const sepY = data.cell.y + data.cell.height - 13;
              doc.setDrawColor(160, 160, 160);
              doc.setLineWidth(0.3);
              doc.line(data.cell.x + 3, sepY, data.cell.x + data.cell.width - 3, sepY);
              // Bold total text
              doc.setFont("Roboto", "bold");
              doc.setFontSize(7.5);
              doc.setTextColor(0, 0, 0);
              doc.text(
                totalText,
                data.cell.x + data.cell.width - 3,
                data.cell.y + data.cell.height - 4,
                { align: "right" }
              );
            }

            if (data.column.dataKey === 'credit' && rowData._paymentCount > 1) {
              const totalText = `Total: \u20B9${Math.round(rowData._periodCr).toLocaleString('en-IN')}`;
              // Thin separator line above total
              const sepY = data.cell.y + data.cell.height - 13;
              doc.setDrawColor(0, 130, 0);
              doc.setLineWidth(0.3);
              doc.line(data.cell.x + 3, sepY, data.cell.x + data.cell.width - 3, sepY);
              // Bold total text in green to match payment entries
              doc.setFont("Roboto", "bold");
              doc.setFontSize(7.5);
              doc.setTextColor(0, 100, 0);
              doc.text(
                totalText,
                data.cell.x + data.cell.width - 3,
                data.cell.y + data.cell.height - 4,
                { align: "right" }
              );
            }
          }

          if (data.section === 'body' && data.column.dataKey === 'partyName') {
            const rowData = tableRows[data.row.index];
            if (rowData && rowData._city) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(5.5);
              doc.setTextColor(100, 100, 100);
              doc.text(
                rowData._city,
                data.cell.x + 3,
                data.cell.y + data.cell.height - 1.5
              );
              // Restore
              doc.setFont('Roboto', 'bold');
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
            }
          }
        },
        didDrawPage: function (data) {
          // Footer: page number right, company stamp left
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFontSize(6.5);
          doc.setTextColor(140, 140, 140);
          doc.text("Sri Brundabana Enterprises", mL, pageH - 14);
          const styleLabel = style === 'detailed' ? ' • Detailed' : '';
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

      doc.save(`LineList_${style === 'detailed' ? 'Detailed_' : ''}${new Date().getTime()}.pdf`);
      resolve(true);
    } catch (e) {
      console.error("PDF Gen Error:", e);
      resolve(false);
    }
  });
};

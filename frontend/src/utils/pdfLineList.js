import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

export const generateLineListPDF = (selectedLines, fromDate, toDate, ledgerData) => {
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

          for (const entry of ledger.entries) {
            const entryDate = parseLedgerDate(entry.date);
            entryDate.setHours(0, 0, 0, 0);

            if (fromDate && entryDate < fromDate) {
              // Adjust opening balance for transactions prior to 'from date'
              // Negative raw balance = Debit (Receivable)
              if (entry.drCr === 'Dr') {
                openingBalanceRaw -= entry.amount;
              } else if (entry.drCr === 'Cr') {
                openingBalanceRaw += entry.amount;
              }
            } else if ((!fromDate || entryDate >= fromDate) && (!toDate || entryDate <= toDate)) {
              // Transactions within the period
              if (entry.drCr === 'Dr') {
                periodDr += entry.amount;
              } else if (entry.drCr === 'Cr') {
                periodCr += entry.amount;
              }
            }
          }

          // Closing Balance for period
          const closingBalanceRaw = openingBalanceRaw - periodDr + periodCr;

          // Skip if zero opening balance and no activity
          if (Math.abs(openingBalanceRaw) < 0.01 && periodDr === 0 && periodCr === 0 && Math.abs(closingBalanceRaw) < 0.01) {
            continue;
          }

          const formatBalance = (val) => {
            if (Math.abs(val) < 0.5) return "-";
            const amt = Math.round(Math.abs(val));
            // val < 0 is Debit (they owe us), so positive. val > 0 is Credit (we owe them), so negative.
            return val < 0 ? `Rs ${amt}` : `-Rs ${amt}`;
          };

          periodData.push({
            partyName: ledger.ledgerName,
            lineName: line,
            opening: formatBalance(openingBalanceRaw),
            credit: periodCr >= 0.5 ? `Rs ${Math.round(periodCr)}` : "-",
            debit: periodDr >= 0.5 ? `Rs ${Math.round(periodDr)}` : "-",
            closing: formatBalance(closingBalanceRaw)
          });
        }
      }

      // Sort alphabetically by party name
      periodData.sort((a, b) => a.partyName.localeCompare(b.partyName));

      // Build PDF
      const doc = new jsPDF('p', 'pt', 'a4');
      const pw = doc.internal.pageSize.getWidth();
      const mL = 40, mR = 40;

      // ── Company Name ──────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(30, 30, 30);
      doc.text("Sri Brundaban Enterprises, Rayagada", pw / 2, 32, { align: "center" });

      // ── Meta line: Lines • Period  (single compact row) ──
      let lineText = selectedLines.join("  \u2022  ");
      if (lineText.length > 45) lineText = lineText.substring(0, 42) + "...";

      let dateText = "All Time";
      if (fromDate && toDate) {
          dateText = `${fromDate.toLocaleDateString('en-IN')} to ${toDate.toLocaleDateString('en-IN')}`;
      } else if (fromDate) {
          dateText = `From ${fromDate.toLocaleDateString('en-IN')}`;
      } else if (toDate) {
          dateText = `Until ${toDate.toLocaleDateString('en-IN')}`;
      }

      const metaY = 47;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text(lineText, mL, metaY);
      doc.text(dateText, pw - mR, metaY, { align: "right" });

      // Thin hairline separator
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.line(mL, metaY + 6, pw - mR, metaY + 6);

      const tableStartY = metaY + 14;

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
        return {
          ...d,
          partyName: parsed.name,
          _city: parsed.city,
          cash: "",
          upi: ""
        };
      });

      autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: tableStartY,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
          valign: 'middle',
          font: 'helvetica',
          textColor: [40, 40, 40],
          lineColor: [200, 200, 200],
          lineWidth: 0.4
        },
        headStyles: {
          fillColor: [235, 235, 235],
          textColor: [30, 30, 30],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9,
          cellPadding: { top: 4, right: 4, bottom: 4, left: 4 }
        },
        columnStyles: {
          partyName: { cellWidth: 140, fontStyle: 'bold', textColor: [20, 20, 20], fontSize: 10 },
          opening: { halign: 'right', cellWidth: 49.5 },
          debit: { halign: 'right', cellWidth: 40.5 },
          credit: { halign: 'right', cellWidth: 45 },
          closing: { halign: 'right', cellWidth: 54, fontStyle: 'bold', textColor: [20, 20, 20] },
          cash: { cellWidth: 93 },
          upi: { cellWidth: 93 }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: mL, right: mR },
        didParseCell: function (data) {
          if (data.section === 'head') {
             // Multi-line header styles
             if (data.column.dataKey === 'opening' || data.column.dataKey === 'debit' || data.column.dataKey === 'credit' || data.column.dataKey === 'closing') {
                data.cell.styles.fontSize = 9; // default big font
                data.cell.styles.cellPadding = { top: 3, right: 4, bottom: 3, left: 4 };
             }
          }
          if (data.section === 'body' && data.column.dataKey === 'partyName') {
            const rowData = tableRows[data.row.index];
            if (rowData && rowData._city) {
              // Give extra vertical room for the city sub-line
              data.cell.styles.minCellHeight = 28;
              data.cell.styles.cellPadding = { top: 4, right: 4, bottom: 10, left: 4 };
            }
          }
        },
        didDrawCell: function (data) {
          // Custom render for multi-line headers
          if (data.section === 'head') {
             const key = data.column.dataKey;
             if (['opening', 'debit', 'credit', 'closing'].includes(key)) {
                // Clear the default text that autoTable drew (since it draws standard text)
                // Actually, the best way to handle this without overlapping is to just let autoTable draw it but we intercept and draw ourselves, or we just rely on `\n` which autoTable handles, BUT the user wants different font sizes for each line.
                // To achieve different font sizes for lines in a single cell, we must clear it and draw manually.
                
                // Let's clear the cell background
                doc.setFillColor(235, 235, 235);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                
                // Draw borders
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.4);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'S');

                const textX = data.cell.x + (data.cell.width / 2);
                const textYBase = data.cell.y + (data.cell.height / 2);
                
                doc.setTextColor(30, 30, 30);
                doc.setFont("helvetica", "bold");
                
                let line1 = "";
                let line2 = "";
                
                if (key === 'opening') { line1 = "Old"; line2 = "Balance"; }
                if (key === 'debit') { line1 = "Bills"; line2 = "(Dr)"; }
                if (key === 'credit') { line1 = "Payments"; line2 = "(Cr)"; }
                if (key === 'closing') { line1 = "Current"; line2 = "Balance"; }
                
                // Draw line 1 (Big)
                doc.setFontSize(9.5);
                doc.text(line1, textX, textYBase - 1, { align: "center", baseline: "middle" });
                
                // Draw line 2 (Small)
                doc.setFontSize(7.5);
                doc.text(line2, textX, textYBase + 7, { align: "center", baseline: "middle" });
             }
          }

          if (data.section === 'body' && data.column.dataKey === 'partyName') {
            const rowData = tableRows[data.row.index];
            if (rowData && rowData._city) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(6.5);
              doc.setTextColor(130, 130, 130);
              doc.text(
                rowData._city,
                data.cell.x + 4,
                data.cell.y + data.cell.height - 3
              );
              // Restore
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(40, 40, 40);
            }
          }
        },
        didDrawPage: function (data) {
          // Footer: page number right, company stamp left
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFontSize(7);
          doc.setTextColor(160, 160, 160);
          doc.text("Sri Brundaban Enterprises", mL, pageH - 18);
          doc.text("Page " + doc.internal.getNumberOfPages(), pw - mR, pageH - 18, { align: "right" });
        }
      });

      doc.save(`LineList_${new Date().getTime()}.pdf`);
      resolve(true);
    } catch (e) {
      console.error("PDF Gen Error:", e);
      resolve(false);
    }
  });
};

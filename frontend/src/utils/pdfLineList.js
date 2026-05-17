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
            if (Math.abs(val) < 0.01) return "0.00";
            const amt = Math.abs(val).toFixed(2);
            return val < 0 ? `${amt} Dr` : `${amt} Cr`;
          };

          periodData.push({
            partyName: ledger.ledgerName,
            lineName: line,
            opening: formatBalance(openingBalanceRaw),
            credit: periodCr > 0 ? periodCr.toFixed(2) : "-",
            debit: periodDr > 0 ? periodDr.toFixed(2) : "-",
            closing: formatBalance(closingBalanceRaw)
          });
        }
      }

      // Sort alphabetically by party name
      periodData.sort((a, b) => a.partyName.localeCompare(b.partyName));

      // Build PDF
      const doc = new jsPDF('p', 'pt', 'a4');
      
      // Sri Brundaban Enterprises, Rayagada
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("Sri Brundaban Enterprises, Rayagada", doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });
      
      // Decorative premium Card Container for Metadata
      const cardY = 55;
      const cardHeight = 42;
      const cardWidth = doc.internal.pageSize.getWidth() - 80;
      
      // Draw Slate-50 background card with Slate-200 border
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.roundedRect(40, cardY, cardWidth, cardHeight, 6, 6, 'FD'); // Fill & Draw
      
      // Line label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text("SELECTED LINE(S)", 55, cardY + 16);
      
      // Line value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42); // Slate-900
      let lineText = selectedLines.join(" \u2022 ");
      if (lineText.length > 55) lineText = lineText.substring(0, 52) + "...";
      doc.text(lineText, 55, cardY + 30);
      
      // Period label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text("PERIOD RANGE", 400, cardY + 16);
      
      // Period value
      let dateText = "All Time";
      if (fromDate && toDate) {
          dateText = `${fromDate.toLocaleDateString('en-IN')} to ${toDate.toLocaleDateString('en-IN')}`;
      } else if (fromDate) {
          dateText = `From ${fromDate.toLocaleDateString('en-IN')}`;
      } else if (toDate) {
          dateText = `Until ${toDate.toLocaleDateString('en-IN')}`;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(dateText, 400, cardY + 30);

      const tableColumns = [
        { header: "Party Name", dataKey: "partyName" },
        { header: "Opening Bal.", dataKey: "opening" },
        { header: "Credit", dataKey: "credit" },
        { header: "Debit", dataKey: "debit" },
        { header: "Closing Bal.", dataKey: "closing" },
        { header: "Cash", dataKey: "cash" },
        { header: "UPI", dataKey: "upi" }
      ];

      const tableRows = periodData.map(d => ({
        ...d,
        cash: "",
        upi: ""
      }));

      autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: 112,
        theme: 'grid',
        styles: {
          fontSize: 9.5,
          cellPadding: 5,
          valign: 'middle',
          font: 'helvetica',
          textColor: [30, 41, 59]
        },
        headStyles: {
          fillColor: [30, 41, 59], // Slate-800
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9.5
        },
        columnStyles: {
          partyName: { cellWidth: 165, fontStyle: 'bold', textColor: [15, 23, 42] },
          opening: { halign: 'right', cellWidth: 65 },
          credit: { halign: 'right', cellWidth: 50 },
          debit: { halign: 'right', cellWidth: 50 },
          closing: { halign: 'right', cellWidth: 65, fontStyle: 'bold', textColor: [15, 23, 42] },
          cash: { cellWidth: 60 },
          upi: { cellWidth: 60 }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Slate-50 background for alternate rows
        },
        margin: { left: 40, right: 40 },
        didDrawPage: function (data) {
          const str = "Page " + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.getHeight() - 20);
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

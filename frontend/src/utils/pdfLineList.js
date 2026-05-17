import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Sri Brundaban Enterprises, Rayagada", doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      // Limit line text if too many selected to avoid wrapping into table
      let lineText = selectedLines.join(", ");
      if (lineText.length > 80) lineText = lineText.substring(0, 77) + "...";
      doc.text(`Line(s): ${lineText}`, 40, 65);
      
      let dateText = "Period: All Time";
      if (fromDate && toDate) {
          dateText = `Period: ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`;
      } else if (fromDate) {
          dateText = `Period: From ${fromDate.toLocaleDateString()}`;
      } else if (toDate) {
          dateText = `Period: Until ${toDate.toLocaleDateString()}`;
      }
      doc.text(dateText, 40, 80);

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

      doc.autoTable({
        columns: tableColumns,
        body: tableRows,
        startY: 95,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 4,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [60, 60, 60],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          partyName: { cellWidth: 140 },
          opening: { halign: 'right', cellWidth: 65 },
          credit: { halign: 'right', cellWidth: 55 },
          debit: { halign: 'right', cellWidth: 55 },
          closing: { halign: 'right', cellWidth: 65 },
          cash: { cellWidth: 65 },
          upi: { cellWidth: 65 }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 40, right: 40 },
        didDrawPage: function (data) {
          const str = "Page " + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
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

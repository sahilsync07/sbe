import { formatProductName } from "./formatters";

/**
 * Generate a Sample Room PDF listing which products are present / absent.
 * Layout: 2-column split (6 columns total per page) to maximize space.
 * @param {string} brandName - The brand/group name
 * @param {Array<{productName: string, quantity: number, present: boolean}>} products
 */
export const generateSampleRoomPDF = async (brandName, products) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.width;

    const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
    const presentCount = products.filter(p => p.present).length;

    const drawHeader = (doc, pageNum, totalPages) => {
        // --- Compact Header ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("SRI BRUNDABANA ENTERPRISES", pw / 2, 14, { align: "center" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text("RAYAGADA \u2022 ODISHA", pw / 2, 18, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("SAMPLE ROOM CHECKLIST", pw / 2, 24, { align: "center" });

        doc.setLineWidth(1.0);
        doc.setDrawColor(0, 0, 0);
        doc.line(14, 28, pw - 14, 28);

        const sy = 34;

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text("BRAND", 14, sy);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(brandName.toUpperCase(), 14, sy + 5);

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text("DATE", pw - 14, sy, { align: "right" });
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(date, pw - 14, sy + 5, { align: "right" });

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`PRESENT: ${presentCount} / ${products.length}`, pw - 14, sy + 10, { align: "right" });
    };

    // --- Table Data Generation ---
    // We explicitly calculate pages to guarantee perfect Left-Right chronological flow per page.
    const ROWS_PER_PAGE = 38; // Fits perfectly on A4 without causing jsPDF-autotable to break the page
    const ITEMS_PER_PAGE = ROWS_PER_PAGE * 2;
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE) || 1;

    const tableColumn = [
        { content: "ARTICLE", styles: { halign: 'left' } },
        { content: "QTY", styles: { halign: 'center' } },
        { content: "SMPL", styles: { halign: 'center' } },
        { content: "ARTICLE", styles: { halign: 'left' } },
        { content: "QTY", styles: { halign: 'center' } },
        { content: "SMPL", styles: { halign: 'center' } },
    ];

    for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
            doc.addPage();
        }
        drawHeader(doc, page + 1, totalPages);

        const pageStart = page * ITEMS_PER_PAGE;
        const pageProducts = products.slice(pageStart, pageStart + ITEMS_PER_PAGE);
        const rows = [];
        
        for (let i = 0; i < ROWS_PER_PAGE; i++) {
            const left = pageProducts[i];
            const right = pageProducts[i + ROWS_PER_PAGE];

            // If neither exists, we are done with this page
            if (!left && !right) break;

            const row = [
                left ? formatProductName(left.productName) : "", 
                left ? `${left.quantity || 0}` : "",
                left ? (left.present ? "TRUE" : "FALSE") : "",
                right ? formatProductName(right.productName) : "",
                right ? `${right.quantity || 0}` : "",
                right ? (right.present ? "TRUE" : "FALSE") : ""
            ];
            
            rows.push(row);
        }

        autoTable(doc, {
            head: [tableColumn],
            body: rows,
            startY: 48,
            theme: 'plain',
            styles: {
                fontSize: 8,
                cellPadding: 1.5,
                valign: 'middle',
                font: 'helvetica',
                textColor: [0, 0, 0],
                overflow: 'ellipsize', // Prevents wrapping which breaks predictable row height
                lineWidth: 0.1,
                lineColor: [220, 220, 220]
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248] // Light grey stripe
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 8,
                lineWidth: 0.1,
                lineColor: [200, 200, 200]
            },
            columnStyles: {
                0: { cellWidth: 63, fontStyle: 'bold' },
                1: { cellWidth: 14, halign: 'center' },
                2: { cellWidth: 14, halign: 'center' },
                3: { cellWidth: 63, fontStyle: 'bold' },
                4: { cellWidth: 14, halign: 'center' },
                5: { cellWidth: 14, halign: 'center' },
            },
            didParseCell: (data) => {
                // Clear the TRUE/FALSE text so it doesn't print
                if (data.section === 'body') {
                    if (data.column.index === 2 || data.column.index === 5) {
                        data.cell.text = [];
                    }
                }
            },
            didDrawCell: (data) => {
                // Draw thick bold line right after the 3rd column
                if (data.column.index === 2) {
                    doc.setLineWidth(1.0);
                    doc.setDrawColor(0, 0, 0);
                    doc.line(
                        data.cell.x + data.cell.width, 
                        data.cell.y, 
                        data.cell.x + data.cell.width, 
                        data.cell.y + data.cell.height
                    );
                }
                // Draw thick border for the header row
                if (data.section === 'head') {
                    doc.setLineWidth(1.0);
                    doc.setDrawColor(0, 0, 0);
                    doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                    doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                }
                // Draw vector checkmarks manually to avoid unicode font issues
                if (data.section === 'body') {
                    if (data.column.index === 2 || data.column.index === 5) {
                        if (data.cell.raw === "TRUE") {
                            const cx = data.cell.x + data.cell.width / 2;
                            const cy = data.cell.y + data.cell.height / 2;
                            doc.setLineWidth(1.0);
                            doc.setDrawColor(0, 0, 0); // Neat black checkmark
                            // Draw V shape
                            doc.line(cx - 2, cy, cx - 0.5, cy + 2);
                            doc.line(cx - 0.5, cy + 2, cx + 2.5, cy - 2.5);
                        }
                    }
                }
            }
        });

        // --- Footer ---
        const finalY = doc.lastAutoTable.finalY + 8;
        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(14, finalY, pw - 14, finalY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        doc.text(`Sample Room Checklist - ${brandName} - ${date}  (Page ${page + 1} of ${totalPages})`, pw / 2, finalY + 5, { align: "center" });
    }

    doc.save(`SampleRoom_${brandName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

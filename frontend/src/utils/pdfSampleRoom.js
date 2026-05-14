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

    // --- Calculate Stats ---
    const stats = { zero: 0, one: 0, two: 0, three: 0, four: 0, five: 0, under24: 0, under48: 0, under72: 0, over72: 0 };
    products.forEach(p => {
        const q = p.quantity || 0;
        if (q < 1) stats.zero++;
        else if (q < 2) stats.one++;
        else if (q < 3) stats.two++;
        else if (q < 4) stats.three++;
        else if (q < 5) stats.four++;
        else if (q < 6) stats.five++;
        else if (q < 24) stats.under24++;
        else if (q < 48) stats.under48++;
        else if (q < 72) stats.under72++;
        else stats.over72++;
    });

    const summaryLeft = [
        `Less than < 1 Qty Product Count : ${stats.zero}`,
        `Less than < 2 Qty Product Count : ${stats.one}`,
        `Less than < 3 Qty Product Count : ${stats.two}`,
        `Less than < 4 Qty Product Count : ${stats.three}`,
        `Less than < 5 Qty Product Count : ${stats.four}`,
        `Less than < 6 Qty Product Count : ${stats.five}`
    ];

    const summaryRight = [
        `< 24 Qty Count : ${stats.under24}`,
        `> 24 but < 48 Qty Count : ${stats.under48}`,
        `> 48 and < 72 Qty Count : ${stats.under72}`,
        `Greater than > 72 Qty Count : ${stats.over72}`,
        ``,
        `TOTAL PRODUCTS : ${products.length}`
    ];

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

    const drawFooter = (doc, pageNum, totalPages) => {
        const finalY = 282; // Fixed position near bottom
        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(14, finalY, pw - 14, finalY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        doc.text(`Sample Room Checklist - ${brandName} - ${date}  (Page ${pageNum} of ${totalPages})`, pw / 2, finalY + 5, { align: "center" });
    };

    const ROWS_PER_PAGE = 22; 
    const ITEMS_PER_PAGE = ROWS_PER_PAGE * 2;
    let totalPages = Math.ceil(products.length / ITEMS_PER_PAGE) || 1;

    // Check if we need to add a page for the summary
    const remainingItems = products.length % ITEMS_PER_PAGE || ITEMS_PER_PAGE;
    const remainingRows = Math.ceil(remainingItems / 2);
    const summaryNeedsNewPage = remainingRows > 16; 
    const totalPagesWithSummary = summaryNeedsNewPage ? totalPages + 1 : totalPages;

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
        drawHeader(doc, page + 1, totalPagesWithSummary);

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
                left ? (left.present ? "4" : "") : "",
                right ? formatProductName(right.productName) : "",
                right ? `${right.quantity || 0}` : "",
                right ? (right.present ? "4" : "") : ""
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
                cellPadding: 2.5, // Restored spacious padding
                valign: 'middle',
                font: 'helvetica',
                textColor: [0, 0, 0],
                overflow: 'ellipsize', // CRITICAL: Forces 1-line rows so height is perfectly predictable
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
                2: { cellWidth: 14, halign: 'center', font: 'zapfdingbats', fontSize: 8, textColor: [0, 120, 0] },
                3: { cellWidth: 63, fontStyle: 'bold' },
                4: { cellWidth: 14, halign: 'center' },
                5: { cellWidth: 14, halign: 'center', font: 'zapfdingbats', fontSize: 8, textColor: [0, 120, 0] },
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
            }
        });

        drawFooter(doc, page + 1, totalPagesWithSummary);
    }

    // --- Draw Summary ---
    let summaryY = doc.lastAutoTable.finalY + 15;
    if (summaryNeedsNewPage) {
        doc.addPage();
        drawHeader(doc, totalPagesWithSummary, totalPagesWithSummary);
        drawFooter(doc, totalPagesWithSummary, totalPagesWithSummary);
        summaryY = 48;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("INVENTORY QUANTITY SUMMARY", 14, summaryY);
    
    doc.setLineWidth(0.5);
    doc.line(14, summaryY + 2, 75, summaryY + 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    
    let sySummary = summaryY + 8;
    for (let i = 0; i < 6; i++) {
        doc.text(summaryLeft[i], 14, sySummary + (i * 6));
        doc.text(summaryRight[i], pw / 2 + 10, sySummary + (i * 6));
    }

    doc.save(`SampleRoom_${brandName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

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
    doc.line(14, 28, pw - 14, 28);

    // --- Details ---
    const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
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

    const presentCount = products.filter(p => p.present).length;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`PRESENT: ${presentCount} / ${products.length}`, pw - 14, sy + 10, { align: "right" });

    // --- Table Data Generation ---
    // Chunk into pages to maintain sequential Left -> Right reading order per page.
    // By fixing ROWS_PER_PAGE, we ensure Page 1 reads 1-35 (Left), then 36-70 (Right).
    const ROWS_PER_PAGE = 35;
    const ITEMS_PER_PAGE = ROWS_PER_PAGE * 2;
    const rows = [];
    
    for (let pageStart = 0; pageStart < products.length; pageStart += ITEMS_PER_PAGE) {
        const pageProducts = products.slice(pageStart, pageStart + ITEMS_PER_PAGE);
        
        for (let i = 0; i < ROWS_PER_PAGE; i++) {
            const left = pageProducts[i];
            const right = pageProducts[i + ROWS_PER_PAGE];

            // If neither left nor right exists, we've exhausted this page's products
            if (!left && !right) break;

            const row = [
                left ? formatProductName(left.productName) : "", 
                left ? `${left.quantity || 0}` : "",
                left ? (left.present ? "\u2713" : "") : ""
            ];

            row.push(
                right ? formatProductName(right.productName) : "",
                right ? `${right.quantity || 0}` : "",
                right ? (right.present ? "\u2713" : "") : ""
            );
            
            rows.push(row);
        }
    }

    const tableColumn = [
        { content: "ARTICLE", styles: { halign: 'left' } },
        { content: "QTY", styles: { halign: 'center' } },
        { content: "SMPL", styles: { halign: 'center' } },
        { content: "ARTICLE", styles: { halign: 'left' } },
        { content: "QTY", styles: { halign: 'center' } },
        { content: "SMPL", styles: { halign: 'center' } },
    ];

    autoTable(doc, {
        head: [tableColumn],
        body: rows,
        startY: sy + 14,
        theme: 'plain',
        styles: {
            fontSize: 7.5,
            cellPadding: 2.5,
            valign: 'middle',
            font: 'helvetica',
            textColor: [0, 0, 0],
            overflow: 'linebreak',
            lineWidth: 0.1, // Light cell borders
            lineColor: [220, 220, 220]
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248] // Very light grey stripe view
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
            0: { cellWidth: 'auto', fontStyle: 'bold' },
            1: { cellWidth: 16, halign: 'center' },
            2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
            3: { cellWidth: 'auto', fontStyle: 'bold' },
            4: { cellWidth: 16, halign: 'center' },
            5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
            // Make checkmarks bigger
            if (data.section === 'body') {
                if (data.column.index === 2 || data.column.index === 5) {
                    const val = data.cell.raw;
                    if (typeof val === 'string' && val.includes('\u2713')) {
                        data.cell.styles.textColor = [0, 0, 0];
                        data.cell.styles.fontSize = 11;
                    }
                }
            }
        },
        didDrawCell: (data) => {
            // Draw a thick bold line right after the 3rd column to separate the two halves
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
                // Top header border
                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                // Bottom header border
                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
            }
        }
    });

    // --- Footer ---
    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, finalY, pw - 14, finalY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text(`Sample Room Checklist - ${brandName} - ${date}`, pw / 2, finalY + 6, { align: "center" });

    doc.save(`SampleRoom_${brandName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

import { formatProductName } from "./formatters";
import { extractColor } from "./colors";

const getCleanProductName = (name) => {
    if (!name) return '';
    let clean = name;
    const colorData = extractColor(name);
    if (colorData && colorData.originalTokens) {
        colorData.originalTokens.forEach(token => {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            clean = clean.replace(regex, '');
        });
    }
    clean = clean.replace(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/gi, '');
    clean = clean.replace(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/g, ' ');
    clean = clean.replace(/\(\s*\)/g, '');
    clean = clean.replace(/[\/\-]+\s*$/g, '').replace(/^\s*[\/\-]+/g, '').replace(/\s*[\/\-]+\s*/g, ' ');
    return formatProductName(clean.replace(/\s+/g, ' ').trim());
};

const getProductSize = (name) => {
    if (!name) return '-';
    const match = name.match(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/);
    if (match) {
        const low = Math.min(parseInt(match[1]), parseInt(match[2]));
        const high = Math.max(parseInt(match[1]), parseInt(match[2]));
        return `${low}x${high}`;
    }
    return '-';
};

const getProductColor = (name) => {
    const data = extractColor(name);
    return data ? data.text : '-';
};

/**
 * Generate a Sample Room PDF listing which products are present / absent.
 * @param {string} brandName - The brand/group name
 * @param {Array<{productName: string, quantity: number, present: boolean}>} products
 */
export const generateSampleRoomPDF = async (brandName, products) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.width;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("SRI BRUNDABANA ENTERPRISES", pw / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text("RAYAGADA \u2022 ODISHA", pw / 2, 27, { align: "center" });

    // Badge
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.roundedRect(pw / 2 - 30, 33, 60, 9, 2, 2, 'S');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("SAMPLE ROOM CHECKLIST", pw / 2, 39, { align: "center" });

    // Divider
    doc.setLineWidth(1.5);
    doc.line(14, 48, pw - 14, 48);

    // Details
    const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
    const sy = 56;

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("BRAND", 14, sy);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(brandName.toUpperCase(), 14, sy + 6);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "bold");
    doc.text("DATE", pw - 14, sy, { align: "right" });
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(date, pw - 14, sy + 6, { align: "right" });

    const presentCount = products.filter(p => p.present).length;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`PRESENT: ${presentCount} / ${products.length}`, pw - 14, sy + 12, { align: "right" });

    // Table
    const tableColumn = [
        { content: "#", styles: { halign: 'center' } },
        { content: "ARTICLE", styles: { halign: 'left' } },
        { content: "SIZE", styles: { halign: 'center' } },
        { content: "COLOR", styles: { halign: 'left' } },
        { content: "STOCK", styles: { halign: 'center' } },
        { content: "SAMPLE", styles: { halign: 'center' } },
    ];

    const rows = products.map((p, i) => [
        i + 1,
        getCleanProductName(p.productName),
        getProductSize(p.productName),
        getProductColor(p.productName),
        `${p.quantity || 0}`,
        p.present ? "\u2713" : "",
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: rows,
        startY: sy + 20,
        theme: 'plain',
        styles: {
            fontSize: 9,
            cellPadding: 3,
            valign: 'middle',
            font: 'helvetica',
            textColor: [0, 0, 0],
            overflow: 'linebreak',
            lineWidth: 0,
        },
        headStyles: {
            fillColor: false,
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 9,
            lineWidth: { bottom: 1.5 },
            lineColor: [0, 0, 0],
        },
        bodyStyles: {
            lineColor: [200, 200, 200],
            lineWidth: { bottom: 0.1 },
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center', fontStyle: 'bold', textColor: [100] },
            1: { cellWidth: 'auto', fontStyle: 'bold' },
            2: { cellWidth: 22, halign: 'center' },
            3: { cellWidth: 30, halign: 'left' },
            4: { cellWidth: 22, halign: 'center' },
            5: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
            // Make the checkmark a bit larger and green if present
            if (data.section === 'body' && data.column.index === 5) {
                const val = data.cell.raw;
                if (typeof val === 'string' && val.includes('\u2713')) {
                    data.cell.styles.textColor = [0, 0, 0]; // Keep it black/neat like order sheet
                    data.cell.styles.fontSize = 12;
                }
            }
        }
    });

    // Footer
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

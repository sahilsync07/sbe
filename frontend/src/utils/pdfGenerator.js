import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatProductName, normalizeId } from "./formatters";
import { extractColor } from "./colors";

/**
 * Clean product name by removing colors and sizes for the table
 */
const getCleanProductName = (name) => {
    if (!name) return '';
    let clean = name;

    // Remove Colors
    const colorData = extractColor(name);
    if (colorData && colorData.originalTokens) {
        colorData.originalTokens.forEach(token => {
            const regex = new RegExp(`\\b${token}\\b`, 'gi');
            clean = clean.replace(regex, '');
        });
    }

    // Remove Price pattern
    clean = clean.replace(/((?:RS|MRP|@))[\.\s]*(\d+(\.\d+)?)/gi, '');
    // Remove Size pattern
    clean = clean.replace(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/g, ' ');

    clean = clean.replace(/\(\s*\)/g, '');
    clean = clean.replace(/[\/\-]+\s*$/g, '')
        .replace(/^\s*[\/\-]+/g, '')
        .replace(/\s*[\/\-]+\s*/g, ' ');

    const cleanedString = clean.replace(/\s+/g, ' ').trim();
    return formatProductName(cleanedString);
};

const getProductSize = (name) => {
    if (!name) return '-';
    const match = name.match(/(?:^|[\s\(])(\d{1,2})\s*[xX*]\s*(\d{1,2})(?:[\s\)]|$)/);
    if (match) {
        const n1 = parseInt(match[1]);
        const n2 = parseInt(match[2]);
        const low = Math.min(n1, n2);
        const high = Math.max(n1, n2);
        return `${low}x${high}`;
    }
    return '-';
};

const getProductColor = (name) => {
    const data = extractColor(name);
    return data ? data.text : '-';
};

export const generateOrderPDF = (cart, customerDetails) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- 1. HEADER (Ink-Efficient: Bold Text, No Block) ---
        // Company Name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0); // Pure Black
        doc.text("SRI BRUNDABANA ENTERPRISES", pageWidth / 2, 20, { align: "center" });

        // Subtitle
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80); // Dark Gray
        doc.text("RAYAGADA • ODISHA", pageWidth / 2, 27, { align: "center" });

        // Purchase Order Badge (Outlined, not filled)
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.roundedRect(pageWidth / 2 - 25, 33, 50, 9, 2, 2, 'S');

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("PURCHASE ORDER", pageWidth / 2, 39, { align: "center" });

        // Thick Divider
        doc.setLineWidth(1.5);
        doc.line(14, 48, pageWidth - 14, 48);


        // --- 2. DETAILS (Clean Layout) ---
        const date = new Date().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const startY = 56;

        // Left: Customer
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text("CUSTOMER", 14, startY);

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(customerDetails.name, 14, startY + 6);

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(customerDetails.phone, 14, startY + 11);

        // Right: Order Info
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text("DATE", pageWidth - 14, startY, { align: "right" });

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(date, pageWidth - 14, startY + 6, { align: "right" });

        const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
        const totalQtyLabel = totalQty === 1 ? 'Set' : 'Sets';
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`TOTAL ITEMS: ${totalQty} ${totalQtyLabel}`, pageWidth - 14, startY + 12, { align: "right" });


        // --- 3. TABLE (Compact & Minimalist) ---
        // Explicit alignment for headers
        const tableColumn = [
            { content: "#", styles: { halign: 'center' } },
            { content: "ARTICLE", styles: { halign: 'left' } },
            { content: "SIZE", styles: { halign: 'center' } },
            { content: "COLOR", styles: { halign: 'left' } }, // Color body is default left
            { content: "QTY", styles: { halign: 'center' } },
            { content: "STOCK", styles: { halign: 'center' } }
        ];

        const tableRows = [];

        cart.forEach((item, index) => {
            const product = item.product;
            const stockQty = product.quantity || 0;
            const size = getProductSize(product.productName);
            const color = getProductColor(product.productName);
            const cleanName = getCleanProductName(product.productName);

            const qtyLabel = item.quantity === 1 ? 'Set' : 'Sets';
            const stockLabel = stockQty === 1 ? 'Pair' : 'Pairs';

            const rowData = [
                index + 1,
                cleanName,
                size,
                color,
                `${item.quantity} ${qtyLabel}`,
                `${stockQty} ${stockLabel}`
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY + 20,
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
                lineColor: [0, 0, 0]
            },
            bodyStyles: {
                lineColor: [200, 200, 200],
                lineWidth: { bottom: 0.1 },
            },
            // Column Specifics (Increased widths for side columns to reduce Article width)
            columnStyles: {
                0: { cellWidth: 10, halign: 'center', fontStyle: "bold", textColor: [100] },
                1: { cellWidth: 'auto', fontStyle: "bold" },
                2: { cellWidth: 24, halign: 'center' }, // Increased from 22
                3: { cellWidth: 30, halign: 'left' },   // Increased from 28
                4: { cellWidth: 28, halign: 'center', fontStyle: 'bold' }, // Increased from 25
                5: { cellWidth: 28, halign: 'center', textColor: [120] }   // Increased from 25
            }
        });

        // --- 4. FOOTER ---
        const finalY = doc.lastAutoTable.finalY + 15;

        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(14, finalY, pageWidth - 14, finalY);

        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        // Updated footer to include basic contact info or thanks
        doc.text(customerDetails.name + " - " + customerDetails.phone, pageWidth / 2, finalY + 6, { align: "center" });

        // Return Base64 for Android sharing
        if (customerDetails.returnBase64) {
            return doc.output('datauristring');
        }

        doc.save(`Order_${customerDetails.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
        return true;
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return false;
    }
};

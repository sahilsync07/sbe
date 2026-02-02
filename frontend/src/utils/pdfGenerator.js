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

        // --- 1. HEADER ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text("M/S Sri Brundabana Enterprises", 105, 20, { align: "center" });

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text("Rayagada", 105, 28, { align: "center" });

        doc.line(10, 35, 200, 35); // Separator line

        // --- 2. PARTY DETAILS ---
        const date = new Date().toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);

        // Left Side: Party Info
        doc.setFont("helvetica", "bold");
        doc.text("Party Details:", 14, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`Name:   ${customerDetails.name}`, 14, 51);
        doc.text(`Phone:  ${customerDetails.phone}`, 14, 57);

        // Right Side: Order Info
        doc.setFont("helvetica", "bold");
        doc.text("Order Details:", 140, 45);
        doc.setFont("helvetica", "normal");
        doc.text(`Date:   ${date}`, 140, 51);
        doc.text(`Total Items: ${cart.reduce((sum, i) => sum + i.quantity, 0)} Sets`, 140, 57);

        // --- 3. TABLE ---
        const tableColumn = ["Sl No", "Article Name", "Size", "Color", "Ordered Qty", "Stock Available"];
        const tableRows = [];

        cart.forEach((item, index) => {
            const product = item.product;
            const stockQty = product.quantity || 0;
            const size = getProductSize(product.productName);
            const color = getProductColor(product.productName);
            const cleanName = getCleanProductName(product.productName);

            const rowData = [
                index + 1,
                cleanName,
                size,
                color,
                `${item.quantity} Sets`,
                `${stockQty} Pairs`
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                valign: 'middle',
                font: 'helvetica'
            },
            headStyles: {
                fillColor: [31, 41, 55], // Slate-800
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            // Alternate row colors
            alternateRowStyles: {
                fillColor: [248, 250, 252] // Slate-50
            },
            // Stock Column logic (optional visual cue could be added here but basic text is safer for now)
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' }, // Sl No
                1: { cellWidth: 'auto' },               // Article Name
                2: { cellWidth: 20, halign: 'center' }, // Size
                3: { cellWidth: 25 },                   // Color
                4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }, // Ordered Qty
                5: { cellWidth: 25, halign: 'center' }  // Stock Available
            }
        });

        // --- 4. FOOTER ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Proprietary Order Sheet - Generated by OrderMaster', 105, 290, { align: 'center' });
        }

        doc.save(`Order_${customerDetails.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
        return true;
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return false;
    }
};

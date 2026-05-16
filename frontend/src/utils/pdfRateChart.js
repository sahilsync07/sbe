import { getCleanProductName } from "./formatters";
import { extractColor } from "./colors";

/**
 * Fetch and convert an image URL to a base64 string using Canvas
 * @param {string} url - Image URL
 * @returns {Promise<string|null>} Base64 string or null if failed
 */
const getBase64Image = (url) => {
    return new Promise((resolve) => {
        if (!url) return resolve(null);
        
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // Fill background with white for transparent images
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(img, 0, 0);
            // Always return JPEG to ensure compatibility with jsPDF
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.onerror = () => {
            console.error('RateChart: Failed to load image:', url);
            resolve(null);
        };
        
        // Add cache-breaker to bypass strict CORS cache issues (especially for older photos)
        img.src = url + (url.includes('?') ? '&' : '?') + 'cb=' + new Date().getTime();
    });
};

/**
 * Parses the product name to extract size and rate
 * @param {string} name
 */
const parseProductDetails = (name) => {
    let size = "";
    let rate = "";
    let colorText = "";

    if (!name) return { size, rate, colorText };

    // Extract rate
    const rateMatch = name.match(/(?:MRP|RS\.?|@)\s*([\d\.\/-]+)/i);
    if (rateMatch) {
        rate = rateMatch[0].toUpperCase();
    }

    // Extract size
    const sizeMatch = name.match(/\(([^)]+)\)/);
    if (sizeMatch) {
        size = sizeMatch[1];
    }

    // Extract color
    const colorData = extractColor(name);
    if (colorData && colorData.text) {
        colorText = colorData.text;
    }

    return { size, rate, colorText };
};

/**
 * Generate a Rate Chart PDF for a specific brand.
 * @param {string} brandName - The brand/group name
 * @param {Array<{productName: string, imageUrl: string}>} products - List of products
 */
export const generateRateChartPDF = async (brandName, products) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.width;

    const date = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    // Helper to draw headers on each page
    const drawHeader = (doc, pageNum, totalPages) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("SRI BRUNDABANA ENTERPRISES", pw / 2, 14, { align: "center" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text("RAYAGADA \u2022 ODISHA", pw / 2, 18, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("RATE CHART", pw / 2, 24, { align: "center" });

        doc.setLineWidth(1.0);
        doc.setDrawColor(0, 0, 0);
        doc.line(14, 28, pw - 14, 28);

        const sy = 34;

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text("BRAND", 14, sy);
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(brandName.toUpperCase(), 14, sy + 6);

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.setFont("helvetica", "bold");
        doc.text("DATE", pw - 14, sy, { align: "right" });
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(date, pw - 14, sy + 5, { align: "right" });
    };

    const drawFooter = (doc, pageNum, totalPages) => {
        const finalY = 282; // Fixed position near bottom
        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(14, finalY, pw - 14, finalY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        doc.text(`Rate Chart - ${brandName} - ${date}  (Page ${pageNum} of ${totalPages})`, pw / 2, finalY + 5, { align: "center" });
    };

    const tableColumn = [
        { content: "IMAGE", styles: { halign: 'center' } },
        { content: "ARTICLE NAME", styles: { halign: 'left' } },
        { content: "COLOR", styles: { halign: 'left' } },
        { content: "SIZE", styles: { halign: 'center' } },
        { content: "NETRATE", styles: { halign: 'right' } }
    ];

    // Prepare table data
    // Fetch images in parallel
    const rowsData = await Promise.all(products.map(async (p) => {
        const cleanName = getCleanProductName(p.productName);
        const { size, rate, colorText } = parseProductDetails(p.productName);
        
        let base64Img = null;
        if (p.imageUrl) {
            // Add Cloudinary transformation for small thumbnail to save bandwidth and force JPG for jsPDF
            const optimizedUrl = p.imageUrl.replace('/upload/', '/upload/w_100,q_70,f_jpg/');
            base64Img = await getBase64Image(optimizedUrl);
        }

        return {
            img: base64Img,
            name: cleanName,
            color: colorText,
            size: size,
            rate: rate
        };
    }));

    // Pad with empty rows to fill page
    // Using 14 rows per page for bigger readable text
    const rowsPerPage = 14;
    const minRows = Math.ceil(rowsData.length / rowsPerPage) * rowsPerPage;
    const finalRowsCount = Math.max(minRows, rowsPerPage); // At least 1 page
    
    const tableRows = [];
    for (let i = 0; i < finalRowsCount; i++) {
        const row = rowsData[i];
        if (row) {
            // Keep a reference to the image in the first cell, so didDrawCell can access it
            tableRows.push([
                { content: "", imageBase64: row.img },
                row.name,
                row.color,
                row.size,
                row.rate
            ]);
        } else {
            // Empty row for manual writing
            tableRows.push([
                "", "", "", "", ""
            ]);
        }
    }

    const totalPages = Math.ceil(tableRows.length / rowsPerPage);
    
    // To support `didDrawPage` with totalPages, we can use jsPDF's putTotalPages if needed, 
    // but since we know rowsPerPage, we can just split manually or use `didDrawPage`.
    // However, autoTable handles pagination automatically. Let's just use autoTable hooks.

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 48,
        margin: { top: 48, bottom: 20, left: 14, right: 14 },
        theme: 'plain',
        rowPageBreak: 'avoid',
        styles: {
            fontSize: 11, // Bigger font for presentation
            cellPadding: 4,
            valign: 'middle',
            font: 'helvetica',
            textColor: [30, 30, 30],
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
            minCellHeight: 15 // Ensure enough height for thumbnails and writing
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 10,
            lineWidth: 0.1,
            lineColor: [180, 180, 180]
        },
        columnStyles: {
            0: { cellWidth: 25, halign: 'center' },
            1: { cellWidth: 'auto', fontStyle: 'bold' },
            2: { cellWidth: 35 },
            3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
            4: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [0, 80, 0] },
        },
        didDrawPage: (data) => {
            const currentPage = doc.internal.getNumberOfPages();
            if (currentPage === 1) {
                drawHeader(doc, currentPage, 'TODO'); // AutoTable doesn't provide total pages in didDrawPage easily
            } else {
                // Simplified header for subsequent pages
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.text(brandName.toUpperCase() + " - RATE CHART", 14, 14);

                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.setFont("helvetica", "normal");
                doc.text(date, pw / 2, 14, { align: "center" });
            }
        },
        didDrawCell: (data) => {
            // Draw grid lines explicitly for better empty grid appearance
            doc.setLineWidth(0.1);
            doc.setDrawColor(200, 200, 200);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);

            // Draw header borders
            if (data.section === 'head') {
                doc.setLineWidth(0.5);
                doc.setDrawColor(100, 100, 100);
                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
            }

            // Render thumbnail
            if (data.section === 'body' && data.column.index === 0) {
                const rawData = data.cell.raw;
                if (rawData && rawData.imageBase64) {
                    const imgX = data.cell.x + 2;
                    const imgY = data.cell.y + 2;
                    const dim = data.cell.height - 4; // Square image
                    doc.addImage(rawData.imageBase64, 'JPEG', imgX, imgY, dim, dim);
                }
            }
        }
    });

    // Fix footers (draw at the end for all pages)
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawFooter(doc, i, pageCount);
        
        // Fix header total pages on page 1
        if (i === 1) {
            // Mask the 'TODO' with white and redraw if needed, or just keep it simple.
            // Let's just redraw the footer correctly as we don't have 'TODO' in header
        }
    }

    doc.save(`RateChart_${brandName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

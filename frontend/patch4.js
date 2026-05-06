import fs from 'fs';

const files = [
    'c:/Projects/all-companies/sbe/frontend/src/components/PdfGenerator.vue',
    'c:/Projects/all-companies/sbe/frontend/src/android/components/PdfGenerator.vue'
];

function replaceFunction(content, startStr, newBody) {
    const start = content.indexOf(startStr);
    if (start === -1) return content;

    let braceCount = 0;
    let end = -1;
    let started = false;

    for (let i = start; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            started = true;
        } else if (content[i] === '}') {
            braceCount--;
        }
        
        if (started && braceCount === 0) {
            end = i + 1;
            if (content[end] === ';') end++;
            break;
        }
    }

    if (end === -1) return content;

    return content.substring(0, start) + newBody + content.substring(end);
}

const newBodyWebGeneral = `const generatePdfBlob = async (targetBrands) => {
    const data = stockData.value;
    const filteredGroups = data.filter((group) => targetBrands.includes(group.groupName));
    
    const { jsPDF } = await import("jspdf");
    const { clashDisplayBoldBase64 } = await import("../utils/fonts.js");
    
    const PAGE_W = 1080;
    const PAGE_H = 2400;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: [PAGE_W, PAGE_H] });
    
    // Add custom font
    doc.addFileToVFS('ClashDisplay-Bold.ttf', clashDisplayBoldBase64);
    doc.addFont('ClashDisplay-Bold.ttf', 'Clash Display', 'bold');
    
    let hasAddedPage = false;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    for (const group of filteredGroups) {
        for (const product of group.products) {
            if (onlyWithPhotos.value && !product.imageUrl) continue;
            if (minQtyEnabled.value && product.quantity <= minQty.value) continue;

            if (hasAddedPage) { doc.addPage([PAGE_W, PAGE_H]); }
            hasAddedPage = true;

            doc.setFillColor("#000000");
            doc.rect(0, 0, PAGE_W, PAGE_H, "F");

            if (product.imageUrl) {
                try {
                    const imgData = await fetchImageAsBase64(product.imageUrl);
                    const dims = await getImageDimensions(imgData);
                    
                    const finalWidth = PAGE_W;
                    const finalHeight = dims.height * (PAGE_W / dims.width);
                    const x = 0;
                    const y = (PAGE_H - finalHeight) / 2;
                    
                    doc.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);
                } catch (imgErr) {
                    doc.setTextColor(255);
                    doc.setFont("Clash Display", "bold");
                    doc.setFontSize(24);
                    doc.text("Image Load Failed", PAGE_W / 2, PAGE_H / 2, { align: "center" });
                }
            } else {
                doc.setTextColor(255);
                doc.setFont("Clash Display", "bold");
                doc.setFontSize(36);
                doc.text("No Photo Available", PAGE_W / 2, PAGE_H / 2, { align: "center" });
            }

            // HEADER
            doc.setTextColor(180, 180, 180);
            doc.setFont("Clash Display", "bold");
            doc.setFontSize(38);
            doc.text(dateStr, 50, 80, { align: "left" });
            doc.text(group.groupName, PAGE_W - 50, 80, { align: "right" });

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(60);
            doc.text("Sri Brundabana Enterprises", PAGE_W / 2, 160, { align: "center" });
            
            doc.setFontSize(50);
            doc.text("Rayagada", PAGE_W / 2, 230, { align: "center" });
            
            // FOOTER
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(64);
            doc.text(product.productName, PAGE_W / 2, PAGE_H - 160, { align: "center" });
            
            doc.setTextColor(255, 215, 0); // Muted gold
            doc.setFontSize(54);
            doc.text(\`Qty: \${product.quantity}\`, PAGE_W / 2, PAGE_H - 80, { align: "center" });
        }
    }
    return doc.output("blob");
};`;

const newBodyOneTouch = `const generatePdfBlobForOneTouch = async (targetBrands, onlyWithPhotosFlag, minQtyValue) => {
    const data = stockData.value;
    const filteredGroups = data.filter((group) => {
        return targetBrands.some(tb => tb.toLowerCase() === group.groupName.toLowerCase());
    });
    
    if (filteredGroups.length === 0) return { blob: null, pageCount: 0 };

    const { jsPDF } = await import("jspdf");
    // Android component needs slightly different import path depending on directory structure
    // Actually both are in src/components or src/android/components, but utils is at src/utils
    // Wait, the android path is src/android/components/PdfGenerator.vue, so it needs "../../utils/fonts.js"
    const { clashDisplayBoldBase64 } = await import("../../utils/fonts.js").catch(async () => {
        return await import("../utils/fonts.js");
    });
    
    const PAGE_W = 1080;
    const PAGE_H = 2400;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: [PAGE_W, PAGE_H] });
    
    doc.addFileToVFS('ClashDisplay-Bold.ttf', clashDisplayBoldBase64);
    doc.addFont('ClashDisplay-Bold.ttf', 'Clash Display', 'bold');
    
    let hasAddedPage = false;
    let pageCount = 0;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    for (const group of filteredGroups) {
        for (const product of group.products) {
            if (onlyWithPhotosFlag && !product.imageUrl) continue;
            if (product.quantity <= minQtyValue) continue;

            if (hasAddedPage) { doc.addPage([PAGE_W, PAGE_H]); }
            hasAddedPage = true;
            pageCount++;

            doc.setFillColor("#000000");
            doc.rect(0, 0, PAGE_W, PAGE_H, "F");

            if (product.imageUrl) {
                try {
                    const imgData = await fetchImageAsBase64(product.imageUrl);
                    const dims = await getImageDimensions(imgData);
                    
                    const finalWidth = PAGE_W;
                    const finalHeight = dims.height * (PAGE_W / dims.width);
                    const x = 0;
                    const y = (PAGE_H - finalHeight) / 2;
                    
                    doc.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);
                } catch (imgErr) {
                    doc.setTextColor(255);
                    doc.setFont("Clash Display", "bold");
                    doc.setFontSize(24);
                    doc.text("Image Load Failed", PAGE_W / 2, PAGE_H / 2, { align: "center" });
                }
            } else {
                doc.setTextColor(255);
                doc.setFont("Clash Display", "bold");
                doc.setFontSize(36);
                doc.text("No Photo Available", PAGE_W / 2, PAGE_H / 2, { align: "center" });
            }

            // HEADER
            doc.setTextColor(180, 180, 180);
            doc.setFont("Clash Display", "bold");
            doc.setFontSize(38);
            doc.text(dateStr, 50, 80, { align: "left" });
            doc.text(group.groupName, PAGE_W - 50, 80, { align: "right" });

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(60);
            doc.text("Sri Brundabana Enterprises", PAGE_W / 2, 160, { align: "center" });
            
            doc.setFontSize(50);
            doc.text("Rayagada", PAGE_W / 2, 230, { align: "center" });
            
            // FOOTER
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(64);
            doc.text(product.productName, PAGE_W / 2, PAGE_H - 160, { align: "center" });
            
            doc.setTextColor(255, 215, 0); // Muted gold
            doc.setFontSize(54);
            doc.text(\`Qty: \${product.quantity}\`, PAGE_W / 2, PAGE_H - 80, { align: "center" });
        }
    }
    return { blob: hasAddedPage ? doc.output("blob") : null, pageCount };
};`;

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = replaceFunction(content, 'const generatePdfBlob = async (targetBrands) => {', newBodyWebGeneral);
        content = replaceFunction(content, 'const generatePdfBlobForOneTouch = async (targetBrands, onlyWithPhotosFlag, minQtyValue) => {', newBodyOneTouch);
        fs.writeFileSync(file, content);
        console.log('Patched', file);
    }
}

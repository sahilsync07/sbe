import fs from 'fs';

const file = 'c:/Projects/all-companies/sbe/frontend/src/android/components/PdfGenerator.vue';
let content = fs.readFileSync(file, 'utf8');

const startStr = 'async generatePdfBlobForOneTouch(targetBrands, onlyWithPhotos, minQty) {';
const start = content.indexOf(startStr);
if (start === -1) {
    console.error('start not found');
    process.exit(1);
}

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
        if (content[end] === ',') end++;
        break;
    }
}

if (end === -1) {
    console.error('end not found');
    process.exit(1);
}

const newBodyOneTouch = `async generatePdfBlobForOneTouch(targetBrands, onlyWithPhotos, minQty) {
        const data = this.stockData;
        const normalize = s => s ? s.toLowerCase().trim() : '';
        const filteredGroups = data.filter(g => targetBrands.some(b => normalize(b) === normalize(g.groupName)));
        
        if (filteredGroups.length === 0) return { blob: null, pageCount: 0 };

        const { jsPDF } = await import("jspdf");
        const { clashDisplayBoldBase64 } = await import("../../utils/fonts.js");
        
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
                if (onlyWithPhotos && !product.imageUrl) continue;
                if (minQty > 0 && product.quantity < minQty) continue;

                if (hasAddedPage) { doc.addPage([PAGE_W, PAGE_H]); }
                hasAddedPage = true;
                pageCount++;

                doc.setFillColor("#000000");
                doc.rect(0, 0, PAGE_W, PAGE_H, "F");

                if (product.imageUrl) {
                    try {
                        const imgData = await this.fetchImageAsBase64(product.imageUrl);
                        const dims = await this.getImageDimensions(imgData);
                        
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
        return { blob: pageCount > 0 ? doc.output("blob") : null, pageCount };
    },`;

content = content.substring(0, start) + newBodyOneTouch + content.substring(end);
fs.writeFileSync(file, content);
console.log('Patched Android Component');

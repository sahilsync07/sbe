import fs from 'fs';
const file = 'c:/Projects/all-companies/sbe/frontend/src/components/PdfGenerator.vue';
let content = fs.readFileSync(file, 'utf8');

const startStr = 'const generatePdfBlob = async (targetBrands) => {';
const start = content.indexOf(startStr);
if (start === -1) {
    console.error('start not found');
    process.exit(1);
}

// Find the matching closing bracket for the function
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
        // Found the closing bracket of the arrow function
        // Need to include the semicolon if it exists
        end = i + 1;
        if (content[end] === ';') {
            end++;
        }
        break;
    }
}

if (end === -1) {
    console.error('end not found');
    process.exit(1);
}

const newFunc = `const generatePdfBlob = async (targetBrands) => {
    // 1. Use Cached Data
    const data = stockData.value;
    const filteredGroups = data.filter((group) => targetBrands.includes(group.groupName));
    
    // 2. Setup PDF
    const { jsPDF } = await import("jspdf");
    
    // Fixed dimensions for all images: tall portrait
    const PAGE_W = 800;
    const PAGE_H = 1100;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [PAGE_W, PAGE_H]
    });
    
    let hasAddedPage = false;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    for (const group of filteredGroups) {
        for (const product of group.products) {
            if (onlyWithPhotos.value && !product.imageUrl) continue;
            if (minQtyEnabled.value && product.quantity <= minQty.value) continue;

            if (hasAddedPage) {
                doc.addPage([PAGE_W, PAGE_H]);
            }
            hasAddedPage = true;

            // 1. Solid Black Background
            doc.setFillColor("#000000");
            doc.rect(0, 0, PAGE_W, PAGE_H, "F");

            // 2. Smart Photo Scaling & Centering
            if (product.imageUrl) {
                try {
                    const imgData = await fetchImageAsBase64(product.imageUrl);
                    const dims = await getImageDimensions(imgData);
                    
                    const MAX_W = 800;
                    const MAX_H = 860; 
                    
                    const scale = Math.min(MAX_W / dims.width, MAX_H / dims.height);
                    const finalWidth = dims.width * scale;
                    const finalHeight = dims.height * scale;
                    
                    const x = (PAGE_W - finalWidth) / 2;
                    const y = (PAGE_H - finalHeight) / 2;
                    
                    doc.addImage(imgData, "JPEG", x, y, finalWidth, finalHeight);
                } catch (imgErr) {
                    console.error(\`Image failed: \${product.productName}\`, imgErr);
                    doc.setTextColor(255);
                    doc.setFontSize(16);
                    doc.text("Image Load Failed", PAGE_W / 2, PAGE_H / 2, { align: "center" });
                }
            } else {
                doc.setTextColor(255);
                doc.setFontSize(24);
                doc.text("No Photo Available", PAGE_W / 2, PAGE_H / 2, { align: "center" });
            }

            // 3. Top Extension (Header) - On every page
            doc.setTextColor(255, 255, 255); // White
            doc.setFont("helvetica", "bold");
            doc.setFontSize(26);
            doc.text("Sri Brundabana Enterprises, Rayagada", PAGE_W / 2, 55, { align: "center" });
            
            doc.setTextColor(180, 180, 180); // Light Grey
            doc.setFont("helvetica", "normal");
            doc.setFontSize(18);
            doc.text(\`\${dateStr}  •  \${group.groupName}\`, PAGE_W / 2, 90, { align: "center" });

            // 4. Bottom Extension (Footer)
            doc.setTextColor(255, 255, 255); // White
            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.text(product.productName, PAGE_W / 2, PAGE_H - 90, { align: "center" });
            
            doc.setTextColor(255, 204, 0); // Yellow
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.text(\`Qty: \${product.quantity}\`, PAGE_W / 2, PAGE_H - 45, { align: "center" });
        }
    }
    
    return doc.output("blob");
};`;

content = content.substring(0, start) + newFunc + content.substring(end);
fs.writeFileSync(file, content);
console.log('patched successfully');

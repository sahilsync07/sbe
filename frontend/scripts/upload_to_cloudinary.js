import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure fetching is available (Node 18+)
// Configuration
const CLOUD_NAME = 'dg365ewal';
const UPLOAD_PRESET = 'sbe-stock';
const SOURCE_DIR = path.resolve(__dirname, '../src/assets/Carousal Pics');
const OUTPUT_FILE = path.resolve(__dirname, 'cloudinary_links.json');

// Get all files in the directory
function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath));
        } else {
            // Filter images
            if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
                 results.push(filePath);
            }
        }
    });
    return results;
}

async function uploadToCloudinary(filePath, fileName) {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, fileName);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.secure_url) {
            console.log(`[OK] Uploaded ${fileName}`);
            return data.secure_url;
        } else {
            console.error(`[FAIL] ${fileName}: ${JSON.stringify(data)}`);
            return null;
        }
    } catch(err) {
        console.error(`[ERROR] ${fileName}:`, err.message);
        return null;
    }
}

async function run() {
    console.log(`Scanning directory: ${SOURCE_DIR}`);
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error('Directory does not exist!');
        process.exit(1);
    }
    
    const files = getFiles(SOURCE_DIR);
    console.log(`Found ${files.length} images. Starting upload...`);
    
    const imageMap = {};
    let successCount = 0;
    
    for (const filePath of files) {
        const fileName = path.basename(filePath);
        // Avoid re-uploading if output already has it (resume run support)
        // For simplicity now, we reupload
        const url = await uploadToCloudinary(filePath, fileName);
        if (url) {
            imageMap[fileName] = url;
            successCount++;
        }
        
        // Wait a bit to not overwhelm rate limits (simple backoff)
        await new Promise(r => setTimeout(r, 500));
    }
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageMap, null, 2));
    console.log(`\nUpload complete: ${successCount}/${files.length} successful.`);
    console.log(`Mapping saved to: ${OUTPUT_FILE}`);
}

run();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure fetching is available (Node 18+)
// Configuration
// Configuration: Dual-cloud support
const PRIMARY_CLOUD = {
    name: 'Primary',
    cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dg365ewal',
    uploadPreset: process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'sbe-stock',
    folder: ''
};

const SECONDARY_CLOUD = {
    name: 'Secondary',
    cloudName: process.env.VITE_CLOUDINARY_SECONDARY_CLOUD_NAME || 'dieqsg5tr',
    uploadPreset: process.env.VITE_CLOUDINARY_SECONDARY_UPLOAD_PRESET || 'e-sbe-pics',
    folder: process.env.VITE_CLOUDINARY_SECONDARY_FOLDER || 'e-sbe'
};

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

async function uploadToSingleCloud(cloud, filePath, fileName) {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, fileName);
    formData.append('upload_preset', cloud.uploadPreset);
    if (cloud.folder) formData.append('folder', cloud.folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error(data.error?.message || JSON.stringify(data));
    }
}

async function uploadToCloudinary(filePath, fileName) {
    const clouds = [PRIMARY_CLOUD, SECONDARY_CLOUD];
    for (const cloud of clouds) {
        try {
            const url = await uploadToSingleCloud(cloud, filePath, fileName);
            console.log(`[OK] Uploaded ${fileName} via ${cloud.name} (${cloud.cloudName})`);
            return url;
        } catch (err) {
            console.warn(`[WARN] ${cloud.name} (${cloud.cloudName}) failed for ${fileName}: ${err.message}. Trying next cloud...`);
        }
    }
    console.error(`[FAIL] ${fileName}: Failed across all cloud providers`);
    return null;
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

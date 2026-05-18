const https = require('https');
const fs = require('fs');

function downloadFont(url, name) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = [];
            if (res.statusCode === 302 || res.statusCode === 301) {
                https.get(res.headers.location, (redirectRes) => {
                    redirectRes.on('data', (chunk) => data.push(chunk));
                    redirectRes.on('end', () => {
                        const buffer = Buffer.concat(data);
                        const base64 = buffer.toString('base64');
                        resolve(base64);
                    });
                });
            } else {
                res.on('data', (chunk) => data.push(chunk));
                res.on('end', () => {
                    const buffer = Buffer.concat(data);
                    const base64 = buffer.toString('base64');
                    resolve(base64);
                });
            }
        });
    });
}

(async () => {
    const regular = await downloadFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto-Regular');
    const bold = await downloadFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf', 'Roboto-Bold');
    
    // Replace the fonts in fonts.js
    let content = fs.readFileSync('src/utils/fonts.js', 'utf8');
    
    // Remove the previously appended Roboto fonts
    content = content.replace(/export const robotoRegularBase64 = "[^"]+";\n/g, '');
    content = content.replace(/export const robotoBoldBase64 = "[^"]+";\n/g, '');
    
    // Append the new ones
    content += `\nexport const robotoRegularBase64 = "${regular}";\n`;
    content += `export const robotoBoldBase64 = "${bold}";\n`;
    
    fs.writeFileSync('src/utils/fonts.js', content);
    console.log('Fonts updated successfully!');
})();

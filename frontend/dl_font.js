import https from 'https';
import fs from 'fs';

const url = 'https://cdn.fontshare.com/wf/BFBSY7LX5W2U2EROCLVVTQP4VS7S4PC3/IIUX4FGTMD2LK2VWD3RVTAS4SSMUN7B5/53RZKGODFYDW3QHTIL7IPOWTBCSUEZK7.ttf';

https.get(url, (res) => {
    let chunks = [];
    res.on('data', (chunk) => {
        chunks.push(chunk);
    });
    res.on('end', () => {
        let buffer = Buffer.concat(chunks);
        let base64 = buffer.toString('base64');
        let fileContent = `export const clashDisplayBoldBase64 = "${base64}";\n`;
        fs.writeFileSync('c:/Projects/all-companies/sbe/frontend/src/utils/fonts.js', fileContent);
        console.log('Saved fonts.js');
    });
}).on('error', (e) => {
    console.error(e);
});

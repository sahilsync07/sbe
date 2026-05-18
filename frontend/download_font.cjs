const https = require('https');
const fs = require('fs');

https.get('https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf', (res) => {
    let data = [];
    
    if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (redirectRes) => {
            redirectRes.on('data', (chunk) => data.push(chunk));
            redirectRes.on('end', () => {
                const buffer = Buffer.concat(data);
                const base64 = buffer.toString('base64');
                fs.appendFileSync('src/utils/fonts.js', '\nexport const robotoRegularBase64 = "' + base64 + '";\n');
                console.log('Done redirect!');
            });
        });
    } else {
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
            const buffer = Buffer.concat(data);
            const base64 = buffer.toString('base64');
            fs.appendFileSync('src/utils/fonts.js', '\nexport const robotoRegularBase64 = "' + base64 + '";\n');
            console.log('Done!');
        });
    }
}).on('error', (e) => {
    console.error(e);
});

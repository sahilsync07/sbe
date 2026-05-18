const fs = require('fs');
let content = fs.readFileSync('src/utils/fonts.js', 'utf8');

// Match clashDisplayBoldBase64
const clashMatch = content.match(/export const clashDisplayBoldBase64 = "([^"]+)";/);

// Match all occurrences of robotoRegularBase64 and robotoBoldBase64
const regularMatches = [...content.matchAll(/export const robotoRegularBase64 = "([^"]+)";/g)];
const boldMatches = [...content.matchAll(/export const robotoBoldBase64 = "([^"]+)";/g)];

// We want the LAST non-empty match
let clash = clashMatch ? clashMatch[1] : '';
let regular = regularMatches.filter(m => m[1].length > 0).pop()[1];
let bold = boldMatches.filter(m => m[1].length > 0).pop()[1];

fs.writeFileSync('src/utils/fonts.js', `export const clashDisplayBoldBase64 = "${clash}";\n\nexport const robotoRegularBase64 = "${regular}";\n\nexport const robotoBoldBase64 = "${bold}";\n`);
console.log('Cleaned up fonts.js!');

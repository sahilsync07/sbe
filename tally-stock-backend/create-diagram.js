const fs = require("fs");
const path = require("path");
const d3 = require("d3-hierarchy");

function scanDir(dir, depth = 0) {
  if (depth > 5) return [];
  let results = [];
  fs.readdirSync(dir).forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (
      stat.isDirectory() &&
      ![
        "node_modules",
        ".github",
        ".vscode",
        "dist",
        "build",
        "public",
      ].includes(item)
    ) {
      results.push({ name: item, children: scanDir(fullPath, depth + 1) });
    } else if (
      stat.isFile() &&
      !item.match(/\.(png|jpg|min\.js|map|json|bat)$/)
    ) {
      results.push({ name: item, size: stat.size });
    }
  });
  return results;
}

const data = { name: "sbe", children: scanDir(".") };
const pack = d3.pack().size([1000, 1000]).padding(3);
const root = d3.hierarchy(data).sum((d) => d.size || 0);
const nodes = pack(root).descendants();

const colors = {
  ".js": "#f1e05a",
  ".vue": "#41b883",
  ".css": "#563d7c",
  ".svg": "#ff9900",
  ".md": "#083fa1",
  default: "#999999",
};

const svg = `
<svg width="1000" height="1000" viewBox="0 0 1000 1000">
  ${nodes
    .map((d) => {
      const ext =
        path.extname(d.data.name) || (d.data.children ? "folder" : "default");
      const color = colors[ext] || colors.default;
      return `<circle cx="${d.x}" cy="${d.y}" r="${
        d.r
      }" fill="${color}" opacity="0.7" />
            ${
              d.r > 20
                ? `<text x="${d.x}" y="${d.y}" font-size="${Math.max(
                    8,
                    d.r / 5
                  )}" text-anchor="middle" fill="#000">${d.data.name}</text>`
                : ""
            }`;
    })
    .join("")}
</svg>`;
fs.writeFileSync("diagram.svg", svg);
console.log("Diagram generated: diagram.svg");

const express = require("express");
const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const port = 3000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://sahilsync07.github.io"],
  })
);
app.use(express.json());

const tallyUrl = "http://localhost:9000/";
const stockDataPath = path.resolve(
  __dirname,
  "../../frontend/src/assets/stock-data.json"
);
const publicStockDataPath = path.resolve(
  __dirname,
  "../../frontend/public/assets/stock-data.json"
);
const tallyTimeout = 30000;

const tallyRequestXML = `<?xml version="1.0"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Stock Summary</REPORTNAME>
        <STATICVARIABLES>
          <EXPLODEFLAG>Yes</EXPLODEFLAG>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

async function fetchTallyData() {
  try {
    console.log("Fetching data from Tally:", tallyUrl);
    const response = await axios.post(tallyUrl, tallyRequestXML, {
      headers: { "Content-Type": "text/xml" },
      timeout: tallyTimeout,
    });
    console.log(
      "Tally response status:",
      response.status,
      "Data length:",
      response.data.length
    );
    if (!response.data.trim()) {
      throw new Error("Empty Tally response");
    }

    const parsedData = parser.parse(response.data);
    const envelope = parsedData.ENVELOPE;
    if (!envelope || !envelope.DSPACCNAME || !envelope.DSPSTKINFO) {
      throw new Error("Invalid or empty Tally response");
    }

    const dspAccNames = Array.isArray(envelope.DSPACCNAME)
      ? envelope.DSPACCNAME
      : [envelope.DSPACCNAME].filter(Boolean);
    const dspStkInfos = Array.isArray(envelope.DSPSTKINFO)
      ? envelope.DSPSTKINFO
      : [envelope.DSPSTKINFO].filter(Boolean);

    if (dspAccNames.length !== dspStkInfos.length) {
      throw new Error("Mismatched DSPACCNAME and DSPSTKINFO counts");
    }

    const stockGroups = {};
    let currentGroup = "Stock";

    // Hardcoded list of group names (case-insensitive comparison)
    const groupNames = [
      "4WAY SPORT",
      "ADDA",
      "ADDOXY",
      "AGRA",
      "AIRSUN",
      "Avon International (WOODS)",
      "CUBIX",
      "Eeken",
      "Electrical & Electronic",
      "Escoute",
      "Fencer",
      "Fender",
      "Florex (Swastik)",
      "GLAMIUM",
      "Hawai Chappal",
      "HITWAY",
      "KHADIM",
      "Kohinoor",
      "LEO",
      "Magnet",
      "Max",
      "NON BRAND",
      "OTHERS",
      "PARAGON",
      "Paragon Blot",
      "PARAGON COMFY",
      "Paralite",
      "P-TOES",
      "PU-LION",
      "RELIANCE FOOTWEAR",
      "Safety",
      "School",
      "Solea & Meriva , Mascara",
      "S S BANSAL",
      "Stimulus",
      "VERTEX, SLICKERS & FENDER",
      "Walkaholic",
      "Xpania",
      "ZYF TEX",
    ];

    dspAccNames.forEach((acc, index) => {
      const name = acc.DSPDISPNAME || `Unknown ${index}`;
      const stkCl = dspStkInfos[index]?.DSPSTKCL || {};
      const quantity = stkCl.DSPCLQTY || "";
      const rate = parseFloat(stkCl.DSPCLRATE || "0");
      const amount = parseFloat(stkCl.DSPCLAMTA || "0");

      // Check if the name matches any hardcoded group name (case-insensitive)
      const isGroup =
        !quantity.trim() ||
        groupNames.some((group) => name.toLowerCase() === group.toLowerCase());

      if (isGroup) {
        currentGroup = name;
        if (!stockGroups[currentGroup]) {
          stockGroups[currentGroup] = { products: [], totalAmount: 0 };
        }
        stockGroups[currentGroup].totalAmount += amount;
      } else {
        const qtyValue = parseFloat(quantity.replace(/[^0-9.-]/g, "") || "0");
        if (!stockGroups[currentGroup]) {
          stockGroups[currentGroup] = { products: [], totalAmount: 0 };
        }
        stockGroups[currentGroup].products.push({
          productName: name,
          quantity: qtyValue,
          rate,
          amount,
          imageUrl: null,
        });
        stockGroups[currentGroup].totalAmount += amount;
      }
    });

    const stockData = Object.entries(stockGroups).map(([groupName, value]) => ({
      groupName,
      products: value.products,
      totalAmount: value.totalAmount,
    }));

    if (!stockData.length) {
      throw new Error("No valid stock data processed from Tally");
    }

    return stockData;
  } catch (error) {
    console.error("Error fetching Tally data:", error.message, error.stack);
    throw error;
  }
}

app.get("/api/stock", async (req, res) => {
  try {
    const stockData = await fetchTallyData();
    res.json(stockData);
  } catch (error) {
    console.error("Error in /api/stock:", error.message);
    res
      .status(500)
      .json({ error: `Failed to fetch stock data: ${error.message}` });
  }
});

app.post("/api/updateStockData", async (req, res) => {
  try {
    console.log("Starting updateStockData, stockDataPath:", stockDataPath);

    try {
      await fs.access(stockDataPath, fs.constants.R_OK | fs.constants.W_OK);
      console.log("stock-data.json is readable and writable");
    } catch (err) {
      console.error("File access error:", err.message, err.code);
      throw new Error(`Cannot access stock-data.json: ${err.message}`);
    }

    let existingData = [];
    try {
      const fileContent = await fs.readFile(stockDataPath, "utf-8");
      if (fileContent.trim()) {
        existingData = JSON.parse(fileContent);
        console.log(
          "Existing stock-data.json loaded, groups:",
          existingData.length
        );
      }
    } catch (err) {
      console.error("Error reading stock-data.json:", err.message, err.stack);
      existingData = [];
    }

    const imageUrls = {};
    existingData.forEach((group) => {
      if (group.products) {
        group.products.forEach((product) => {
          if (product.imageUrl) {
            imageUrls[product.productName] = product.imageUrl;
          }
        });
      }
    });
    console.log("Preserved image URLs:", Object.keys(imageUrls).length);

    const stockData = await fetchTallyData();

    stockData.forEach((group) => {
      group.products.forEach((product) => {
        product.imageUrl = imageUrls[product.productName] || null;
      });
    });

    try {
      await fs.writeFile(stockDataPath, JSON.stringify(stockData, null, 2));
      await fs.writeFile(
        publicStockDataPath,
        JSON.stringify(stockData, null, 2)
      );
      console.log("Updated stock-data.json at:", stockDataPath);
    } catch (err) {
      console.error("Error writing stock-data.json:", err.message, err.stack);
      throw new Error(`Cannot write to stock-data.json: ${err.message}`);
    }

    res.json({
      message: "Stock data updated successfully",
      data: stockData,
    });
  } catch (error) {
    console.error("Error in updateStockData:", error.message, error.stack);
    res
      .status(500)
      .json({ error: `Failed to update stock data: ${error.message}` });
  }
});

app.post("/api/updateImage", async (req, res) => {
  try {
    const { productName, imageUrl } = req.body;
    if (!productName || !imageUrl) {
      throw new Error("Missing productName or imageUrl");
    }

    try {
      await fs.access(stockDataPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      throw new Error(`Cannot access stock-data.json: ${err.message}`);
    }

    let stockData = [];
    try {
      const fileContent = await fs.readFile(stockDataPath, "utf-8");
      if (fileContent.trim()) {
        stockData = JSON.parse(fileContent);
      }
    } catch (err) {
      throw new Error(`Error reading stock-data.json: ${err.message}`);
    }

    let updated = false;
    stockData.forEach((group) => {
      group.products.forEach((product) => {
        if (product.productName === productName) {
          product.imageUrl = imageUrl;
          updated = true;
        }
      });
    });

    if (!updated) {
      throw new Error(`Product ${productName} not found`);
    }

    try {
      await fs.writeFile(stockDataPath, JSON.stringify(stockData, null, 2));
      await fs.writeFile(
        publicStockDataPath,
        JSON.stringify(stockData, null, 2)
      );
      console.log(`Updated imageUrl for ${productName} in stock-data.json`);
    } catch (err) {
      throw new Error(`Cannot write to stock-data.json: ${err.message}`);
    }

    res.json({ message: `Image URL updated for ${productName}` });
  } catch (error) {
    console.error("Error in updateImage:", error.message, error.stack);
    res.status(500).json({ error: `Failed to update image: ${error.message}` });
  }
});

app.post("/api/removeImage", async (req, res) => {
  try {
    const { productName } = req.body;
    if (!productName) {
      throw new Error("Missing productName");
    }

    try {
      await fs.access(stockDataPath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      throw new Error(`Cannot access stock-data.json: ${err.message}`);
    }

    let stockData = [];
    try {
      const fileContent = await fs.readFile(stockDataPath, "utf-8");
      if (fileContent.trim()) {
        stockData = JSON.parse(fileContent);
      }
    } catch (err) {
      throw new Error(`Error reading stock-data.json: ${err.message}`);
    }

    let updated = false;
    stockData.forEach((group) => {
      group.products.forEach((product) => {
        if (product.productName === productName && product.imageUrl) {
          product.imageUrl = null;
          updated = true;
        }
      });
    });

    if (!updated) {
      throw new Error(`Product ${productName} not found or has no image`);
    }

    try {
      await fs.writeFile(stockDataPath, JSON.stringify(stockData, null, 2));
      await fs.writeFile(
        publicStockDataPath,
        JSON.stringify(stockData, null, 2)
      );
      console.log(`Removed image for ${productName} in stock-data.json`);
    } catch (err) {
      throw new Error(`Cannot write to stock-data.json: ${err.message}`);
    }

    res.json({ message: `Image removed for ${productName}` });
  } catch (error) {
    console.error("Error in removeImage:", error.message, error.stack);
    res.status(500).json({ error: `Failed to remove image: ${error.message}` });
  }
});

app.get("/api/tally-health", async (req, res) => {
  try {
    const response = await axios.post(tallyUrl, tallyRequestXML, {
      timeout: tallyTimeout,
      headers: { "Content-Type": "text/xml" },
    });
    console.log("Tally health check success:", response.status);
    res.json({
      status: "success",
      data: "Tally is reachable",
      code: response.status,
    });
  } catch (error) {
    console.error("Tally health check failed:", error.message, error.stack);
    res.status(500).json({ error: `Tally unreachable: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

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
  "../../frontend/public/assets/stock-data.json"
);
const ledgerDataPath = path.resolve(
  __dirname,
  "../../frontend/public/assets/ledger-data.json"
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
          <SVZEROQTY>Yes</SVZEROQTY>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

// Fetch all ledgers with their parent group and balances
const ledgerListXML = `<?xml version="1.0"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>AllLedgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllLedgers">
            <TYPE>Ledger</TYPE>
            <NATIVEMETHOD>Name</NATIVEMETHOD>
            <NATIVEMETHOD>Parent</NATIVEMETHOD>
            <NATIVEMETHOD>OpeningBalance</NATIVEMETHOD>
            <NATIVEMETHOD>ClosingBalance</NATIVEMETHOD>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

// Server-side aggregation: GROUP BY (LedgerName, VoucherType, Date, VoucherNo) SUM(Amount)
// Uses Tally's Aggr Compute to aggregate INSIDE Tally — returns ~7MB vs 92MB raw
const voucherSummaryXML = `<?xml version="1.0"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>LedgerSummary</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        <SVFROMDATE>20250401</SVFROMDATE>
        <SVTODATE>20260331</SVTODATE>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllVch" ISINITIALIZE="Yes">
            <TYPE>Voucher</TYPE>
            <FETCH>VoucherTypeName, Date, VoucherNumber</FETCH>
          </COLLECTION>
          <COLLECTION NAME="LedgerSummary">
            <SOURCECOLLECTION>AllVch</SOURCECOLLECTION>
            <WALK>Ledger Entries</WALK>
            <BY>LdgName : $LedgerName</BY>
            <BY>VchType : $..VoucherTypeName</BY>
            <BY>VchDate : $..Date</BY>
            <BY>VchNo : $..VoucherNumber</BY>
            <AGGRCOMPUTE>TotalAmt : Sum : $Amount</AGGRCOMPUTE>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
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

    require("dotenv").config({ path: path.resolve(__dirname, "../../frontend/.env") });

    // Load Company Config
    const configFileName = process.env.VITE_CONFIG_FILE || 'sbe.json';
    const configPath = path.resolve(__dirname, `../../frontend/public/config/${configFileName}`);
    let companyConfig = {};
    try {
      const configFileContent = await fs.readFile(configPath, 'utf-8');
      companyConfig = JSON.parse(configFileContent);
      console.log(`Loaded company config: ${configFileName}`);
    } catch (err) {
      console.error(`Failed to load config file: ${configPath}`, err.message);
      // Fallback or critical error? Critical as we need groups.
      throw new Error(`Critical: Cannot load config file ${configFileName}`);
    }

    const stockGroups = {};
    let currentGroup = "Stock";

    // Use groups from config (case-insensitive comparison)
    const groupNames = companyConfig.tallyGroups || [];

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
          // rate and amount removed for privacy
          imageUrl: null,
        });
        stockGroups[currentGroup].totalAmount += amount;
      }
    });

    const stockData = Object.entries(stockGroups).map(([groupName, value]) => ({
      groupName,
      products: value.products,
      // totalAmount removed for privacy
    }));

    if (!stockData.length) {
      throw new Error("No valid stock data processed from Tally");
    }

    return stockData;
  } catch (error) {
    // Enhanced error messages for better debugging
    if (error.code === 'ECONNREFUSED') {
      const errorMsg = `❌ Cannot connect to Tally at ${tallyUrl}\n` +
        `   → Is Tally running?\n` +
        `   → Is Tally's web server enabled? (Gateway > F3 > Company Features > Enable Tally as web server)\n` +
        `   → Check if port 9000 is correct`;
      console.error(errorMsg);
      throw new Error("Tally connection refused. Ensure Tally is running with web server enabled on port 9000.");
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.error(`❌ Tally connection timeout after ${tallyTimeout}ms`);
      throw new Error("Tally connection timeout. Tally may be unresponsive.");
    } else if (error.code === 'ENOTFOUND') {
      console.error("❌ Tally host not found");
      throw new Error("Tally host not found. Check tallyUrl configuration.");
    } else {
      console.error("Error fetching Tally data:", error.message);
      throw error;
    }
  }
}

// ============================================================
//  LEDGER DATA FUNCTIONS
// ============================================================

async function fetchLedgerData() {
  try {
    console.log("📒 Fetching ledger data from Tally...");

    // ---- Step 1: Fetch all ledgers with parent group ----
    console.log("  → Step 1: Fetching ledger list...");
    const ledgerResponse = await axios.post(tallyUrl, ledgerListXML, {
      headers: { "Content-Type": "text/xml" },
      timeout: tallyTimeout,
    });

    if (!ledgerResponse.data || !ledgerResponse.data.toString().trim()) {
      throw new Error("Empty ledger list response from Tally");
    }

    const ledgerParsed = parser.parse(ledgerResponse.data);
    // Tally returns structure: ENVELOPE > BODY > DATA > COLLECTION > LEDGER
    const ledgerCollection =
      ledgerParsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER ||
      ledgerParsed?.ENVELOPE?.COLLECTION?.LEDGER ||
      ledgerParsed?.ENVELOPE?.LEDGER;

    if (!ledgerCollection) {
      console.error("Ledger parsed keys:", JSON.stringify(Object.keys(ledgerParsed?.ENVELOPE || {})));
      throw new Error("No ledger data found in Tally response");
    }

    const ledgers = Array.isArray(ledgerCollection)
      ? ledgerCollection
      : [ledgerCollection];

    console.log(`  ✅ Found ${ledgers.length} ledgers`);

    // Build group → ledgers map
    const groupMap = {};
    ledgers.forEach((ledger) => {
      // Tally puts name in @_NAME attribute
      const name = ledger["@_NAME"] || ledger.NAME || "Unknown";
      const parent = typeof ledger.PARENT === "object" ? (ledger.PARENT["#text"] || "Ungrouped") : (ledger.PARENT || "Ungrouped");
      const openingBalRaw = typeof ledger.OPENINGBALANCE === "object" ? (ledger.OPENINGBALANCE["#text"] || "0") : (ledger.OPENINGBALANCE || "0");
      const closingBalRaw = typeof ledger.CLOSINGBALANCE === "object" ? (ledger.CLOSINGBALANCE["#text"] || "0") : (ledger.CLOSINGBALANCE || "0");
      const openingBal = parseFloat(openingBalRaw);
      const closingBal = parseFloat(closingBalRaw);

      if (!groupMap[parent]) {
        groupMap[parent] = [];
      }
      groupMap[parent].push({
        ledgerName: name,
        openingBalance: openingBal,
        closingBalance: closingBal,
        entries: [],
      });
    });

    // ---- Step 2: Fetch aggregated voucher summaries (server-side via Aggr Compute) ----
    try {
      console.log("  → Step 2: Fetching voucher summaries (server-side aggregation)...");
      const voucherResponse = await axios.post(tallyUrl, voucherSummaryXML, {
        headers: { "Content-Type": "text/xml" },
        timeout: tallyTimeout * 2,
      });

      if (voucherResponse.data && voucherResponse.data.toString().trim()) {
        const voucherParsed = parser.parse(voucherResponse.data);

        // Tally returns aggregated data as OBJECT entries inside BODY > DATA > COLLECTION
        const summaryCollection =
          voucherParsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.OBJECT ||
          voucherParsed?.ENVELOPE?.COLLECTION?.OBJECT ||
          voucherParsed?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGERSUMMARY ||
          voucherParsed?.ENVELOPE?.COLLECTION?.LEDGERSUMMARY;

        if (summaryCollection) {
          const entries = Array.isArray(summaryCollection)
            ? summaryCollection
            : [summaryCollection];

          console.log(`  ✅ Found ${entries.length} aggregated voucher entries`);

          // Helper: extract text value from Tally field (handles TYPE attribute objects)
          const getVal = (obj) => {
            if (obj === null || obj === undefined) return "";
            if (typeof obj === "object") return obj["#text"] || "";
            return obj.toString();
          };

          // Build map: ledgerName → [{ date, voucherNo, type, amount, drCr }]
          const ledgerEntriesMap = {};

          entries.forEach((entry) => {
            const ledgerName = getVal(entry.LDGNAME) || "Unknown";
            const voucherType = getVal(entry.VCHTYPE) || "Other";
            const voucherDate = getVal(entry.VCHDATE) || "";
            const voucherNo = getVal(entry.VCHNO) || "";
            const totalAmt = parseFloat(getVal(entry.TOTALAMT) || "0");

            // Tally convention: negative = Dr, positive = Cr
            const drCr = totalAmt < 0 ? "Dr" : "Cr";
            const amount = Math.round(Math.abs(totalAmt) * 100) / 100;

            if (!ledgerEntriesMap[ledgerName]) {
              ledgerEntriesMap[ledgerName] = [];
            }

            ledgerEntriesMap[ledgerName].push({
              date: voucherDate,
              voucherNo,
              type: voucherType,
              amount,
              drCr,
            });
          });

          // Merge entries into the groupMap
          Object.values(groupMap).forEach((ledgerList) => {
            ledgerList.forEach((ledger) => {
              if (ledgerEntriesMap[ledger.ledgerName]) {
                ledger.entries = ledgerEntriesMap[ledger.ledgerName];
              }
            });
          });

          console.log(`  ✅ Merged voucher data for ${Object.keys(ledgerEntriesMap).length} ledgers`);
        } else {
          console.warn("  ⚠️ No aggregated voucher data in response");
        }
      }
    } catch (voucherErr) {
      console.warn(`  ⚠️ Voucher summary fetch failed (${voucherErr.code || voucherErr.message}), continuing without entries`);
    }

    // ---- Build final structure ----
    const ledgerData = Object.entries(groupMap).map(([groupName, ledgerList]) => ({
      groupName,
      ledgers: ledgerList,
    }));

    // Sort groups alphabetically
    ledgerData.sort((a, b) => a.groupName.localeCompare(b.groupName));

    console.log(`📒 Ledger data processed: ${ledgerData.length} groups`);
    return ledgerData;
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.error(`❌ Cannot connect to Tally at ${tallyUrl} for ledger data`);
      throw new Error("Tally connection refused. Ensure Tally is running with web server enabled on port 9000.");
    } else if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      console.error(`❌ Tally connection timeout for ledger data`);
      throw new Error("Tally connection timeout. Tally may be unresponsive.");
    } else {
      console.error("Error fetching ledger data:", error.message);
      throw error;
    }
  }
}

async function syncLedgerToFile() {
  console.log("📒 Syncing ledger data to file...");

  let ledgerData;
  try {
    ledgerData = await fetchLedgerData();
  } catch (err) {
    console.error("⚠️ Ledger fetch failed:", err.message);
    // Try to use existing data
    try {
      const existing = await fs.readFile(ledgerDataPath, "utf-8");
      if (existing.trim() && existing.trim() !== "[]") {
        console.log("📋 Using existing ledger data as fallback");
        return { success: false, fallback: true, error: err.message };
      }
    } catch (_) { /* no existing file */ }
    return { success: false, fallback: false, error: err.message };
  }

  // Add metadata
  const lastSyncTime = new Date().toISOString();
  ledgerData.unshift({
    groupName: "_META_DATA_",
    lastSync: lastSyncTime,
    ledgers: [],
  });

  try {
    await fs.writeFile(ledgerDataPath, JSON.stringify(ledgerData, null, 2));
    console.log("✅ Updated ledger-data.json at:", ledgerDataPath);
    return { success: true, groups: ledgerData.length - 1, lastSync: lastSyncTime };
  } catch (err) {
    console.error("Error writing ledger-data.json:", err.message);
    throw new Error(`Cannot write to ledger-data.json: ${err.message}`);
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

// --- Ledger endpoints ---

app.get("/api/ledger", async (req, res) => {
  try {
    const ledgerData = await fetchLedgerData();
    res.json(ledgerData);
  } catch (error) {
    console.error("Error in /api/ledger:", error.message);
    res.status(500).json({ error: `Failed to fetch ledger data: ${error.message}` });
  }
});

app.post("/api/updateLedgerData", async (req, res) => {
  try {
    const result = await syncLedgerToFile();
    if (result.success) {
      res.json({
        message: "Ledger data updated successfully from Tally",
        groups: result.groups,
        lastSync: result.lastSync,
      });
    } else if (result.fallback) {
      res.json({
        message: "Tally unavailable - using existing ledger data",
        tallyError: result.error,
      });
    } else {
      res.status(503).json({
        error: "Tally unavailable and no existing ledger data found",
        message: result.error,
      });
    }
  } catch (error) {
    console.error("Error in /api/updateLedgerData:", error.message);
    res.status(500).json({ error: `Failed to update ledger data: ${error.message}` });
  }
});

app.post("/api/updateStockData", async (req, res) => {
  try {
    console.log("Starting updateStockData, stockDataPath:", stockDataPath);

    // ---- 1. Verify file access ------------------------------------------------
    try {
      await fs.access(stockDataPath, fs.constants.R_OK | fs.constants.W_OK);
      console.log("stock-data.json is readable and writable");
    } catch (err) {
      console.error("File access error:", err.message, err.code);
      throw new Error(`Cannot access stock-data.json: ${err.message}`);
    }

    // ---- 2. Load existing JSON ------------------------------------------------
    let existingData = [];
    try {
      const fileContent = await fs.readFile(stockDataPath, "utf-8");
      if (fileContent.trim()) {
        existingData = JSON.parse(fileContent);
        console.log("Existing stock-data.json loaded, groups:", existingData.length);
      }
    } catch (err) {
      console.error("Error reading stock-data.json:", err.message, err.stack);
      existingData = [];
    }

    // ---- 3. Preserve images + zero-stock products that have images ----------
    // ---- 3. Preserve images, timestamps & zero-stock products with images ----------
    const productMeta = {};               // productName → { imageUrl, imageUploadedAt, firstSeenAt }
    const zeroStockProducts = {};           // groupName → [product,…]

    existingData.forEach((group) => {
      if (!group.products) return;

      group.products.forEach((product) => {
        // Save metadata for ALL known products to track "first seen"
        productMeta[product.productName] = {
          imageUrl: product.imageUrl || null,
          imageUploadedAt: product.imageUploadedAt || null,
          firstSeenAt: product.firstSeenAt || null
        };

        if (product.quantity === 0 && product.imageUrl) {
          const { rate, amount, ...cleanProduct } = product; // Remove sensitive data
          (zeroStockProducts[group.groupName] ??= []).push(cleanProduct);
        }
      });
    });
    console.log("Preserved existing product metadata:", Object.keys(productMeta).length);
    console.log("Preserved zero-stock products with images:", Object.keys(zeroStockProducts).length);

    // ---- 4. Fetch fresh data from Tally --------------------------------------
    let stockData;
    try {
      stockData = await fetchTallyData();
      console.log("✅ Successfully fetched fresh data from Tally");
    } catch (tallyError) {
      console.error("⚠️  Tally fetch failed:", tallyError.message);
      console.log("📋 Using existing stock data as fallback");

      // Return existing data without modification if Tally is unavailable
      if (existingData.length === 0) {
        return res.status(503).json({
          error: "Tally unavailable and no existing data found",
          message: tallyError.message,
          suggestion: "Ensure Tally is running with web server enabled on port 9000"
        });
      }

      return res.json({
        message: "Tally unavailable - using existing data",
        tallyError: tallyError.message,
        dataAge: existingData.find(g => g.groupName === "_META_DATA_")?.lastSync || "unknown",
        data: existingData
      });
    }

    // ---- 5. Re-attach images, timestamps & re-inject zero-stock items --------
    // ---- 6. De-duplicate by productName ------------------------------------
    stockData.forEach((group) => {
      // attach saved info to live products
      group.products.forEach((p) => {
        const saved = productMeta[p.productName];
        if (saved) {
          p.imageUrl = saved.imageUrl;
          p.imageUploadedAt = saved.imageUploadedAt;
          p.firstSeenAt = saved.firstSeenAt; // Preserve original seen time
        } else {
          // New product from Tally!
          p.imageUrl = null;
          p.firstSeenAt = new Date().toISOString(); // Mark as new
        }
      });

      // bring back zero-stock items that had an image
      if (zeroStockProducts[group.groupName]) {
        group.products.push(...zeroStockProducts[group.groupName]);
      }

      const seen = new Set();
      group.products = group.products.filter((p) => {
        if (seen.has(p.productName)) return false;
        seen.add(p.productName);
        return true;
      });
    });

    // ---- 7. Inject Last Sync Metadata ---------------------------------------
    // Add metadata at the start of the array or as a special entry
    const lastSyncTime = new Date().toISOString();
    stockData.unshift({
      groupName: "_META_DATA_",
      lastSync: lastSyncTime,
      products: [],
    });

    // ---- 8. Write updated files ------------------------------------------------
    try {
      await fs.writeFile(stockDataPath, JSON.stringify(stockData, null, 2));
      console.log("Updated stock-data.json at:", stockDataPath);
    } catch (err) {
      console.error("Error writing stock-data.json:", err.message, err.stack);
      throw new Error(`Cannot write to stock-data.json: ${err.message}`);
    }

    // ---- 9. Also sync ledger data ------------------------------------------------
    let ledgerResult = { success: false, error: "Not attempted" };
    try {
      ledgerResult = await syncLedgerToFile();
      console.log("📒 Ledger sync result:", ledgerResult.success ? "✅ Success" : "⚠️ " + ledgerResult.error);
    } catch (ledgerErr) {
      console.error("⚠️ Ledger sync error (non-fatal):", ledgerErr.message);
      ledgerResult = { success: false, error: ledgerErr.message };
    }

    res.json({
      message: "Stock data updated successfully from Tally",
      data: stockData,
      ledgerSync: ledgerResult,
    });
  } catch (error) {
    console.error("Error in updateStockData:", error.message, error.stack);
    res
      .status(500)
      .json({ error: `Failed to update stock data: ${error.message}` });
  }
});

// ... (all other routes unchanged)

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
      if (group.totalAmount !== undefined) delete group.totalAmount; // Ensure group total is removed
      group.products.forEach((product) => {
        if (product.rate !== undefined) delete product.rate; // Ensure rate is removed
        if (product.amount !== undefined) delete product.amount; // Ensure amount is removed

        if (product.productName === productName) {
          product.imageUrl = imageUrl;
          product.imageUploadedAt = new Date().toISOString();
          updated = true;
        }
      });
    });

    if (!updated) {
      throw new Error(`Product ${productName} not found`);
    }

    try {
      await fs.writeFile(stockDataPath, JSON.stringify(stockData, null, 2));
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
      if (group.totalAmount !== undefined) delete group.totalAmount; // Ensure group total is removed
      group.products.forEach((product) => {
        if (product.rate !== undefined) delete product.rate; // Ensure rate is removed
        if (product.amount !== undefined) delete product.amount; // Ensure amount is removed

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

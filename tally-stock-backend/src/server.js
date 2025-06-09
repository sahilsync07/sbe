const express = require("express");
const axios = require("axios");
const { XMLParser } = require("fast-xml-parser");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

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

app.get("/api/stock", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:9000/",
      tallyRequestXML,
      {
        headers: { "Content-Type": "text/xml" },
      }
    );

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

    const nestedJson = [];
    let currentGroup = null;

    dspAccNames.forEach((acc, index) => {
      const name = acc.DSPDISPNAME || `Unknown ${index}`;
      const stkCl = dspStkInfos[index]?.DSPSTKCL || {};
      const quantity = stkCl.DSPCLQTY || null;
      const rate = stkCl.DSPCLRATE || null;
      const amount = stkCl.DSPCLAMTA || 0;

      if (quantity === null && rate === null) {
        currentGroup = {
          groupName: name,
          totalAmount: parseFloat(amount) || 0,
          products: [],
        };
        nestedJson.push(currentGroup);
      } else if (currentGroup && quantity) {
        currentGroup.products.push({
          productName: name,
          quantity: quantity || "0 PCS",
          rate: parseFloat(rate) || 0,
          amount: parseFloat(amount) || 0,
        });
      }
    });

    if (!nestedJson.length) {
      return res.status(404).json({ message: "No stock data available" });
    }

    res.json(nestedJson);
  } catch (error) {
    console.error("Error fetching or parsing Tally data:", error.message);
    res.status(500).json({ error: "Failed to fetch or parse Tally data" });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

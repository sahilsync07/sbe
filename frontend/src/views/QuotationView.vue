<template>
  <div class="quotation-page quotation-page-body min-h-screen">
    <!-- Header Navbar matching HomeView style -->
    <div class="home-header-sticky sticky top-[54px] lg:top-[72px] z-40 px-2.5 pt-2 pb-1.5 sm:px-5 sm:pt-4 sm:pb-2 lg:px-6 xl:px-10 no-print">
      <div class="home-header-card mx-auto flex w-full max-w-4xl flex-col gap-2 p-3 sm:p-5">
        <div class="flex items-center gap-2 sm:gap-4">
          <button type="button" @click="$router.push('/home')" class="home-back-btn flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-600 transition-all active:scale-95 sm:h-12 sm:w-12" title="Back">
            <i class="fa-solid fa-arrow-left text-sm sm:text-[15px]"></i>
          </button>
          <div>
            <h1 class="text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">Quotation Generator</h1>
            <p class="text-[11px] text-slate-500 sm:text-xs">Create general and tax bills</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bill-container-wrapper p-4 max-w-5xl mx-auto no-print">
      <div class="bill-container">
        <!-- Status Bar -->
        <div id="status-bar" class="no-print">
          {{ statusBarText }}
        </div>

        <!-- Header -->
        <div class="invoice-header">
          <h1>Quotation Cum General Bill</h1>
          <h2>M/S. Sri Brundaban Enterprises</h2>
          <p>
            Sai Mandir Road, New Colony, Beside Bank of Baroda,<br>
            Rayagada, Odisha, PIN: 765001
          </p>
          <p class="gstin-line">
            GSTIN: 21ADKPC5405A1ZI &nbsp;|&nbsp;
            Cell: 9437094667, 9348343310
          </p>
        </div>

        <!-- Party Details -->
        <div class="party-details">
          <div class="field-group">
            <div class="field-row relative">
              <label>To:</label>
              <div class="flex-1 w-full relative">
                <input type="text" v-model="partyName" @input="filterParties" @focus="filterParties" @blur="handlePartyBlur" placeholder="Customer Name" class="w-full">
                <div v-if="showPartyDropdown" class="autocomplete-list active" style="top:100%; position:absolute;">
                  <div v-if="filteredParties.length === 0" class="autocomplete-item no-match">No matches found</div>
                  <div v-for="(p, index) in filteredParties" :key="index" class="autocomplete-item" @mousedown="selectParty(p)">
                    <span>{{ p }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="field-row">
              <label>Mobile:</label>
              <input type="text" v-model="partyMob" readonly class="readonly-input">
            </div>
          </div>
          <div class="field-group">
            <div class="field-row">
              <label>Place:</label>
              <input type="text" v-model="partyPlace" readonly class="readonly-input">
            </div>
            <div class="field-row">
              <label>Date:</label>
              <input type="date" v-model="invDate" style="width: 10rem;">
            </div>
          </div>
        </div>

        <!-- Bill Table -->
        <div class="table-wrap tally-mode">
          <table id="billTable">
            <thead>
              <tr>
                <th class="w-12 text-center">Sl.</th>
                <th class="min-w-desc">Description</th>
                <th class="w-24 text-right">Qty</th>
                <th class="w-24 text-right">Rate (₹)</th>
                <th class="w-20 text-right">Disc %</th>
                <th class="w-32 text-right">Amount (₹)</th>
                <th class="w-12 text-center no-print">×</th>
              </tr>
            </thead>
            <tbody id="billBody">
              <tr v-for="(item, index) in items" :key="item.id">
                <td class="td-sl">{{ index + 1 }}</td>
                <td class="td-relative" data-label="Description">
                  <input type="text" v-model="item.desc" @input="filterItems(item)" @focus="filterItems(item)" @blur="handleItemBlur" placeholder="Type to search" autocomplete="off" @keydown.enter.prevent="focusNext($event, index, 'qty')">
                  
                  <div v-if="showItemDropdownFor === item.id" class="autocomplete-list active" style="top:100%; position:absolute;">
                    <div v-if="filteredProducts.length === 0" class="autocomplete-item no-match">No matches found</div>
                    <div v-for="(prod, pIdx) in filteredProducts" :key="pIdx" class="autocomplete-item" @mousedown="selectProduct(item, prod)">
                      <div class="autocomplete-item-name-wrap"><span>{{ prod.name }}</span></div>
                      <div style="display:flex;gap:0.5rem;align-items:center;width:100%;">
                        <span v-if="prod.qty > 0" class="qty-tag">{{ prod.qty }} Pcs</span>
                        <span class="price-tag">₹{{ prod.price }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td data-label="Qty"><input type="number" v-model="item.qty" min="1" inputmode="decimal" @keydown.enter.prevent="focusNext($event, index, 'rate')" :ref="el => setInputRef(el, index, 'qty')"></td>
                <td data-label="Rate"><input type="number" v-model="item.rate" inputmode="decimal" @focus="$event.target.select()" @keydown.enter.prevent="focusNext($event, index, 'disc')" :ref="el => setInputRef(el, index, 'rate')"></td>
                <td data-label="Disc %"><input type="number" v-model="item.disc" min="0" max="100" inputmode="decimal" @focus="$event.target.select()" @keydown.enter.prevent="focusNextRow($event, index)" :ref="el => setInputRef(el, index, 'disc')"></td>
                <td class="td-amount" data-label="Amount">{{ itemAmount(item).toFixed(2) }}</td>
                <td class="td-center no-print">
                   <button @click="removeRow(index)" class="btn-remove" aria-label="Remove item">×</button>
                </td>
              </tr>
            </tbody>
          </table>
          <button @click="addNewRow" class="btn-secondary btn-add no-print">
            <span>+</span> Add Item
          </button>
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
          <div class="summary-left">
            <div class="amount-words">
              <span class="not-print-label">Amount in Words</span>
              <span>{{ amountInWords }}</span>
            </div>

            <div class="bank-details relative group">
              <p class="bank-title">Bank Details</p>
              <p class="bank-name">M/S Sri Brundabana Enterprises</p>
              <div class="bank-info">
                <p>SB Account no: <span>36878162058</span></p>
                <p>IFSC code: <span>SBIN0003068</span></p>
                <p>SBI ADB RAYAGADA BRANCH</p>
                <p>UPI ID: <span>36878162058@sbi</span></p>
              </div>
              <button @click="copyBankDetails" class="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-all active:scale-95 no-print" title="Copy Bank Details">
                <i class="fa-regular fa-copy text-lg"></i>
              </button>
            </div>
          </div>

          <div class="summary-right">
            <div class="summary-row">
              <span class="label">Sub Total:</span>
              <span class="value">₹{{ subTotal.toFixed(2) }}</span>
            </div>

            <div class="summary-row">
              <span class="label">Extra Discount (%):</span>
              <input type="number" v-model="extraDisc" class="extra-disc-input" min="0" max="100">
            </div>

            <div class="summary-row">
              <span class="label">Less Discount:</span>
              <span class="value-discount">- ₹{{ extraDiscVal.toFixed(2) }}</span>
            </div>

            <div class="summary-row">
              <span class="label">Packing Charges (₹):</span>
              <input type="number" v-model="packingCharges" class="extra-disc-input" min="0" inputmode="decimal">
            </div>

            <div class="summary-row">
              <span class="label">Transport Charges (₹):</span>
              <input type="number" v-model="transportCharges" class="extra-disc-input" min="0" inputmode="decimal">
            </div>

            <div class="summary-divider no-print"></div>

            <div class="summary-row">
              <span class="label">CGST (2.5%):</span>
              <span class="value">₹{{ cgst.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span class="label">SGST (2.5%):</span>
              <span class="value">₹{{ sgst.toFixed(2) }}</span>
            </div>

            <div class="summary-row">
              <span class="label">Round Off:</span>
              <span class="value">{{ roundOffDiff > 0 ? '+' : '' }}₹{{ roundOffDiff.toFixed(2) }}</span>
            </div>

            <div class="summary-divider no-print"></div>

            <div class="summary-row-grand">
              <span class="label no-print">Grand Total:</span>
              <span class="value">₹{{ grandTotal.toFixed(2) }}</span>
            </div>

            <div class="signature-box">
              <div class="signature-line">
                Authorized Signatory<br>
                (SBE)
              </div>
            </div>
          </div>
        </div>

        <div class="btn-container no-print">
          <button @click="handlePrint" class="btn-primary">
            🖨️ Print Quote
          </button>
        </div>
      </div>
    </div>

    <!-- Print Output Area -->
    <div id="print-output" v-html="printHTML"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

const statusBarText = ref('INITIALIZING...');
const products = ref([]);
const parties = ref([]);

// Form State
const partyName = ref('');
const partyPlace = ref('');
const partyMob = ref('');
const invDate = ref(new Date().toISOString().slice(0, 10));

const items = ref([
  { id: Date.now(), desc: '', qty: 1, unit: 'Pcs', rate: 0, disc: 0 }
]);
const extraDisc = ref(0);
const packingCharges = ref(0);
const transportCharges = ref(0);

// Autocomplete State
const showPartyDropdown = ref(false);
const filteredParties = ref([]);
const showItemDropdownFor = ref(null);
const filteredProducts = ref([]);

// Refs for navigation
const inputRefs = ref({});
const setInputRef = (el, index, field) => {
  if (el) {
    inputRefs.value[`${index}-${field}`] = el;
  }
};

// Data Fetching
const loadData = async () => {
  statusBarText.value = "SYNCING STOCK DATA...";
  try {
    const STOCK_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/stock-data.json';
    const LEDGER_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/ledger-data.json';
    
    const [stockData, ledgerData] = await Promise.all([
      fetch(STOCK_URL).then(r => r.json()),
      fetch(LEDGER_URL).then(r => r.json())
    ]);

    const prods = [];
    stockData.forEach(group => {
      if (group.groupName === '_META_DATA_') return;
      if (group.products) {
        group.products.forEach(p => {
          const priceMatch = p.productName.match(/(?:RS|MRP|@)[\.\s]*(\d+(\.\d+)?)/i);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          prods.push({
            name: p.productName,
            price: price,
            qty: p.quantity || p.qty || 0,
            category: group.groupName
          });
        });
      }
    });
    products.value = prods;

    const parts = [];
    ledgerData.forEach(group => {
      if (group.groupName === '_META_DATA_') return;
      if (group.ledgers) {
        group.ledgers.forEach(l => {
          parts.push(l.ledgerName);
        });
      }
    });
    parties.value = parts;

    statusBarText.value = `READY (${prods.length} ITEMS, ${parts.length} PARTIES)`;
  } catch (err) {
    console.error("Fetch error", err);
    statusBarText.value = "OFFLINE - Check network";
  }
};

onMounted(() => {
  loadData();
});

// Item interactions
const addNewRow = () => {
  items.value.push({ id: Date.now(), desc: '', qty: 1, unit: 'Pcs', rate: 0, disc: 0 });
};

const removeRow = (idx) => {
  items.value.splice(idx, 1);
  if (items.value.length === 0) {
    addNewRow();
  }
};

const itemAmount = (item) => {
  const qty = parseFloat(item.qty) || 0;
  const rate = parseFloat(item.rate) || 0;
  const disc = parseFloat(item.disc) || 0;
  const base = qty * rate;
  return base - (base * (disc / 100));
};

const focusNext = (event, index, nextField) => {
  const nextRef = inputRefs.value[`${index}-${nextField}`];
  if (nextRef) {
    nextRef.focus();
    if (nextRef.type === 'number') nextRef.select();
  }
};

const focusNextRow = (event, index) => {
  if (index === items.value.length - 1) {
    addNewRow();
  }
  // Focus the new row's desc field handled natively by user or we could add more refs.
};

// Autocomplete Logic
const filterParties = () => {
  if (!partyName.value) {
    filteredParties.value = [];
    showPartyDropdown.value = false;
    return;
  }
  const terms = partyName.value.toLowerCase().split(/\s+/).filter(Boolean);
  filteredParties.value = parties.value.filter(p => {
    const pLower = p.toLowerCase();
    return terms.every(t => pLower.includes(t));
  }).slice(0, 20);
  showPartyDropdown.value = true;
};

const selectParty = (party) => {
  const parts = party.split(',');
  partyName.value = parts[0].trim();
  if (parts.length > 1) {
    partyPlace.value = parts.slice(1).join(',').trim();
  } else {
    partyPlace.value = '';
  }
  showPartyDropdown.value = false;
};

const handlePartyBlur = () => {
  setTimeout(() => { showPartyDropdown.value = false; }, 200);
};

const filterItems = (item) => {
  showItemDropdownFor.value = item.id;
  if (!item.desc) {
    filteredProducts.value = [];
    return;
  }
  const terms = item.desc.toLowerCase().split(/\s+/).filter(Boolean);
  filteredProducts.value = products.value.filter(p => {
    if (p.name.includes('@')) return false;
    const pLower = p.name.toLowerCase();
    return terms.every(t => pLower.includes(t));
  }).slice(0, 20);
};

const selectProduct = (item, product) => {
  item.desc = product.name;
  item.rate = product.price;
  showItemDropdownFor.value = null;
  // Focus Qty automatically
  nextTick(() => {
    const index = items.value.findIndex(i => i.id === item.id);
    focusNext(null, index, 'qty');
  });
};

const handleItemBlur = () => {
  setTimeout(() => { showItemDropdownFor.value = null; }, 200);
};

// Calculations
const subTotal = computed(() => items.value.reduce((acc, item) => acc + itemAmount(item), 0));
const extraDiscVal = computed(() => subTotal.value * ((parseFloat(extraDisc.value) || 0) / 100));
const afterExtra = computed(() => subTotal.value - extraDiscVal.value);

const totalWithCharges = computed(() => {
  return afterExtra.value + (parseFloat(packingCharges.value) || 0) + (parseFloat(transportCharges.value) || 0);
});

const DISCOUNT_FRACTION = 5 / 105;
const gstComponent = computed(() => totalWithCharges.value * DISCOUNT_FRACTION);
const taxable = computed(() => totalWithCharges.value - gstComponent.value);
const cgst = computed(() => taxable.value * 0.025);
const sgst = computed(() => taxable.value * 0.025);

const grandTotalRaw = computed(() => taxable.value + cgst.value + sgst.value);
const grandTotal = computed(() => Math.round(grandTotalRaw.value));
const roundOffDiff = computed(() => grandTotal.value - grandTotalRaw.value);

const amountInWords = computed(() => rupeesInWords(grandTotal.value));

function rupeesInWords(amount) {
  const num = Math.round(amount);
  if (num === 0) return "Zero Rupees Only";
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function convertUnder1000(n) {
    let s = "";
    if (n >= 100) { s += units[Math.floor(n / 100)] + " Hundred "; n %= 100; }
    if (n >= 20) { s += tens[Math.floor(n / 10)] + " "; n %= 10; }
    if (n >= 10) { s += teens[n - 10] + " "; return s; }
    if (n > 0) { s += units[n] + " "; }
    return s;
  }
  let str = "";
  let n = num;
  if (n >= 10000000) { str += convertUnder1000(Math.floor(n / 10000000)) + "Crore "; n %= 10000000; }
  if (n >= 100000) { str += convertUnder1000(Math.floor(n / 100000)) + "Lakh "; n %= 100000; }
  if (n >= 1000) { str += convertUnder1000(Math.floor(n / 1000)) + "Thousand "; n %= 1000; }
  str += convertUnder1000(n);
  return (str.trim() + " Rupees Only");
}

const copyBankDetails = async () => {
  const text = "M/S Sri Brundabana Enterprises\nSB Account no: 36878162058\nIFSC code: SBIN0003068\nSBI ADB RAYAGADA BRANCH\nUPI ID: 36878162058@sbi";
  try {
    await navigator.clipboard.writeText(text);
    alert('Bank details copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

// Print Logic
const printHTML = ref('');

const handlePrint = () => {
  const validItems = items.value.filter(it => it.desc.trim());
  if (validItems.length === 0) {
    alert('Please add at least one item before printing.');
    return;
  }

  const pName = partyName.value || '-';
  const pPlace = partyPlace.value || '';
  const pMob = partyMob.value || '';
  const dateStr = invDate.value ? new Date(invDate.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const gstGrandTotal = grandTotal.value;
  const genGrandTotal = Math.round(totalWithCharges.value);
  const genRoundOff = genGrandTotal - totalWithCharges.value;

  const getRowsHTML = (isGST) => {
    let rowsHTML = '';
    let totalQty = 0;
    validItems.forEach((it, i) => {
      const q = parseFloat(it.qty) || 0;
      totalQty += q;
      rowsHTML += `
      <tr>
          <td class="cen">${i + 1}</td>
          <td><b>${it.desc}</b></td>
          <td class="cen"></td>
          <td class="num"><b>${q}</b> ${it.unit}</td>
          <td class="num">${(parseFloat(it.rate) || 0).toFixed(2)}</td>
          <td class="cen">${it.unit}</td>
          <td class="num">${parseFloat(it.disc) > 0 ? parseFloat(it.disc).toFixed(1) + '%' : ''}</td>
          <td class="num"><b>${itemAmount(it).toFixed(2)}</b></td>
      </tr>`;
    });

    const minRows = 14;
    for(let i = validItems.length; i < minRows; i++) {
      rowsHTML += `<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    }

    if (parseFloat(extraDisc.value) > 0) {
      rowsHTML += `<tr><td></td><td style="text-align:right"><i>Less: Extra Discount (${extraDisc.value}%)</i></td><td></td><td></td><td></td><td></td><td></td><td class="num"><b>(-) ${extraDiscVal.value.toFixed(2)}</b></td></tr>`;
    }
    if (parseFloat(packingCharges.value) > 0) {
      rowsHTML += `<tr><td></td><td style="text-align:right"><i>Packing Charges</i></td><td></td><td></td><td></td><td></td><td></td><td class="num"><b>${parseFloat(packingCharges.value).toFixed(2)}</b></td></tr>`;
    }
    if (parseFloat(transportCharges.value) > 0) {
      rowsHTML += `<tr><td></td><td style="text-align:right"><i>Transport Charges</i></td><td></td><td></td><td></td><td></td><td></td><td class="num"><b>${parseFloat(transportCharges.value).toFixed(2)}</b></td></tr>`;
    }

    if (isGST) {
      rowsHTML += `
      <tr><td></td><td style="text-align:right; font-weight:bold; padding-top:10px;">CGST@ 2.5%</td><td></td><td></td><td></td><td></td><td></td><td class="num"><b>${cgst.value.toFixed(2)}</b></td></tr>
      <tr><td></td><td style="text-align:right; font-weight:bold;">SGST@ 2.5%</td><td></td><td></td><td></td><td></td><td></td><td class="num"><b>${sgst.value.toFixed(2)}</b></td></tr>
      `;
      if (roundOffDiff.value !== 0) {
        rowsHTML += `<tr><td></td><td style="text-align:right; font-weight:bold;">ROUND OFF</td><td></td><td></td><td></td><td></td><td></td><td class="num"><b>${roundOffDiff.value > 0 ? '+' : ''}${roundOffDiff.value.toFixed(2)}</b></td></tr>`;
      }
    } else {
      if (genRoundOff !== 0) {
        rowsHTML += `<tr><td></td><td style="text-align:right; font-weight:bold;">ROUND OFF</td><td></td><td></td><td></td><td></td><td></td><td class="num"><b>${genRoundOff > 0 ? '+' : ''}${genRoundOff.toFixed(2)}</b></td></tr>`;
      }
    }
    return { html: rowsHTML, tQty: totalQty };
  };

  const generateTallyBill = (type, isGST) => {
    const { html: rowsHTML, tQty } = getRowsHTML(isGST);
    const finalTotal = isGST ? gstGrandTotal : genGrandTotal;

    let taxSummaryHTML = '';
    if (isGST) {
      taxSummaryHTML = `
      <table class="t-tax-summary">
          <tr>
              <th rowspan="2">HSN/SAC</th>
              <th rowspan="2">Taxable<br>Value</th>
              <th colspan="2">CGST</th>
              <th colspan="2">SGST/UTGST</th>
              <th rowspan="2">Total<br>Tax Amount</th>
          </tr>
          <tr><th>Rate</th><th>Amount</th><th>Rate</th><th>Amount</th></tr>
          <tr>
              <td class="cen">-</td>
              <td>${taxable.value.toFixed(2)}</td>
              <td>2.50%</td><td>${cgst.value.toFixed(2)}</td>
              <td>2.50%</td><td>${sgst.value.toFixed(2)}</td>
              <td>${(cgst.value + sgst.value).toFixed(2)}</td>
          </tr>
          <tr>
              <td style="text-align:right; font-weight:bold;">Total</td>
              <td style="font-weight:bold;">${taxable.value.toFixed(2)}</td>
              <td></td><td style="font-weight:bold;">${cgst.value.toFixed(2)}</td>
              <td></td><td style="font-weight:bold;">${sgst.value.toFixed(2)}</td>
              <td style="font-weight:bold;">${(cgst.value + sgst.value).toFixed(2)}</td>
          </tr>
      </table>
      <div class="t-words" style="border-bottom:1px solid #000; padding:2px 4px;">
          <span style="font-size:8pt">Tax Amount (in words) : <b>INR ${rupeesInWords(cgst.value + sgst.value)}</b></span>
      </div>
      `;
    }

    return `
    <div class="tally-bill">
        <div class="tally-title">${type}</div>
        <div class="tally-box">
            <div class="t-row">
                <div class="t-col-left">
                    <div class="t-company">
                        <span style="font-weight:bold; font-size:10pt;">M/S.SRI BRUNDABANA ENTERPRISES</span><br>
                        NEW COLONY, KAPILAS ROAD<br>
                        RAYAGADA-765001<br>
                        GSTIN/UIN: <b>21ADKPC5405A1ZI</b><br>
                        State Name : Odisha, Code : 21<br>
                        Contact : 9437094667, 9348343310
                    </div>
                    <div class="t-buyer">
                        Buyer (Bill to)<br>
                        <span style="font-weight:bold; font-size:9pt;">${pName}</span><br>
                        ${pPlace ? pPlace + '<br>' : ''}
                        ${pMob ? 'Mob: ' + pMob + '<br>' : ''}
                        State Name : Odisha, Code : 21
                    </div>
                </div>
                <div class="t-col-right">
                    <div class="t-grid-2"><div class="t-gcol">Invoice No.<br><b>-</b></div><div class="t-gcol">Dated<br><b>${dateStr}</b></div></div>
                    <div class="t-grid-2"><div class="t-gcol">Delivery Note<br><b>-</b></div><div class="t-gcol">Mode/Terms of Payment<br><b>-</b></div></div>
                    <div class="t-grid-2"><div class="t-gcol">Buyer's Order No.<br><b>-</b></div><div class="t-gcol">Dated<br><b>-</b></div></div>
                    <div class="t-grid-2"><div class="t-gcol">Dispatched through<br><b>-</b></div><div class="t-gcol">Destination<br><b>-</b></div></div>
                    <div class="t-grid-2"><div class="t-gcol-full">Terms of Delivery<br><b>-</b></div></div>
                </div>
            </div>
            
            <div class="tally-table-wrapper">
                <table class="t-table">
                    <thead>
                        <tr>
                            <th style="width:4%">Sl<br>No.</th>
                            <th style="width:43%">Description of Goods</th>
                            <th style="width:7%">HSN/SAC</th>
                            <th style="width:9%">Quantity</th>
                            <th style="width:10%">Rate</th>
                            <th style="width:5%">per</th>
                            <th style="width:7%">Disc. %</th>
                            <th style="width:15%">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
            </div>
            
            <table class="t-table-totals">
                <tr>
                    <td style="width:47%; text-align:right">Total</td>
                    <td style="width:7%; text-align:center">-</td>
                    <td style="width:9%; text-align:right">${tQty} PCS</td>
                    <td style="width:10%"></td><td style="width:5%"></td><td style="width:7%"></td>
                    <td style="width:15%; text-align:right">₹ ${finalTotal.toFixed(2)}</td>
                </tr>
            </table>
            
            <div class="t-words">
                <span style="font-size:8pt">Amount Chargeable (in words)</span><br>
                <span style="font-weight:bold; font-size:9pt;">INR ${rupeesInWords(finalTotal)}</span>
            </div>
            ${taxSummaryHTML}
            <div class="t-bank-sig">
                <div class="t-bank">
                    <span style="font-size:8pt; text-decoration:underline;">Company's Bank Details</span><br>
                    <table style="font-size:8pt; margin-top:2px; line-height:1.4;">
                        <tr><td>Bank Name</td><td>: <b>SBI (ADB)</b></td></tr>
                        <tr><td>A/c No.</td><td>: <b>36878162058</b></td></tr>
                        <tr><td>Branch & IFSC</td><td>: <b>RAYAGADA & SBIN0003068</b></td></tr>
                        <tr><td>UPI ID</td><td>: <b>36878162058@sbi</b></td></tr>
                    </table>
                </div>
                <div class="t-sig">
                    <div style="font-size:8pt;">for <b>M/S.SRI BRUNDABANA ENTERPRISES</b></div>
                    <div style="font-size:8pt; margin-top:30px;">Authorised Signatory</div>
                </div>
            </div>
        </div>
        <div class="t-footer-msg">SUBJECT TO RAYAGADA JURISDICTION<br>This is a Computer Generated Invoice</div>
    </div>`;
  };

  const page1 = generateTallyBill('General Bill', false);
  const page2 = generateTallyBill('Tax Invoice', true);

  printHTML.value = page1 + page2;

  nextTick(() => {
    window.print();
  });
};
</script>

<style scoped>

        /* ============================================================
           DESIGN SYSTEM — Minimalist Monochromatic Tech
           ============================================================ */

        .quotation-page {
            /* Surfaces */
            --canvas-bg:      #f3f4f6;
            --card-bg:        #ffffff;
            --hover-bg:       #f3f4f6;

            /* Borders & Accents */
            --border-color:   #000000;
            --border-light:   #e5e7eb;

            /* Text */
            --text-primary:   #000000;
            --text-secondary: #4b5563;
            --text-disabled:  #9ca3af;

            /* Shadows */
            --shadow:         0 4px 6px -1px rgba(0, 0, 0, 0.05);
            --shadow-hover:   0 8px 16px -4px rgba(0, 0, 0, 0.1);

            /* Typography */
            --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --font-mono: 'JetBrains Mono', "SF Mono", Courier, monospace;

            /* Spacing */
            --sp-xs: 0.25rem;
            --sp-sm: 0.5rem;
            --sp-md: 1rem;
            --sp-lg: 1.5rem;
            --sp-xl: 2rem;
            --sp-2xl: 3rem;

            /* Tally Focus */
            --tally-yellow: #fff9c4;
            --tally-text:   #000;
        }

        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        /* Prevent Android tap highlight */
        * {
            -webkit-tap-highlight-color: transparent;
        }

        /* Remove number input spinners globally */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type="number"] {
            -moz-appearance: textfield;
            appearance: textfield;
        }

        .quotation-page-body {
            background-color: var(--canvas-bg);
            color: var(--text-primary);
            font-family: var(--font-sans);
            line-height: 1.6;
            min-height: 100vh;
            min-height: 100dvh; /* dynamic viewport height for mobile */
            overflow-x: hidden;
            padding: 20px;
            padding: 20px env(safe-area-inset-right, 20px) 20px env(safe-area-inset-left, 20px);
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
        }

        h1, h2, h3 {
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }

        /* ============================================================
           BILL CONTAINER — Card with stacked-paper depth
           ============================================================ */

        .bill-container {
            max-width: 960px;
            margin: 0 auto;
            background-color: var(--card-bg);
            border: 2px solid var(--border-color);
            border-radius: 4px;
            box-shadow: var(--shadow);
            padding: var(--sp-lg) var(--sp-xl);
            min-height: 90vh;
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .bill-container::before {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            right: -6px;
            bottom: -6px;
            border: 2px solid var(--border-color);
            background: var(--card-bg);
            z-index: -1;
            border-radius: 4px;
        }

        /* ============================================================
           STATUS BAR
           ============================================================ */

        #status-bar {
            position: absolute;
            top: 0.5rem;
            right: 1rem;
            font-size: 0.7rem;
            font-family: var(--font-mono);
            font-weight: 700;
            color: var(--text-secondary);
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        /* ============================================================
           INVOICE HEADER
           ============================================================ */

        .invoice-header {
            text-align: center;
            margin-bottom: var(--sp-lg);
            padding-bottom: var(--sp-md);
            border-bottom: 2px solid var(--border-color);
        }

        .invoice-header h1 {
            font-size: 1.75rem;
            font-weight: 700;
            letter-spacing: -1.5px;
            color: var(--text-primary);
            margin-bottom: var(--sp-xs);
        }

        .invoice-header h2 {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: var(--sp-xs);
        }

        .invoice-header p {
            font-size: 0.75rem;
            font-family: var(--font-mono);
            color: var(--text-secondary);
            margin-top: 0.15rem;
            line-height: 1.5;
        }

        .invoice-header .gstin-line {
            font-family: var(--font-mono);
            font-weight: 700;
            font-size: 0.7rem;
            letter-spacing: 0.5px;
        }

        /* ============================================================
           PARTY DETAILS
           ============================================================ */

        .party-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--sp-lg);
            margin-bottom: var(--sp-xl);
            padding: var(--sp-md);
            background-color: var(--canvas-bg);
            border: 1px dashed var(--border-color);
            border-radius: 4px;
        }

        .party-details .field-group {
            display: flex;
            flex-direction: column;
            gap: var(--sp-sm);
        }

        .party-details .field-row {
            display: flex;
            align-items: center;
            gap: var(--sp-sm);
        }

        .party-details label {
            width: 5rem;
            font-family: var(--font-mono);
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-secondary);
            flex-shrink: 0;
        }

        .party-details input {
            flex: 1;
            min-width: 0;
        }

        /* ============================================================
           INPUTS (Global)
           ============================================================ */

        input, select {
            font-family: var(--font-mono);
            font-size: 16px; /* >= 16px prevents auto-zoom on iOS/Android */
            padding: 6px 8px;
            border: 2px solid var(--border-color);
            border-radius: 4px;
            background-color: var(--card-bg);
            color: var(--text-primary);
            outline: none;
            transition: box-shadow 0.2s ease;
            /* Minimum 44px touch target for accessibility */
            min-height: 44px;
            -webkit-appearance: none;
            appearance: none;
        }

        input:focus, select:focus {
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15);
        }

        input::placeholder {
            color: var(--text-disabled);
            font-weight: 400;
        }

        /* Tally-like Focus Mode for Table Inputs */
        .tally-mode input:focus {
            background-color: var(--tally-yellow);
            color: var(--tally-text);
            border-color: var(--border-color);
            font-weight: 600;
        }

        /* ============================================================
           TABLE
           ============================================================ */

        .table-wrap {
            flex-grow: 1;
            overflow-x: auto;
            margin-bottom: var(--sp-lg);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-family: var(--font-sans);
        }

        th {
            background-color: var(--border-color);
            color: #ffffff;
            font-family: var(--font-mono);
            font-size: 0.65rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 0.6rem 0.75rem;
        }

        th.text-center { text-align: center; }
        th.text-right  { text-align: right; }
        th.min-w-desc  { min-width: 300px; }
        th.w-12        { width: 3rem; }
        th.w-20        { width: 5rem; }
        th.w-24        { width: 6rem; }
        th.w-32        { width: 8rem; }

        td {
            padding: 0.25rem;
            font-size: 0.8rem;
            border-bottom: 1px solid var(--border-light);
        }

        tr:last-child td {
            border-bottom: none;
        }

        /* Hover effect on table rows */
        tbody tr {
            transition: background-color 0.15s ease;
        }

        tbody tr:hover td {
            background-color: #f9fafb;
        }

        /* Table cell helpers */
        .td-center { text-align: center; }
        .td-right  { text-align: right; }
        .td-sl     { text-align: center; color: var(--text-secondary); }
        .td-amount {
            text-align: right;
            padding: 0.5rem;
            font-family: var(--font-mono);
            font-weight: 700;
            color: var(--text-primary);
        }

        /* Table inputs — borderless inline style */
        table input {
            border: none;
            background: transparent;
            padding: 0.5rem;
            width: 100%;
            font-size: 16px; /* Prevent mobile zoom */
            border-radius: 2px;
            min-height: 40px; /* Touch-friendly */
        }

        table input:focus {
            background-color: var(--tally-yellow);
            box-shadow: none;
        }

        table input[type="number"] {
            text-align: right;
            font-family: var(--font-mono);
        }

        table input[type="text"] {
            font-family: var(--font-sans);
        }

        /* Relative positioning for autocomplete */
        .td-relative {
            position: relative;
        }

        /* Remove button */
        .btn-remove {
            background: none;
            border: none;
            font-size: 1.1rem;
            color: var(--text-disabled);
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s ease, color 0.15s ease;
            font-weight: 700;
            padding: 0.25rem 0.5rem;
            line-height: 1;
            min-width: 44px;  /* Touch target */
            min-height: 44px; /* Touch target */
            display: flex;
            align-items: center;
            justify-content: center;
        }

        tbody tr:hover .btn-remove {
            opacity: 1;
        }

        .btn-remove:hover {
            color: var(--text-primary);
        }

        /* ============================================================
           BUTTONS
           ============================================================ */

        .btn-primary {
            cursor: pointer;
            font-family: var(--font-sans);
            font-size: 0.9rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            min-height: 48px; /* Touch-friendly */
            background-color: var(--border-color);
            color: #ffffff;
            border: none;
            border-radius: 4px;
            transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
            -webkit-appearance: none;
        }

        .btn-primary:hover {
            opacity: 0.85;
            box-shadow: var(--shadow-hover);
        }

        .btn-primary:active {
            transform: scale(0.97);
        }

        .btn-secondary {
            cursor: pointer;
            font-family: var(--font-sans);
            font-size: 0.85rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            min-height: 48px; /* Touch-friendly */
            background-color: var(--card-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            transition: transform 0.15s ease, background-color 0.15s ease;
            -webkit-appearance: none;
        }

        .btn-secondary:hover {
            background-color: var(--canvas-bg);
            transform: translate(-1px, -1px);
            box-shadow: var(--shadow);
        }

        .btn-secondary:active {
            transform: scale(0.97);
        }

        /* Add Item button */
        .btn-add {
            margin-top: var(--sp-md);
        }

        /* Print button container */
        .btn-container {
            margin-top: var(--sp-xl);
            display: flex;
            justify-content: flex-end;
            gap: var(--sp-md);
        }

        /* ============================================================
           SUMMARY SECTION
           ============================================================ */

        .summary-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--sp-xl);
            align-items: start;
            border-top: 2px solid var(--border-color);
            padding-top: var(--sp-lg);
        }

        .summary-left {
            width: 100%;
        }

        /* Amount in Words callout */
        .amount-words {
            border: 1px dashed var(--border-color);
            padding: var(--sp-md);
            background-color: var(--canvas-bg);
            font-family: var(--font-mono);
            border-radius: 4px;
            font-size: 0.85rem;
            font-style: italic;
            color: var(--text-secondary);
        }

        .amount-words .not-print-label {
            font-style: normal;
            font-weight: 700;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-secondary);
            display: block;
            margin-bottom: var(--sp-xs);
        }

        .amount-words #amountInWords {
            color: var(--text-primary);
            font-weight: 700;
        }

        /* Bank Details */
        .bank-details {
            margin-top: var(--sp-md);
            border: 2px solid var(--border-color);
            padding: var(--sp-md);
            border-radius: 4px;
            font-size: 0.85rem;
            background-color: var(--card-bg);
        }

        .bank-details .bank-title {
            font-family: var(--font-mono);
            font-weight: 700;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: var(--sp-xs);
            color: var(--text-primary);
        }

        .bank-details .bank-name {
            font-weight: 600;
            margin-bottom: var(--sp-xs);
            color: var(--text-primary);
        }

        .bank-details .bank-info {
            font-family: var(--font-mono);
            font-size: 0.75rem;
            color: var(--text-secondary);
        }

        .bank-details .bank-info span {
            color: var(--text-primary);
            font-weight: 700;
        }

        .bank-details .bank-info p {
            margin-bottom: 2px;
        }

        /* Summary right — totals */
        .summary-right {
            text-align: right;
            font-size: 0.9rem;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--sp-xs);
        }

        .summary-row .label {
            font-family: var(--font-mono);
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-secondary);
        }

        .summary-row .value {
            font-family: var(--font-mono);
            font-weight: 700;
            color: var(--text-primary);
        }

        .summary-row .value-discount {
            font-family: var(--font-mono);
            font-weight: 700;
            color: var(--text-secondary);
        }

        .summary-divider {
            height: 1px;
            background-color: var(--border-color);
            margin: var(--sp-sm) 0;
        }

        .summary-row-grand {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.1rem;
            font-weight: 700;
        }

        .summary-row-grand .label {
            font-family: var(--font-mono);
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-primary);
        }

        .summary-row-grand .value {
            font-family: var(--font-mono);
            font-weight: 700;
            color: var(--text-primary);
            font-size: 1.15rem;
        }

        /* Extra discount input in summary */
        .extra-disc-input {
            width: 4rem;
            text-align: right;
            padding: 2px 6px;
            font-size: 0.8rem;
            border: 2px solid var(--border-color);
        }

        /* Signature box */
        .signature-box {
            display: none;
        }

        .signature-line {
            float: right;
            width: 200px;
            border-top: 1px solid var(--border-color);
            padding-top: 5px;
            text-align: center;
            font-weight: 700;
            font-size: 0.8rem;
        }

        /* ============================================================
           AUTOCOMPLETE DROPDOWN
           ============================================================ */

        .autocomplete-list {
            position: absolute;
            z-index: 50;
            background: var(--card-bg);
            border: 2px solid var(--border-color);
            border-radius: 4px;
            max-height: 300px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch; /* Smooth scroll on mobile */
            overscroll-behavior: contain; /* Prevent scroll chaining */
            width: 100%;
            top: 100%;
            left: 0;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            display: none;
        }

        .autocomplete-list.active {
            display: block;
            animation: fadeSlideIn 0.15s ease;
        }

        .autocomplete-item {
            padding: 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--border-light);
            font-size: 0.9rem;
            color: var(--text-primary);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background-color 0.15s ease;
            min-height: 48px; /* Touch-friendly row height */
            gap: 8px;
        }

        .autocomplete-item:last-child {
            border-bottom: none;
        }

        .autocomplete-item:hover,
        .autocomplete-item.selected {
            background: var(--border-color);
            color: #ffffff;
        }

        .autocomplete-item .price-tag {
            font-family: var(--font-mono);
            font-size: 0.7rem;
            font-weight: 700;
            background: var(--canvas-bg);
            color: var(--text-primary);
            padding: 2px 8px;
            border-radius: 2px;
            border: 1px solid var(--border-color);
            text-transform: uppercase;
        }

        .autocomplete-item:hover .price-tag,
        .autocomplete-item.selected .price-tag {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
        }

        .qty-tag {
            font-family: var(--font-mono);
            font-size: 0.7rem;
            font-weight: 700;
            background: var(--canvas-bg);
            color: var(--text-primary);
            padding: 2px 8px;
            border-radius: 2px;
            border: 1px solid var(--border-color);
        }

        .autocomplete-item:hover .qty-tag,
        .autocomplete-item.selected .qty-tag {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
        }

        .autocomplete-item.no-match {
            color: var(--text-disabled);
            font-style: italic;
            cursor: default;
        }

        /* ============================================================
           SCROLLBAR
           ============================================================ */

        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--canvas-bg);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--text-disabled);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }

        /* ============================================================
           ANIMATIONS
           ============================================================ */

        @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ============================================================
           NO PRINT
           ============================================================ */

        /* (Handled in @media print below) */

        /* ============================================================
           RESPONSIVE — 768px
           ============================================================ */

        @media (max-width: 768px) {
            .quotation-page-body {
                padding: 8px;
                padding-bottom: calc(80px + env(safe-area-inset-bottom, 8px)); /* Space for sticky bottom bar */
            }

            .bill-container {
                padding: 12px;
                border-width: 1px;
                min-height: auto;
            }

            .bill-container::before {
                display: none;
            }

            /* Header tweaks */
            .invoice-header {
                margin-bottom: var(--sp-md);
                padding-bottom: var(--sp-sm);
            }

            .invoice-header h1 {
                font-size: 1.1rem;
                letter-spacing: -0.5px;
                line-height: 1.3;
            }

            .invoice-header h2 {
                font-size: 0.95rem;
            }

            .invoice-header p {
                font-size: 0.65rem;
            }

            .invoice-header .gstin-line {
                font-size: 0.6rem;
            }

            /* Status bar on mobile */
            #status-bar {
                position: relative;
                top: 0;
                right: 0;
                text-align: center;
                margin-bottom: var(--sp-sm);
                font-size: 0.6rem;
                padding: 4px 8px;
                background: var(--canvas-bg);
                border: 1px solid var(--border-light);
                border-radius: 2px;
            }

            /* Party Details stacked */
            .party-details {
                display: flex;
                flex-direction: column;
                gap: var(--sp-sm);
                padding: var(--sp-sm);
                margin-bottom: var(--sp-md);
            }

            .party-details .field-row {
                flex-direction: column;
                align-items: stretch;
                gap: 4px;
            }

            .party-details label {
                width: 100%;
                font-size: 0.6rem;
                color: var(--text-primary);
            }

            .party-details input,
            .party-details input#invDate,
            .party-details input#invNo {
                width: 100% !important;
                padding: 10px 8px;
                font-size: 16px; /* Prevent zoom */
                min-height: 44px;
            }

            /* ---- MOBILE CARD LAYOUT FOR TABLE ---- */

            #billTable thead {
                display: none;
            }

            #billTable,
            #billTable t.quotation-page-body {
                display: block;
                width: 100%;
            }

            #billTable tr {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 6px 10px;
                background: var(--card-bg);
                border: 2px solid var(--border-color);
                padding: 14px 12px;
                border-radius: 4px;
                margin-bottom: 12px;
                position: relative;
                box-shadow: var(--shadow);
            }

            #billTable td {
                display: flex;
                flex-direction: column;
                border: none;
                padding: 0;
            }

            #billTable td::before {
                content: attr(data-label);
                font-family: var(--font-mono);
                font-size: 0.55rem;
                text-transform: uppercase;
                color: var(--text-secondary);
                margin-bottom: 2px;
                font-weight: 700;
                letter-spacing: 0.5px;
            }

            /* Sl No: Top Left absolute */
            #billTable td:nth-child(1) {
                position: absolute;
                top: 8px;
                left: 10px;
                font-size: 0.65rem;
                color: var(--text-disabled);
                width: auto;
                height: auto;
            }

            #billTable td:nth-child(1)::before {
                display: none;
            }

            /* Description: Full Width at top */
            #billTable td:nth-child(2) {
                grid-column: 1 / -1;
                margin-top: 10px;
                margin-bottom: 6px;
            }

            #billTable td:nth-child(2)::before {
                display: none;
            }

            /* Description input full-width */
            #billTable td:nth-child(2) input {
                font-size: 16px;
                padding: 10px 8px;
                border: 1px solid var(--border-color) !important;
                border-radius: 4px;
                background: var(--card-bg) !important;
            }

            #billTable td:nth-child(3) { grid-column: span 1; }
            #billTable td:nth-child(4) { grid-column: span 1; }
            #billTable td:nth-child(5) { grid-column: span 1; }
            #billTable td:nth-child(6) { grid-column: span 1; }

            /* Numeric inputs on mobile */
            #billTable td:nth-child(3) input,
            #billTable td:nth-child(4) input,
            #billTable td:nth-child(5) input,
            #billTable td:nth-child(6) input {
                font-size: 16px;
                padding: 8px 6px;
                border: 1px solid var(--border-light) !important;
                border-radius: 4px;
                background: var(--card-bg) !important;
                text-align: center;
                min-height: 44px;
            }

            /* Amount: Bigger and spread */
            #billTable td:nth-child(7) {
                grid-column: span 2;
                text-align: right;
                align-items: flex-end;
                justify-content: center;
                font-size: 1.15rem;
                font-weight: 700;
                color: var(--text-primary);
                padding-top: 4px;
            }

            #billTable td:nth-child(7)::before {
                width: 100%;
                text-align: right;
            }

            /* Remove Button: Top Right absolute */
            #billTable td:nth-child(8) {
                position: absolute;
                top: 4px;
                right: 4px;
                width: auto;
                display: block;
            }

            #billTable td:nth-child(8)::before {
                display: none;
            }

            #billTable td:nth-child(8) .btn-remove {
                opacity: 1 !important;
                background: var(--canvas-bg);
                color: var(--text-primary);
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 1.2rem;
                line-height: 1;
                border: 1px solid var(--border-color);
                min-width: 44px;
                min-height: 44px;
            }

            /* General mobile input tweaks inside table */
            table input {
                border: 1px solid var(--border-light);
                background: var(--card-bg);
                min-height: 44px;
            }

            /* Autocomplete on mobile — wider touch targets, scroll fix */
            .autocomplete-list {
                max-height: 220px; /* Smaller on mobile */
                border-width: 1px;
                border-radius: 4px;
                /* Remove fixed position overrides, let it be positioned under input */
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
            }

            .autocomplete-item {
                padding: 14px 12px;
                font-size: 0.85rem;
                min-height: 52px;
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
            }

            .autocomplete-item-name-wrap {
                width: 100%;
                overflow: hidden;
                white-space: nowrap;
            }

            .autocomplete-item-name-wrap marquee {
                margin: 0;
                padding: 0;
            }

            /* Summary stacked */
            .summary-section {
                grid-template-columns: 1fr;
                gap: var(--sp-md);
            }

            .summary-right {
                text-align: left;
            }

            .summary-row .label {
                font-size: 0.7rem;
            }

            .summary-row-grand {
                font-size: 1rem;
                padding: var(--sp-sm) 0;
                border-top: 2px solid var(--border-color);
                margin-top: var(--sp-sm);
            }

            .extra-disc-input {
                min-height: 40px;
                width: 5rem;
            }

            .bank-details {
                font-size: 0.8rem;
            }

            .bank-details .bank-info {
                font-size: 0.7rem;
            }

            .amount-words {
                font-size: 0.8rem;
            }

            /* Sticky bottom action bar */
            .btn-container {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                margin: 0;
                padding: 12px 16px;
                padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
                background: var(--card-bg);
                border-top: 2px solid var(--border-color);
                box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
                z-index: 100;
                justify-content: stretch;
            }

            .btn-container .btn-primary {
                width: 100%;
                justify-content: center;
                font-size: 1rem;
                padding: 14px;
            }

            /* Add item button full width */
            .btn-add {
                width: 100%;
                justify-content: center;
                padding: 12px;
            }
        }

        /* ============================================================
           EXTRA SMALL PHONES — 400px
           ============================================================ */

        @media (max-width: 400px) {
            .quotation-page-body {
                padding: 4px;
                padding-bottom: calc(80px + env(safe-area-inset-bottom, 4px));
            }

            .bill-container {
                padding: 8px;
                border-radius: 0;
            }

            .invoice-header h1 {
                font-size: 0.95rem;
            }

            .invoice-header h2 {
                font-size: 0.85rem;
            }

            /* 2-column grid for item cards on tiny screens */
            #billTable tr {
                grid-template-columns: 1fr 1fr;
                padding: 12px 10px;
                gap: 6px 8px;
            }

            #billTable td:nth-child(3) { grid-column: span 1; }
            #billTable td:nth-child(4) { grid-column: span 1; }
            #billTable td:nth-child(5) { grid-column: span 1; }
            #billTable td:nth-child(6) { grid-column: span 1; }

            #billTable td:nth-child(7) {
                grid-column: 1 / -1;
                font-size: 1.1rem;
            }

            .summary-row .label {
                font-size: 0.65rem;
            }

            .summary-row-grand .label {
                font-size: 0.75rem;
            }
        }

        /* ============================================================
           PRINT OUTPUT — hidden on screen, generated at print time
           ============================================================ */

        #print-output {
            display: none;
        }

        /* ============================================================
           PRINT STYLES
           ============================================================ */

        
            .quotation-page-body {
                background: white !important;
                color: #000 !important;
                padding: 0 !important;
                font-family: Arial, Helvetica, sans-serif !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-size: 8pt;
                line-height: 1.2;
            }

            .bill-container, .bill-container::before, .no-print {
                display: none !important;
            }

            #print-output {
                display: block !important;
            }

            .tally-bill {
                width: 100%;
                color: #000;
            }
            .tally-bill + .tally-bill {
                page-break-before: always;
            }

            .tally-title {
                text-align: center;
                font-weight: bold;
                font-size: 10pt;
                text-decoration: underline;
                margin-bottom: 4px;
                text-transform: uppercase;
            }

            .tally-box {
                border: 1px solid #000;
                display: flex;
                flex-direction: column;
            }

            .t-row {
                display: flex;
                border-bottom: 1px solid #000;
            }

            .t-col-left {
                flex: 1;
                border-right: 1px solid #000;
                display: flex;
                flex-direction: column;
            }

            .t-col-right {
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .t-company, .t-buyer {
                padding: 4px;
            }
            .t-buyer {
                border-top: 1px solid #000;
                flex: 1;
            }
            
            .t-grid-2 {
                display: flex;
                border-bottom: 1px solid #000;
                flex: 1;
            }
            .t-grid-2:last-child {
                border-bottom: none;
            }
            .t-gcol {
                flex: 1;
                padding: 2px 4px;
                border-right: 1px solid #000;
                min-height: 24px;
            }
            .t-gcol:last-child {
                border-right: none;
            }
            .t-gcol-full {
                flex: 1;
                padding: 2px 4px;
            }

            .tally-table-wrapper {
                border-bottom: 1px solid #000;
                min-height: 300px;
            }
            table.t-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
            }
            .t-table th {
                border-right: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 4px 2px;
                text-align: center;
                font-weight: normal;
                vertical-align: middle;
            }
            .t-table th:last-child {
                border-right: none;
            }
            .t-table td {
                border-right: 1px solid #000;
                padding: 2px 4px;
                vertical-align: top;
            }
            .t-table td:last-child {
                border-right: none;
            }
            .t-table td.num { text-align: right; }
            .t-table td.cen { text-align: center; }
            
            .t-table-totals {
                width: 100%;
                border-collapse: collapse;
            }
            .t-table-totals td {
                border-top: 1px solid #000;
                padding: 4px;
                font-weight: bold;
            }
            
            .t-words {
                padding: 4px;
                border-bottom: 1px solid #000;
            }
            .t-tax-summary {
                width: 100%;
                border-collapse: collapse;
                border-bottom: 1px solid #000;
            }
            .t-tax-summary th, .t-tax-summary td {
                border-right: 1px solid #000;
                border-bottom: 1px solid #000;
                padding: 2px 4px;
                text-align: right;
            }
            .t-tax-summary th { text-align: center; }
            .t-tax-summary th:last-child, .t-tax-summary td:last-child { border-right: none; }
            .t-tax-summary tr:last-child td { border-bottom: none; }
            
            .t-bank-sig {
                display: flex;
            }
            .t-bank {
                flex: 1;
                border-right: 1px solid #000;
                padding: 4px;
            }
            .t-sig {
                flex: 1;
                padding: 4px;
                text-align: right;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            
            .t-footer-msg {
                text-align: center;
                font-size: 7pt;
                margin-top: 2px;
            }
        </style>

<style>
/* Global Print Styles since scoped doesn't affect v-html injected content well */
</style>

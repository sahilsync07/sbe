<template>
  <div class="quotation-page min-h-screen">
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
              <label>Search Party:</label>
              <div class="flex-1 w-full relative">
                <input type="text" v-model="partySearch" @input="filterParties" @focus="filterParties" @blur="handlePartyBlur" placeholder="Search party from ledger..." class="w-full">
                <div v-if="showPartyDropdown" class="autocomplete-list active" style="top:100%; position:absolute;">
                  <div v-if="filteredParties.length === 0" class="autocomplete-item no-match">No matches found</div>
                  <div v-for="(p, index) in filteredParties" :key="index" class="autocomplete-item" @mousedown="selectParty(p)">
                    <span>{{ p }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="field-row">
              <label>Name:</label>
              <input type="text" v-model="partyName" readonly class="readonly-input">
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
const partySearch = ref('');
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
  if (!partySearch.value) {
    filteredParties.value = [];
    showPartyDropdown.value = false;
    return;
  }
  const terms = partySearch.value.toLowerCase().split(/\s+/).filter(Boolean);
  filteredParties.value = parties.value.filter(p => {
    const pLower = p.toLowerCase();
    return terms.every(t => pLower.includes(t));
  }).slice(0, 20);
  showPartyDropdown.value = true;
};

const selectParty = (party) => {
  partySearch.value = party;
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

  const pName = partyName.value || partySearch.value || '-';
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
.quotation-page {
  background-color: #fafafa;
  font-family: 'Inter', sans-serif;
}
.home-header-card {
  border-radius: 1.75rem;
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(20px) saturate(1.35);
  box-shadow: 0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 40px -18px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.5);
}
.home-back-btn {
  background: #fff;
  box-shadow: 0 4px 14px rgba(15,23,42,0.08), 0 0 0 1px rgba(226,232,240,0.9);
}

.bill-container {
  --canvas-bg: #f3f4f6;
  --card-bg: #ffffff;
  --border-color: #000000;
  --border-light: #e5e7eb;
  --text-primary: #000000;
  --text-secondary: #4b5563;
  --text-disabled: #9ca3af;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 8px 16px -4px rgba(0, 0, 0, 0.1);
  --font-mono: 'JetBrains Mono', Courier, monospace;
  
  background-color: var(--card-bg);
  border: 2px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--shadow);
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 80vh;
}
.bill-container::before {
  content: '';
  position: absolute;
  top: 4px; left: 4px; right: -6px; bottom: -6px;
  border: 2px solid var(--border-color);
  background: var(--card-bg);
  z-index: -1;
  border-radius: 4px;
}
#status-bar {
  position: absolute; top: 0.5rem; right: 1rem;
  font-size: 0.7rem; font-family: var(--font-mono);
  font-weight: 700; color: var(--text-secondary);
}
.invoice-header { text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-color); }
.invoice-header h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: -1.5px; }
.invoice-header h2 { font-size: 1.2rem; font-weight: 600; }
.invoice-header p { font-size: 0.75rem; font-family: var(--font-mono); color: var(--text-secondary); }
.party-details { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; padding: 1rem; background-color: var(--canvas-bg); border: 1px dashed var(--border-color); border-radius: 4px; }
.party-details .field-group { display: flex; flex-direction: column; gap: 0.5rem; }
.party-details .field-row { display: flex; align-items: center; gap: 0.5rem; }
.party-details label { width: 6rem; font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); flex-shrink: 0; }
input, select { font-family: var(--font-mono); font-size: 16px; padding: 6px 8px; border: 2px solid var(--border-color); border-radius: 4px; background-color: var(--card-bg); color: var(--text-primary); outline: none; min-height: 44px; width: 100%; }
input.readonly-input { background-color: #e5e7eb; color: var(--text-secondary); pointer-events: none; }
input:focus { box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15); }

.table-wrap { overflow: visible; margin-bottom: 1.5rem; }
table { width: 100%; border-collapse: collapse; }
th { background-color: var(--border-color); color: #ffffff; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 0.6rem 0.75rem; }
td { padding: 0.25rem; font-size: 0.8rem; border-bottom: 1px solid var(--border-light); }
.tally-mode input:focus { background-color: #fff9c4; color: #000; font-weight: 600; }
table input { border: none; background: transparent; padding: 0.5rem; width: 100%; min-height: 40px; }
table input[type="number"] { text-align: right; }
.td-relative { position: relative; }
.td-sl { text-align: center; color: var(--text-secondary); }
.td-amount { text-align: right; padding: 0.5rem; font-family: var(--font-mono); font-weight: 700; }
.btn-remove { background: none; border: none; font-size: 1.2rem; color: var(--text-disabled); cursor: pointer; padding: 0 0.5rem; }
.btn-remove:hover { color: red; }

.btn-primary { font-weight: 600; padding: 0.75rem 1.5rem; background-color: var(--border-color); color: #fff; border-radius: 4px; }
.btn-secondary { font-weight: 600; padding: 0.5rem 1rem; background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 4px; }
.btn-add { margin-top: 1rem; }
.btn-container { margin-top: 2rem; display: flex; justify-content: flex-end; }

.summary-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; border-top: 2px solid var(--border-color); padding-top: 1.5rem; }
.amount-words { border: 1px dashed var(--border-color); padding: 1rem; background-color: var(--canvas-bg); font-family: var(--font-mono); border-radius: 4px; font-size: 0.85rem; font-style: italic; }
.not-print-label { font-style: normal; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; display: block; margin-bottom: 0.25rem; }
.bank-details { margin-top: 1rem; border: 2px solid var(--border-color); padding: 1rem; border-radius: 4px; font-size: 0.85rem; }
.bank-title { font-family: var(--font-mono); font-weight: 700; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 0.25rem; }

.summary-right { text-align: right; font-size: 0.9rem; }
.summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
.summary-row .label { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.summary-row .value { font-family: var(--font-mono); font-weight: 700; }
.extra-disc-input { width: 5rem; text-align: right; padding: 2px 6px; font-size: 0.8rem; }
.summary-divider { height: 1px; background-color: var(--border-color); margin: 0.5rem 0; }
.summary-row-grand { display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; }
.signature-box { display: none; }

.autocomplete-list { background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 4px; max-height: 250px; overflow-y: auto; width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 50; }
.autocomplete-item { padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border-light); font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; }
.autocomplete-item:hover { background: var(--border-color); color: #fff; }
.qty-tag, .price-tag { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 2px; border: 1px solid currentColor; }

#print-output { display: none; }

@media (max-width: 768px) {
  .party-details { grid-template-columns: 1fr; }
  .summary-section { grid-template-columns: 1fr; }
  #billTable thead { display: none; }
  #billTable tr { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; border: 2px solid var(--border-color); padding: 12px; margin-bottom: 12px; position: relative; }
  #billTable td { border: none; padding: 0; display: flex; flex-direction: column; }
  #billTable td::before { content: attr(data-label); font-family: var(--font-mono); font-size: 0.55rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 2px; font-weight: 700; }
  #billTable td:nth-child(1) { position: absolute; top: 8px; left: 10px; }
  #billTable td:nth-child(2) { grid-column: 1 / -1; margin-top: 10px; }
  #billTable td:nth-child(6) { grid-column: span 2; text-align: right; font-size: 1.15rem; }
  #billTable td:nth-child(7) { position: absolute; top: 4px; right: 4px; }
}

@media print {
  @page { size: A4; margin: 5mm; }
  body * { visibility: hidden; }
  #print-output, #print-output * { visibility: visible; }
  #print-output { display: block; position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}
</style>

<style>
/* Global Print Styles since scoped doesn't affect v-html injected content well */
@media print {
  .tally-bill { width: 100%; color: #000; font-family: Arial, sans-serif; font-size: 8pt; line-height: 1.2; }
  .tally-bill + .tally-bill { page-break-before: always; }
  .tally-title { text-align: center; font-weight: bold; font-size: 10pt; text-decoration: underline; margin-bottom: 4px; text-transform: uppercase; }
  .tally-box { border: 1px solid #000; display: flex; flex-direction: column; }
  .t-row { display: flex; border-bottom: 1px solid #000; }
  .t-col-left { flex: 1; border-right: 1px solid #000; display: flex; flex-direction: column; }
  .t-col-right { flex: 1; display: flex; flex-direction: column; }
  .t-company, .t-buyer { padding: 4px; }
  .t-buyer { border-top: 1px solid #000; flex: 1; }
  .t-grid-2 { display: flex; border-bottom: 1px solid #000; flex: 1; }
  .t-grid-2:last-child { border-bottom: none; }
  .t-gcol { flex: 1; padding: 2px 4px; border-right: 1px solid #000; }
  .t-gcol:last-child { border-right: none; }
  .t-gcol-full { flex: 1; padding: 2px 4px; }
  .tally-table-wrapper { border-bottom: 1px solid #000; min-height: 300px; }
  table.t-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .t-table th { border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 2px; text-align: center; font-weight: normal; }
  .t-table th:last-child { border-right: none; }
  .t-table td { border-right: 1px solid #000; padding: 2px 4px; vertical-align: top; }
  .t-table td:last-child { border-right: none; }
  .t-table td.num { text-align: right; }
  .t-table td.cen { text-align: center; }
  .t-table-totals { width: 100%; border-collapse: collapse; }
  .t-table-totals td { border-top: 1px solid #000; padding: 4px; font-weight: bold; }
  .t-words { padding: 4px; border-bottom: 1px solid #000; }
  .t-tax-summary { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
  .t-tax-summary th, .t-tax-summary td { border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 4px; text-align: right; }
  .t-tax-summary th { text-align: center; }
  .t-tax-summary th:last-child, .t-tax-summary td:last-child { border-right: none; }
  .t-bank-sig { display: flex; }
  .t-bank { flex: 1; border-right: 1px solid #000; padding: 4px; }
  .t-sig { flex: 1; padding: 4px; text-align: right; display: flex; flex-direction: column; justify-content: space-between; }
  .t-footer-msg { text-align: center; font-size: 7pt; margin-top: 2px; }
}
</style>

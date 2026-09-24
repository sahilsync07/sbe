import { ref, computed } from 'vue';
import { useLedgerData } from '@/composables/useLedgerData';

/**
 * Composable for the Debtors Aging & Payment Recovery Analyzer.
 * Filtered strictly to Line Debtors (including Rayagada Local).
 * Computes 0-30, 31-60, 61-90, 90-180, and 180+ days mutually exclusive aging buckets.
 */
export function useAnalyzerData() {
  const { ledgerData, loading, error, loadLedgerData } = useLedgerData();

  const viewMode = ref('Party View'); // 'Party View' | 'Group View'
  const searchQuery = ref('');
  const selectedGroups = ref([]);
  const activeAgingFilter = ref('all'); // 'all' | '180plus' | '90_180' | '61_90' | '31_60' | '0_30'
  const sortBy = ref('overdue_desc'); // 'overdue_desc' | 'balance_desc' | 'balance_asc' | 'name_asc' | 'name_desc'

  // ─── Date Parsing Helpers ──────────────────────────────────────────────
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const dateCache = new Map();
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateCache.has(dateStr)) return dateCache.get(dateStr);
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [day, monthStr, yearShort] = parts;
    const month = monthMap[monthStr];
    if (month === undefined) return null;
    let year = parseInt(yearShort, 10);
    year = year < 50 ? 2000 + year : 1900 + year;
    const d = new Date(year, month, parseInt(day, 10));
    dateCache.set(dateStr, d);
    return d;
  };

  // Compute reference date (latest transaction date across all ledgers or today)
  const referenceDate = computed(() => {
    let latest = new Date();
    if (ledgerData.value && Array.isArray(ledgerData.value)) {
      for (const group of ledgerData.value) {
        if (!group.ledgers) continue;
        for (const ledger of group.ledgers) {
          if (!ledger.entries) continue;
          for (const e of ledger.entries) {
            const d = parseDate(e.date);
            if (d && d > latest) {
              latest = d;
            }
          }
        }
      }
    }
    return latest;
  });

  // ─── Strictly Allowed Line Debtors Groups (From Line List + Rayagada Local) ──
  const ALLOWED_LINE_GROUPS_SET = new Set([
    'BALIMELA,CHITROKUNDA,MALKANGIRI',
    'Bissam Cuttack',
    'DURGI-KD-THERUBALI-JK LINE',
    'GUDARI & GUNUPUR',
    'Gunupur Line',
    'Jeypur',
    'Jk Line',
    'KALYAN SINGHPUR LINE',
    'Kashipur Line',
    'KORAPUT LINE',
    'Kotpeta Line',
    'MUNIGUDA & B.CTC LINE',
    'Parlakhimundi Line',
    'PARVATHIPURAM',
    'PHULBAANI LINE',
    'RAYAGADA LOCAL',
    'Srikakulam Line',
    'TIKIRI & KASIPUR LINE'
  ].map(g => g.toLowerCase().trim()));

  const isAllowedLineGroup = (gName) => {
    const name = (gName || '').toLowerCase().trim();
    return ALLOWED_LINE_GROUPS_SET.has(name);
  };

  const isExcludedLedger = (lName) => {
    const name = (lName || '').trim();
    if (!name) return true;
    return /^(profit|loss|cash|tcs|tds|gst|sale@|purchase@|round off|staff|bank|capital|drawings|freight|discount|expenses|insurance)/i.test(name) || /^\d{2,4}$/.test(name);
  };

  // ─── Classification & 5-Bucket Aging Computation ───────────────────────
  const processedData = computed(() => {
    if (!ledgerData.value || !Array.isArray(ledgerData.value)) {
      return { debtors: [] };
    }

    const refDate = referenceDate.value;
    const debtors = [];

    for (const group of ledgerData.value) {
      if (!isAllowedLineGroup(group.groupName) || !group.ledgers) continue;

      for (const ledger of group.ledgers) {
        if (isExcludedLedger(ledger.ledgerName)) continue;
        const closing = ledger.closingBalance || 0;
        if (Math.abs(closing) < 0.01) continue; // Skip zero balance accounts

        // Strictly customer debtor outstanding
        const totalOutstanding = Math.abs(closing);

        // Collect invoices (Dr entries or Sales)
        const entries = (ledger.entries || []).map(e => ({
          ...e,
          parsedDate: parseDate(e.date)
        })).filter(e => e.parsedDate !== null);

        // Sort entries newest first
        entries.sort((a, b) => b.parsedDate - a.parsedDate);

        let unallocatedBalance = totalOutstanding;
        let b_1m = 0;
        let b_2m = 0;
        let b_3m = 0;
        let b_6m = 0;
        let b_9m = 0;
        let b_1y_plus = 0;
        const pendingBills = [];

        const invoiceEntries = entries.filter(e => e.drCr === 'Dr' || e.type === 'Tax Invoice' || e.type === 'Sales');

        for (const inv of invoiceEntries) {
          if (unallocatedBalance <= 0) break;

          const daysOld = Math.max(0, Math.floor((refDate - inv.parsedDate) / (1000 * 60 * 60 * 24)));
          const amountToAllocate = Math.min(unallocatedBalance, inv.amount || 0);

          let bucket = '< 1 Month';
          if (daysOld <= 30) {
            b_1m += amountToAllocate;
            bucket = '< 1 Month';
          } else if (daysOld <= 60) {
            b_2m += amountToAllocate;
            bucket = '2 Months';
          } else if (daysOld <= 90) {
            b_3m += amountToAllocate;
            bucket = '3 Months';
          } else if (daysOld <= 180) {
            b_6m += amountToAllocate;
            bucket = '3–6 Months';
          } else if (daysOld <= 270) {
            b_9m += amountToAllocate;
            bucket = '6–9 Months';
          } else {
            b_1y_plus += amountToAllocate;
            bucket = '1 Year+';
          }

          pendingBills.push({
            date: inv.date,
            voucherNo: inv.voucherNo ? `Bill #${inv.voucherNo}` : (inv.type || 'Invoice'),
            amount: amountToAllocate,
            fullAmount: inv.amount || 0,
            daysOld,
            bucket,
            parsedDate: inv.parsedDate
          });

          unallocatedBalance -= amountToAllocate;
        }

        // Remaining balance older than recent invoices falls into 1 Year+
        if (unallocatedBalance > 0) {
          b_1y_plus += unallocatedBalance;
          pendingBills.push({
            date: 'Prior Balance',
            voucherNo: 'Opening / Prior Balance',
            amount: unallocatedBalance,
            fullAmount: unallocatedBalance,
            daysOld: 271,
            bucket: '1 Year+',
            parsedDate: new Date(2000, 0, 1)
          });
        }

        // Sort pending bills in ascending order of date (Oldest to Most Recent)
        pendingBills.sort((a, b) => a.parsedDate - b.parsedDate);

        // Backward compatibility properties
        const b0_30 = b_1m;
        const b31_60 = b_2m;
        const b61_90 = b_3m;
        const b90_180 = b_6m;
        const b180_plus = b_9m + b_1y_plus;

        // Percentage breakdown for progress bars
        const pct0_30 = totalOutstanding > 0 ? (b0_30 / totalOutstanding) * 100 : 0;
        const pct31_60 = totalOutstanding > 0 ? (b31_60 / totalOutstanding) * 100 : 0;
        const pct61_90 = totalOutstanding > 0 ? (b61_90 / totalOutstanding) * 100 : 0;
        const pct90_180 = totalOutstanding > 0 ? (b90_180 / totalOutstanding) * 100 : 0;
        const pct180_plus = totalOutstanding > 0 ? (b180_plus / totalOutstanding) * 100 : 0;

        // Mutually Exclusive Primary Bucket Allocation
        let primaryBucket = '0_30';
        if (b_1y_plus > 100) {
          primaryBucket = '1y_plus';
        } else if (b_9m > 100) {
          primaryBucket = '9m';
        } else if (b_6m > 100) {
          primaryBucket = '90_180';
        } else if (b_3m > 100) {
          primaryBucket = '61_90';
        } else if (b_2m > 100) {
          primaryBucket = '31_60';
        } else {
          primaryBucket = '0_30';
        }

        const partyRecord = {
          ledgerName: ledger.ledgerName || 'Unknown Party',
          groupName: group.groupName || 'Rayagada Local',
          closingBalance: closing,
          totalOutstanding,
          isDebtor: true,
          primaryBucket,
          rawLedger: ledger,
          b_1m,
          b_2m,
          b_3m,
          b_6m,
          b_9m,
          b_1y_plus,
          aging: {
            b_1m,
            b_2m,
            b_3m,
            b_6m,
            b_9m,
            b_1y_plus,
            b0_30,
            b31_60,
            b61_90,
            b90_180,
            b180_plus,
            pct0_30,
            pct31_60,
            pct61_90,
            pct90_180,
            pct180_plus,
            overdueTotal: b31_60 + b61_90 + b90_180 + b180_plus,
            criticalTotal: b90_180 + b180_plus
          },
          pendingBills,
          entries: entries.slice(0, 8),
          totalEntriesCount: entries.length
        };

        debtors.push(partyRecord);
      }
    }

    return { debtors };
  });

  const currentList = computed(() => {
    return processedData.value.debtors;
  });

  // Unique Line Groups List
  const groupList = computed(() => {
    const map = new Map();
    for (const item of currentList.value) {
      if (!map.has(item.groupName)) {
        map.set(item.groupName, {
          groupName: item.groupName,
          count: 0,
          totalAmount: 0,
          b0_30: 0,
          b31_60: 0,
          b61_90: 0,
          b90_180: 0,
          b180_plus: 0
        });
      }
      const g = map.get(item.groupName);
      g.count += 1;
      g.totalAmount += item.totalOutstanding;
      g.b0_30 += item.aging.b0_30;
      g.b31_60 += item.aging.b31_60;
      g.b61_90 += item.aging.b61_90;
      g.b90_180 += item.aging.b90_180;
      g.b180_plus += item.aging.b180_plus;
    }
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  });

  // 5 KPI Summary Statistics for Top Cards
  const summaryStats = computed(() => {
    const list = currentList.value;
    let totalOutstanding = 0;
    let b0_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90_180 = 0;
    let b180_plus = 0;

    let count180_plus = 0;
    let count90_180 = 0;
    let count61_90 = 0;
    let count31_60 = 0;
    let count0_30 = 0;

    for (const item of list) {
      totalOutstanding += item.totalOutstanding;
      b0_30 += item.aging.b0_30;
      b31_60 += item.aging.b31_60;
      b61_90 += item.aging.b61_90;
      b90_180 += item.aging.b90_180;
      b180_plus += item.aging.b180_plus;

      if (item.primaryBucket === '180plus') count180_plus++;
      else if (item.primaryBucket === '90_180') count90_180++;
      else if (item.primaryBucket === '61_90') count61_90++;
      else if (item.primaryBucket === '31_60') count31_60++;
      else count0_30++;
    }

    return {
      totalOutstanding,
      totalCount: list.length,
      b0_30,
      b31_60,
      b61_90,
      b90_180,
      b180_plus,
      count180_plus,
      count90_180,
      count61_90,
      count31_60,
      count0_30,
      pct0_30: totalOutstanding > 0 ? (b0_30 / totalOutstanding) * 100 : 0,
      pct31_60: totalOutstanding > 0 ? (b31_60 / totalOutstanding) * 100 : 0,
      pct61_90: totalOutstanding > 0 ? (b61_90 / totalOutstanding) * 100 : 0,
      pct90_180: totalOutstanding > 0 ? (b90_180 / totalOutstanding) * 100 : 0,
      pct180_plus: totalOutstanding > 0 ? (b180_plus / totalOutstanding) * 100 : 0
    };
  });

  // Filtered & Sorted Parties (Mutually Exclusive Buckets)
  const filteredParties = computed(() => {
    let result = [...currentList.value];

    // 1. Search Query Filter
    if (searchQuery.value && searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      result = result.filter(item =>
        item.ledgerName.toLowerCase().includes(q) ||
        item.groupName.toLowerCase().includes(q)
      );
    }

    // 2. Selected Group Filter
    if (selectedGroups.value.length > 0) {
      result = result.filter(item => selectedGroups.value.includes(item.groupName));
    }

    // 3. Mutually Exclusive Aging Risk Filter
    if (activeAgingFilter.value === '180plus') {
      result = result.filter(item => item.primaryBucket === '180plus');
    } else if (activeAgingFilter.value === '90_180') {
      result = result.filter(item => item.primaryBucket === '90_180');
    } else if (activeAgingFilter.value === '61_90') {
      result = result.filter(item => item.primaryBucket === '61_90');
    } else if (activeAgingFilter.value === '31_60') {
      result = result.filter(item => item.primaryBucket === '31_60');
    } else if (activeAgingFilter.value === '0_30') {
      result = result.filter(item => item.primaryBucket === '0_30');
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy.value === 'overdue_desc') {
        return (b.aging.b180_plus + b.aging.b90_180 + b.aging.b61_90) - (a.aging.b180_plus + a.aging.b90_180 + a.aging.b61_90);
      } else if (sortBy.value === 'balance_desc') {
        return b.totalOutstanding - a.totalOutstanding;
      } else if (sortBy.value === 'balance_asc') {
        return a.totalOutstanding - b.totalOutstanding;
      } else if (sortBy.value === 'name_asc') {
        return a.ledgerName.localeCompare(b.ledgerName);
      } else if (sortBy.value === 'name_desc') {
        return b.ledgerName.localeCompare(a.ledgerName);
      }
      return 0;
    });

    return result;
  });

  // Grouped View Data
  const groupedViewData = computed(() => {
    const groupsMap = new Map();

    for (const party of filteredParties.value) {
      if (!groupsMap.has(party.groupName)) {
        groupsMap.set(party.groupName, {
          groupName: party.groupName,
          parties: [],
          totalOutstanding: 0,
          b0_30: 0,
          b31_60: 0,
          b61_90: 0,
          b90_180: 0,
          b180_plus: 0,
          isExpanded: false
        });
      }
      const g = groupsMap.get(party.groupName);
      g.parties.push(party);
      g.totalOutstanding += party.totalOutstanding;
      g.b0_30 += party.aging.b0_30;
      g.b31_60 += party.aging.b31_60;
      g.b61_90 += party.aging.b61_90;
      g.b90_180 += party.aging.b90_180;
      g.b180_plus += party.aging.b180_plus;
    }

    const groupsArr = Array.from(groupsMap.values());
    for (const g of groupsArr) {
      g.pct0_30 = g.totalOutstanding > 0 ? (g.b0_30 / g.totalOutstanding) * 100 : 0;
      g.pct31_60 = g.totalOutstanding > 0 ? (g.b31_60 / g.totalOutstanding) * 100 : 0;
      g.pct61_90 = g.totalOutstanding > 0 ? (g.b61_90 / g.totalOutstanding) * 100 : 0;
      g.pct90_180 = g.totalOutstanding > 0 ? (g.b90_180 / g.totalOutstanding) * 100 : 0;
      g.pct180_plus = g.totalOutstanding > 0 ? (g.b180_plus / g.totalOutstanding) * 100 : 0;
    }

    return groupsArr.sort((a, b) => b.totalAmount - a.totalAmount);
  });

  const formatINR = (val) => {
    const num = Math.round(val || 0);
    return '₹' + num.toLocaleString('en-IN');
  };

  const formatCompactINR = (val) => {
    const num = Math.round(val || 0);
    if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + ' k';
    return '₹' + num.toLocaleString('en-IN');
  };

  /**
   * Concise WhatsApp Payment Follow-up with Pending Bills (Oldest to Recent) & Overdue Days
   */
/**
   * Enterprise-Grade Professional WhatsApp Payment Follow-up with Bill Details & Overdue Days
   */
/**
   * Enterprise-Grade Professional WhatsApp Payment Follow-up (Auto-fitted under WhatsApp 1024-char caption limit)
   */
  const getWhatsAppFollowupText = (party) => {
    const name = party.ledgerName;
    const hasBalance = party.totalOutstanding && party.totalOutstanding > 0;
    const total = formatINR(party.totalOutstanding || 0);

    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    let text = `*Namaste ${name}* 🙏\n\n`;

    if (hasBalance) {
      text += `*ACCOUNT STATEMENT & DUE SUMMARY*\n`;
      text += `🏢 *Sri Brundabana Enterprises, Rayagada*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      text += `📊 *Total Outstanding Balance:* *${total}*\n\n`;

      const bills = party.pendingBills || [];
      if (bills.length > 0) {
        text += `*PENDING BILLS (Oldest to Recent):*\n`;
        
        // Show up to 5 critical oldest bills to strictly stay under WhatsApp 1024 char caption limit
        const maxBillsToShow = 5;
        const displayedBills = bills.slice(0, maxBillsToShow);
        const remainingCount = bills.length - maxBillsToShow;

        displayedBills.forEach((b, idx) => {
          const numBadge = idx < numberEmojis.length ? numberEmojis[idx] : `${idx + 1}.`;
          const datePart = b.date !== 'Prior Balance' ? ` (${b.date})` : '';
          text += `${numBadge} *${b.voucherNo}*${datePart} — *${formatINR(b.amount)}* (${b.daysOld}d due • ${b.bucket})\n`;
        });

        if (remainingCount > 0) {
          text += `➕ _+ ${remainingCount} more recent bills in attached PDF statement_\n`;
        }
        text += `\n`;
      }

      // Overdue Aging Summary (Only non-zero buckets)
      const agingLines = [];
      if (party.aging) {
        if (party.aging.b180_plus > 0) {
          agingLines.push(`• Balance (>180d): *${formatINR(party.aging.b180_plus)}*`);
        }
        if (party.aging.b90_180 > 0) {
          agingLines.push(`• Balance (90–180d): *${formatINR(party.aging.b90_180)}*`);
        }
        if (party.aging.b61_90 > 0) {
          agingLines.push(`• Balance (61–90d): *${formatINR(party.aging.b61_90)}*`);
        }
        if (party.aging.b31_60 > 0) {
          agingLines.push(`• Balance (31–60d): *${formatINR(party.aging.b31_60)}*`);
        }
        if (party.aging.b0_30 > 0) {
          agingLines.push(`• Balance (0–30d): *${formatINR(party.aging.b0_30)}*`);
        }
      }

      if (agingLines.length > 0) {
        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*AGING BREAKDOWN:*\n`;
        text += agingLines.join('\n') + `\n\n`;
      }

      text += `📄 *Attached is your 6-month statement PDF for verification.*\n`;
      text += `Kindly review and arrange for the balance clearance.\n\n`;
    } else {
      text += `*ACCOUNT STATEMENT*\n`;
      text += `🏢 *Sri Brundabana Enterprises, Rayagada*\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
      text += `📄 *Your latest statement of account is attached for your records and verification.*\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_With Regards,_\n`;
    text += `*Sri Brundabana Enterprises, Rayagada*`;

    return text;
  };

  const getWhatsAppFollowupLink = (party) => {
    const text = getWhatsAppFollowupText(party);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const getActiveAgingBuckets = (party) => {
    if (!party) return [];
    const aging = party.aging || party;
    const list = [
      { key: '1m', label: '< 1 Month', amount: party.b_1m || aging.b_1m || aging.b0_30 || 0, headerBg: 'bg-emerald-50 text-emerald-800', valueBg: 'bg-emerald-50/60 text-emerald-950', dot: 'bg-emerald-500' },
      { key: '2m', label: '2 Months', amount: party.b_2m || aging.b_2m || aging.b31_60 || 0, headerBg: 'bg-amber-50 text-amber-800', valueBg: 'bg-amber-50/60 text-amber-950', dot: 'bg-amber-500' },
      { key: '3m', label: '3 Months', amount: party.b_3m || aging.b_3m || aging.b61_90 || 0, headerBg: 'bg-orange-50 text-orange-800', valueBg: 'bg-orange-50/60 text-orange-950', dot: 'bg-orange-500' },
      { key: '6m', label: '3–6 Months', amount: party.b_6m || aging.b_6m || aging.b90_180 || 0, headerBg: 'bg-rose-50 text-rose-800', valueBg: 'bg-rose-50/60 text-rose-950', dot: 'bg-rose-500' },
      { key: '9m', label: '6–9 Months', amount: party.b_9m || aging.b_9m || 0, headerBg: 'bg-purple-50 text-purple-800', valueBg: 'bg-purple-50/60 text-purple-950', dot: 'bg-purple-500' },
      { key: '1y_plus', label: '1 Year+', amount: party.b_1y_plus || aging.b_1y_plus || 0, headerBg: 'bg-red-50 text-red-900', valueBg: 'bg-red-50/60 text-red-950', dot: 'bg-red-500' }
    ];
    const active = list.filter(b => b.amount > 0);
    return active.length > 0 ? active : [list[0]];
  };

  return {
    ledgerData,
    loading,
    error,
    loadLedgerData,
    viewMode,
    searchQuery,
    selectedGroups,
    activeAgingFilter,
    sortBy,
    referenceDate,
    currentList,
    groupList,
    summaryStats,
    filteredParties,
    groupedViewData,
    formatINR,
    formatCompactINR,
    getWhatsAppFollowupText,
    getWhatsAppFollowupLink,
    getActiveAgingBuckets
  };
}

import { ref, computed } from 'vue';
import { useLedgerData } from '@/composables/useLedgerData';

/**
 * Composable for the Debtors & Creditors Aging & Payment Recovery Analyzer.
 * Computes 0-30, 31-60, 61-90, and 90+ days aging buckets per party and per group.
 */
export function useAnalyzerData() {
  const { ledgerData, loading, error, loadLedgerData } = useLedgerData();

  const activeTab = ref('Debtors'); // 'Debtors' | 'Creditors'
  const viewMode = ref('Party View'); // 'Party View' | 'Group View'
  const searchQuery = ref('');
  const selectedGroups = ref([]);
  const activeAgingFilter = ref('all'); // 'all' | '90plus' | '60plus' | '30plus' | 'current'
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

  // ─── Exclusion Filters for Non-Debtors / Non-Creditors ────────────────
  const EXCLUDED_GROUPS = new Set([
    '_META_DATA_',
    '&#4; Primary',
    'Bank Accounts',
    'Bank OD A/c',
    'Capital Account',
    'Cash-in-Hand',
    'Current Assets',
    'Current Liabilities',
    'Direct Expenses',
    'Direct Incomes',
    'Duties & Taxes',
    'Fixed Assets',
    'Indirect Expenses',
    'Indirect Incomes',
    'Investments',
    'Petty Expenses',
    'Purchase Accounts',
    'Sales Accounts',
    'STAFF',
    'Unsecured Loans'
  ]);

  const EXCLUDED_LEDGER_PATTERNS = [
    /^profit\s*&\s*loss/i,
    /^cash(\s+salary)?$/i,
    /^tcs$/i,
    /^tds/i,
    /^(c|s|i|ut)?gst/i,
    /^sale@gst/i,
    /^purchase@gst/i,
    /^round\s*off$/i,
    /^\d{2,4}$/, // Loan codes like 222, 333, 444, 666
    /staff/i,
    /^bank\s/i,
    /capital/i,
    /drawings/i,
    /freight/i,
    /discount/i,
    /expenses/i,
    /insurance/i
  ];

  const isExcludedGroup = (gName) => {
    const name = (gName || '').trim();
    if (EXCLUDED_GROUPS.has(name)) return true;
    if (/^(staff|bank|duty|duties|tax|expense|income|loan|asset|liabilit|capital)/i.test(name)) return true;
    return false;
  };

  const isExcludedLedger = (lName) => {
    const name = (lName || '').trim();
    if (!name) return true;
    return EXCLUDED_LEDGER_PATTERNS.some(pattern => pattern.test(name));
  };

  // ─── Classification & Aging Computation ────────────────────────────────
  const processedData = computed(() => {
    if (!ledgerData.value || !Array.isArray(ledgerData.value)) {
      return { debtors: [], creditors: [] };
    }

    const refDate = referenceDate.value;
    const debtors = [];
    const creditors = [];

    for (const group of ledgerData.value) {
      if (isExcludedGroup(group.groupName) || !group.ledgers) continue;

      for (const ledger of group.ledgers) {
        if (isExcludedLedger(ledger.ledgerName)) continue;
        const closing = ledger.closingBalance || 0;
        if (Math.abs(closing) < 0.01) continue; // Skip zero balance accounts

        // Accounting classification:
        // closing < 0 (Dr) -> Debtor (Customer owes SBE)
        // closing > 0 (Cr) -> Creditor (SBE owes Supplier)
        const isDebtor = closing < 0;
        const totalOutstanding = Math.abs(closing);

        // Calculate Aging Buckets using FIFO / Invoices
        // Collect invoices (Dr entries for Debtors, Cr entries for Creditors)
        const entries = (ledger.entries || []).map(e => ({
          ...e,
          parsedDate: parseDate(e.date)
        })).filter(e => e.parsedDate !== null);

        // Sort entries newest first
        entries.sort((a, b) => b.parsedDate - a.parsedDate);

        let unallocatedBalance = totalOutstanding;
        let b0_30 = 0;
        let b31_60 = 0;
        let b61_90 = 0;
        let b90_plus = 0;

        // Relevant invoice entry type for aging
        const invoiceEntries = entries.filter(e => {
          if (isDebtor) {
            return e.drCr === 'Dr' || e.type === 'Tax Invoice' || e.type === 'Sales';
          } else {
            return e.drCr === 'Cr' || e.type === 'Tax Invoice' || e.type === 'Purchase';
          }
        });

        for (const inv of invoiceEntries) {
          if (unallocatedBalance <= 0) break;

          const daysOld = Math.max(0, Math.floor((refDate - inv.parsedDate) / (1000 * 60 * 60 * 24)));
          const amountToAllocate = Math.min(unallocatedBalance, inv.amount || 0);

          if (daysOld <= 30) {
            b0_30 += amountToAllocate;
          } else if (daysOld <= 60) {
            b31_60 += amountToAllocate;
          } else if (daysOld <= 90) {
            b61_90 += amountToAllocate;
          } else {
            b90_plus += amountToAllocate;
          }

          unallocatedBalance -= amountToAllocate;
        }

        // Any remaining balance not covered by recent invoices is older than 90 days
        if (unallocatedBalance > 0) {
          b90_plus += unallocatedBalance;
        }

        // Percentage breakdown for visual progress bar
        const pct0_30 = totalOutstanding > 0 ? (b0_30 / totalOutstanding) * 100 : 0;
        const pct31_60 = totalOutstanding > 0 ? (b31_60 / totalOutstanding) * 100 : 0;
        const pct61_90 = totalOutstanding > 0 ? (b61_90 / totalOutstanding) * 100 : 0;
        const pct90_plus = totalOutstanding > 0 ? (b90_plus / totalOutstanding) * 100 : 0;

        const partyRecord = {
          ledgerName: ledger.ledgerName || 'Unknown Party',
          groupName: group.groupName || 'General',
          closingBalance: closing,
          totalOutstanding,
          isDebtor,
          rawLedger: ledger,
          aging: {
            b0_30,
            b31_60,
            b61_90,
            b90_plus,
            pct0_30,
            pct31_60,
            pct61_90,
            pct90_plus,
            overdueTotal: b31_60 + b61_90 + b90_plus,
            criticalTotal: b90_plus
          },
          entries: entries.slice(0, 8), // Recent 8 entries for quick preview
          totalEntriesCount: entries.length
        };

        if (isDebtor) {
          debtors.push(partyRecord);
        } else {
          creditors.push(partyRecord);
        }
      }
    }

    return { debtors, creditors };
  });

  // Current active dataset (Debtors or Creditors)
  const currentList = computed(() => {
    return activeTab.value === 'Debtors' ? processedData.value.debtors : processedData.value.creditors;
  });

  // Unique group list for filter dropdown
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
          b90_plus: 0
        });
      }
      const g = map.get(item.groupName);
      g.count += 1;
      g.totalAmount += item.totalOutstanding;
      g.b0_30 += item.aging.b0_30;
      g.b31_60 += item.aging.b31_60;
      g.b61_90 += item.aging.b61_90;
      g.b90_plus += item.aging.b90_plus;
    }
    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  });

  // KPI Summary Statistics for Top Cards
  const summaryStats = computed(() => {
    const list = currentList.value;
    let totalOutstanding = 0;
    let b0_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90_plus = 0;
    let criticalCount = 0;
    let overdueCount = 0;

    for (const item of list) {
      totalOutstanding += item.totalOutstanding;
      b0_30 += item.aging.b0_30;
      b31_60 += item.aging.b31_60;
      b61_90 += item.aging.b61_90;
      b90_plus += item.aging.b90_plus;

      if (item.aging.b90_plus > 100) criticalCount++;
      if (item.aging.overdueTotal > 100) overdueCount++;
    }

    return {
      totalOutstanding,
      totalCount: list.length,
      b0_30,
      b31_60,
      b61_90,
      b90_plus,
      criticalCount,
      overdueCount,
      pct0_30: totalOutstanding > 0 ? (b0_30 / totalOutstanding) * 100 : 0,
      pct31_60: totalOutstanding > 0 ? (b31_60 / totalOutstanding) * 100 : 0,
      pct61_90: totalOutstanding > 0 ? (b61_90 / totalOutstanding) * 100 : 0,
      pct90_plus: totalOutstanding > 0 ? (b90_plus / totalOutstanding) * 100 : 0
    };
  });

  // Filtered & Sorted Parties
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

    // 3. Aging Risk Filter
    if (activeAgingFilter.value === '90plus') {
      result = result.filter(item => item.aging.b90_plus > 100);
    } else if (activeAgingFilter.value === '60plus') {
      result = result.filter(item => (item.aging.b61_90 + item.aging.b90_plus) > 100);
    } else if (activeAgingFilter.value === '30plus') {
      result = result.filter(item => item.aging.overdueTotal > 100);
    } else if (activeAgingFilter.value === 'current') {
      result = result.filter(item => item.aging.b0_30 > 100);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy.value === 'overdue_desc') {
        return (b.aging.b90_plus + b.aging.b61_90) - (a.aging.b90_plus + a.aging.b61_90);
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
          b90_plus: 0,
          isExpanded: false
        });
      }
      const g = groupsMap.get(party.groupName);
      g.parties.push(party);
      g.totalOutstanding += party.totalOutstanding;
      g.b0_30 += party.aging.b0_30;
      g.b31_60 += party.aging.b31_60;
      g.b61_90 += party.aging.b61_90;
      g.b90_plus += party.aging.b90_plus;
    }

    const groupsArr = Array.from(groupsMap.values());
    for (const g of groupsArr) {
      g.pct0_30 = g.totalOutstanding > 0 ? (g.b0_30 / g.totalOutstanding) * 100 : 0;
      g.pct31_60 = g.totalOutstanding > 0 ? (g.b31_60 / g.totalOutstanding) * 100 : 0;
      g.pct61_90 = g.totalOutstanding > 0 ? (g.b61_90 / g.totalOutstanding) * 100 : 0;
      g.pct90_plus = g.totalOutstanding > 0 ? (g.b90_plus / g.totalOutstanding) * 100 : 0;
    }

    return groupsArr.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  });

  // ─── Formatters & Utility Functions ────────────────────────────────────
  const formatINR = (val) => {
    if (val === undefined || val === null) return '₹0';
    const num = Math.round(Number(val));
    return '₹' + num.toLocaleString('en-IN');
  };

  const formatShortINR = (val) => {
    if (!val || val === 0) return '₹0';
    const num = Math.abs(Number(val));
    if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
    if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + ' L';
    if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + ' k';
    return '₹' + num.toLocaleString('en-IN');
  };

  /**
   * Generate WhatsApp payment follow-up message text
   */
  const getWhatsAppFollowupText = (party) => {
    const name = party.ledgerName;
    const total = formatINR(party.totalOutstanding);
    const overdue = formatINR(party.aging.b61_90 + party.aging.b90_plus);
    const isOverdue = (party.aging.b61_90 + party.aging.b90_plus) > 0;

    let text = `*Payment Statement Reminder*\n\nDear *${name}*,\nGreetings from *Sri Balaji Enterprises*.\n\n`;
    text += `Your total current ledger balance is: *${total}*.\n`;

    if (isOverdue) {
      text += `• Overdue (>60 days): *${overdue}*\n`;
    }
    if (party.aging.b90_plus > 0) {
      text += `• Critical (>90 days): *${formatINR(party.aging.b90_plus)}*\n`;
    }

    text += `\n📄 *Detailed 6-Month Ledger Statement PDF attached for your verification.*\n`;
    text += `\nKindly verify and arrange for payment clearance at your earliest convenience.\n\nThank you! 🙏\n_Sri Balaji Enterprises_`;

    return text;
  };

  /**
   * Generate WhatsApp payment follow-up message link
   */
  const getWhatsAppFollowupLink = (party) => {
    const text = getWhatsAppFollowupText(party);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return {
    ledgerData,
    loading,
    error,
    loadLedgerData,
    activeTab,
    viewMode,
    searchQuery,
    selectedGroups,
    activeAgingFilter,
    sortBy,
    groupList,
    summaryStats,
    filteredParties,
    groupedViewData,
    currentList,
    formatINR,
    formatShortINR,
    getWhatsAppFollowupText,
    getWhatsAppFollowupLink
  };
}
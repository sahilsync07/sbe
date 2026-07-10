import { ref, computed } from 'vue';
import { useLedgerData } from './useLedgerData';

/**
 * Composable for the Analyzer page.
 * Processes ledger data to produce monthly summaries for Debtors & Creditors,
 * with percentage change indicators and 6-month history.
 */
export function useAnalyzerData() {
  const { ledgerData, loading, error, loadLedgerData } = useLedgerData();

  // ─── Helpers ──────────────────────────────────────────────

  /**
   * Parse a Tally date string like "25-Apr-26" into a JS Date.
   * Two-digit years: 00-49 → 2000s, 50-99 → 1900s.
   */
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [day, monthStr, yearShort] = parts;
    const monthMap = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const month = monthMap[monthStr];
    if (month === undefined) return null;
    let year = parseInt(yearShort, 10);
    year = year < 50 ? 2000 + year : 1900 + year;
    return new Date(year, month, parseInt(day, 10));
  };

  /**
   * Get a month key like "2026-07" from a Date object.
   */
  const getMonthKey = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  /**
   * Get display label for a month key, e.g. "Jul 2026".
   */
  const getMonthLabel = (key) => {
    const [y, m] = key.split('-');
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${labels[parseInt(m, 10) - 1]} ${y}`;
  };

  /**
   * Generate sorted array of last N month keys ending at the current month.
   */
  const getLastNMonths = (n) => {
    const now = new Date();
    const months = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(getMonthKey(d));
    }
    return months;
  };

  // The 6 months we care about (including current month)
  const months = computed(() => getLastNMonths(6));
  const currentMonth = computed(() => months.value[months.value.length - 1]);
  // Previous 5 months (excluding current), newest first for display
  const previousMonths = computed(() => {
    const ms = months.value.slice(0, -1); // remove current month
    return [...ms].reverse(); // newest first: Jun, May, Apr, Mar, Feb
  });

  // ─── Classification ───────────────────────────────────────

  /**
   * Classify a group as 'debtor' or 'creditor' based on entry types.
   * - Groups with predominantly Receipt entries → Debtors (Sundry Debtors)
   * - Groups with predominantly Payment entries → Creditors (Sundry Creditors)
   * - Fallback: negative closing balance (Dr) → Debtor, positive (Cr) → Creditor
   */
  const classifyGroup = (group) => {
    if (!group.ledgers || group.ledgers.length === 0) return 'debtor';

    let receiptCount = 0;
    let paymentCount = 0;
    let totalClosing = 0;

    group.ledgers.forEach(ledger => {
      totalClosing += (ledger.closingBalance || 0);
      if (ledger.entries) {
        ledger.entries.forEach(e => {
          if (e.type === 'Receipt') receiptCount++;
          if (e.type === 'Payment') paymentCount++;
        });
      }
    });

    if (receiptCount > 0 || paymentCount > 0) {
      return receiptCount >= paymentCount ? 'debtor' : 'creditor';
    }
    // Fallback: negative total = Dr outstanding = debtor
    return totalClosing <= 0 ? 'debtor' : 'creditor';
  };

  // ─── Per-Ledger Monthly Processing ─────────────────────────

  /**
   * For a single ledger, compute monthly totals for payment and goods.
   * Returns { monthKey: { payment: number, goods: number } }
   */
  const computeLedgerMonthly = (ledger, type) => {
    const monthlyData = {};
    months.value.forEach(m => {
      monthlyData[m] = { payment: 0, goods: 0 };
    });

    if (!ledger.entries) return monthlyData;

    ledger.entries.forEach(entry => {
      const date = parseDate(entry.date);
      if (!date) return;
      const mk = getMonthKey(date);
      if (!monthlyData[mk]) return; // outside our 6-month window

      if (type === 'debtor') {
        // Debtor: Receipts → payment received, Tax Invoices → goods sold
        if (entry.type === 'Receipt') {
          monthlyData[mk].payment += entry.amount || 0;
        } else if (entry.type === 'Tax Invoice') {
          monthlyData[mk].goods += entry.amount || 0;
        }
      } else {
        // Creditor: Payments → payment made, Tax Invoices → goods purchased
        if (entry.type === 'Payment') {
          monthlyData[mk].payment += entry.amount || 0;
        } else if (entry.type === 'Tax Invoice') {
          monthlyData[mk].goods += entry.amount || 0;
        }
      }
    });

    return monthlyData;
  };

  /**
   * Compute percentage change between two values.
   * Returns null if previous is 0 (no basis for comparison).
   */
  const pctChange = (current, previous) => {
    if (previous === 0) {
      if (current === 0) return null;
      return null; // Can't calculate % from zero base — show "New" instead
    }
    return ((current - previous) / previous) * 100;
  };

  /**
   * For monthly data, compute the % change for each month compared to the previous month.
   * Returns { monthKey: { payment, goods, paymentPct, goodsPct } }
   */
  const enrichWithPctChange = (monthlyData) => {
    const ms = months.value;
    const result = {};

    ms.forEach((mk, idx) => {
      const data = monthlyData[mk] || { payment: 0, goods: 0 };
      const prevMk = idx > 0 ? ms[idx - 1] : null;
      const prev = prevMk ? (monthlyData[prevMk] || { payment: 0, goods: 0 }) : null;

      result[mk] = {
        payment: data.payment,
        goods: data.goods,
        paymentPct: prev ? pctChange(data.payment, prev.payment) : null,
        goodsPct: prev ? pctChange(data.goods, prev.goods) : null,
      };
    });

    return result;
  };

  // ─── Main Computed Data ────────────────────────────────────

  /**
   * Process all groups and return classified, enriched data.
   */
  const processedData = computed(() => {
    if (!ledgerData.value || !Array.isArray(ledgerData.value)) {
      return { debtors: [], creditors: [] };
    }

    const debtorGroups = [];
    const creditorGroups = [];

    ledgerData.value
      .filter(g => g.groupName !== '_META_DATA_' && g.groupName && !g.groupName.startsWith('&#4;'))
      .forEach(group => {
        const type = classifyGroup(group);
        const parties = [];

        // Aggregate group-level monthly data
        const groupMonthly = {};
        months.value.forEach(m => { groupMonthly[m] = { payment: 0, goods: 0 }; });

        (group.ledgers || []).forEach(ledger => {
          const ledgerMonthly = computeLedgerMonthly(ledger, type);

          // Accumulate into group totals
          months.value.forEach(m => {
            groupMonthly[m].payment += ledgerMonthly[m].payment;
            groupMonthly[m].goods += ledgerMonthly[m].goods;
          });

          const enriched = enrichWithPctChange(ledgerMonthly);
          const cm = currentMonth.value;

          parties.push({
            name: ledger.ledgerName,
            groupName: group.groupName,
            openingBalance: ledger.openingBalance || 0,
            closingBalance: ledger.closingBalance || 0,
            currentPayment: enriched[cm]?.payment || 0,
            currentGoods: enriched[cm]?.goods || 0,
            currentPaymentPct: enriched[cm]?.paymentPct,
            currentGoodsPct: enriched[cm]?.goodsPct,
            monthlyData: enriched,
          });
        });

        // Sort parties alphabetically
        parties.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        const enrichedGroup = enrichWithPctChange(groupMonthly);
        const cm = currentMonth.value;

        const groupObj = {
          groupName: group.groupName,
          partyCount: parties.length,
          currentPayment: enrichedGroup[cm]?.payment || 0,
          currentGoods: enrichedGroup[cm]?.goods || 0,
          currentPaymentPct: enrichedGroup[cm]?.paymentPct,
          currentGoodsPct: enrichedGroup[cm]?.goodsPct,
          monthlyData: enrichedGroup,
          parties,
        };

        if (type === 'debtor') {
          debtorGroups.push(groupObj);
        } else {
          creditorGroups.push(groupObj);
        }
      });

    // Sort groups alphabetically
    debtorGroups.sort((a, b) => a.groupName.localeCompare(b.groupName));
    creditorGroups.sort((a, b) => a.groupName.localeCompare(b.groupName));

    return { debtors: debtorGroups, creditors: creditorGroups };
  });

  const debtorGroups = computed(() => processedData.value.debtors);
  const creditorGroups = computed(() => processedData.value.creditors);

  // Flat list of all debtor parties (with group info)
  const debtorParties = computed(() => {
    return debtorGroups.value.flatMap(g => g.parties);
  });

  // Flat list of all creditor parties
  const creditorParties = computed(() => {
    return creditorGroups.value.flatMap(g => g.parties);
  });

  return {
    // Data
    debtorGroups,
    creditorGroups,
    debtorParties,
    creditorParties,
    months,
    currentMonth,
    previousMonths,
    // State
    loading,
    error,
    // Actions
    loadLedgerData,
    // Helpers
    getMonthLabel,
    pctChange,
  };
}

import { ref, computed } from "vue";
import { useLedgerData } from "@/composables/useLedgerData";

/**
 * Composable for Creditor Analytics & Supplier Payables Aging.
 * Analyzes Sundry Creditors & Manufacturer accounts (e.g. Paragon, Footwear Vendors).
 * Computes 0-30, 31-60, 61-90, 90-180, and 180+ days mutually exclusive aging buckets.
 */
export function useCreditorData() {
  const { ledgerData, loading, error, loadLedgerData } = useLedgerData();

  const viewMode = ref("Party View"); // "Party View" | "Group View"
  const searchQuery = ref("");
  const selectedGroups = ref([]);
  const activeAgingFilter = ref("all"); // "all" | "180plus" | "90_180" | "61_90" | "31_60" | "0_30"
  const sortBy = ref("payable_desc"); // "payable_desc" | "overdue_desc" | "name_asc" | "name_desc"

  const formatINR = (val) => {
    if (val === undefined || val === null || isNaN(val)) return "₹0";
    return "₹" + Math.round(val).toLocaleString("en-IN");
  };

  // ─── Date Parsing Helpers ──────────────────────────────────────────────
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const dateCache = new Map();
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateCache.has(dateStr)) return dateCache.get(dateStr);
    const parts = dateStr.split("-");
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

  // Reference date: latest transaction date across all ledgers or today
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

  const isCreditorGroup = (gName) => {
    const name = (gName || "").toLowerCase().trim();
    return name.includes("creditor") || name === "paragon";
  };

  const isExcludedLedger = (lName) => {
    const name = (lName || "").trim();
    if (!name) return true;
    return /^(profit|loss|cash|tcs|tds|gst|sale@|purchase@|round off|staff|bank|capital|drawings|freight|discount|expenses|insurance)/i.test(name) || /^\d{2,4}$/.test(name);
  };

  // ─── Classification & 5-Bucket Aging Computation ───────────────────────
  const processedData = computed(() => {
    if (!ledgerData.value || !Array.isArray(ledgerData.value)) {
      return { creditors: [] };
    }

    const refDate = referenceDate.value;
    const creditors = [];
    const paragonBranches = [];

    for (const group of ledgerData.value) {
      if (!isCreditorGroup(group.groupName) || !group.ledgers) continue;

      for (const ledger of group.ledgers) {
        if (isExcludedLedger(ledger.ledgerName)) continue;

        // Collect Paragon Polymer branch ledgers for unified consolidation
        if (ledger.ledgerName.toUpperCase().includes("PARAGON POLYMER")) {
          paragonBranches.push({ ledger, groupName: group.groupName });
          continue;
        }

        const closing = ledger.closingBalance || 0;
        
        // Non-zero payable balance
        if (Math.abs(closing) < 0.01) continue;

        const isCreditBalance = closing > 0 || ledger.closingDrCr === "Cr";
        const totalPayable = isCreditBalance ? Math.abs(closing) : 0;
        const isAdvancePaid = !isCreditBalance; // Debit balance means advance paid to supplier

        // Collect purchase entries (Cr entries or Purchase type)
        const entries = (ledger.entries || []).map(e => ({
          ...e,
          parsedDate: parseDate(e.date)
        })).filter(e => e.parsedDate !== null);

        // Sort entries newest first
        entries.sort((a, b) => b.parsedDate - a.parsedDate);

        let unallocatedBalance = totalPayable;
        let b0_30 = 0;
        let b31_60 = 0;
        let b61_90 = 0;
        let b90_180 = 0;
        let b180_plus = 0;
        const pendingBills = [];

        // For creditors, invoices are Cr entries (Purchases / Inward bills)
        const invoiceEntries = entries.filter(e => e.drCr === "Cr" || e.type === "Purchase" || e.type === "Tax Invoice");

        for (const inv of invoiceEntries) {
          if (unallocatedBalance <= 0) break;

          const daysOld = Math.max(0, Math.floor((refDate - inv.parsedDate) / (1000 * 60 * 60 * 24)));
          const amountToAllocate = Math.min(unallocatedBalance, inv.amount || 0);

          let bucket = "0–30 days";
          if (daysOld <= 30) {
            b0_30 += amountToAllocate;
            bucket = "0–30 days";
          } else if (daysOld <= 60) {
            b31_60 += amountToAllocate;
            bucket = "31–60 days";
          } else if (daysOld <= 90) {
            b61_90 += amountToAllocate;
            bucket = "61–90 days";
          } else if (daysOld <= 180) {
            b90_180 += amountToAllocate;
            bucket = "90–180 days";
          } else {
            b180_plus += amountToAllocate;
            bucket = "180+ days";
          }

          pendingBills.push({
            date: inv.date,
            voucherNo: inv.voucherNo || "N/A",
            type: inv.type || "Purchase",
            amount: amountToAllocate,
            totalBillAmount: inv.amount || 0,
            daysOld,
            bucket
          });

          unallocatedBalance -= amountToAllocate;
        }

        // If residual balance remains unallocated to specific purchase bills (Opening balance)
        if (unallocatedBalance > 0) {
          b180_plus += unallocatedBalance;
          pendingBills.push({
            date: "Opening Balance",
            voucherNo: "OB",
            type: "Opening",
            amount: unallocatedBalance,
            totalBillAmount: unallocatedBalance,
            daysOld: 181,
            bucket: "180+ days"
          });
        }

        // Primary aging category (largest bucket)
        const buckets = [
          { key: "180plus", name: "180+ days", amount: b180_plus, priority: 5 },
          { key: "90_180", name: "90–180 days", amount: b90_180, priority: 4 },
          { key: "61_90", name: "61–90 days", amount: b61_90, priority: 3 },
          { key: "31_60", name: "31–60 days", amount: b31_60, priority: 2 },
          { key: "0_30", name: "0–30 days", amount: b0_30, priority: 1 }
        ];

        buckets.sort((a, b) => b.amount - a.amount || b.priority - a.priority);
        const dominantCategory = buckets[0].amount > 0 ? buckets[0].key : "0_30";

        // Extract city from ledger name if present in parentheses e.g. "Vendor Name (Delhi)"
        const cityMatch = ledger.ledgerName.match(/\(([^)]+)\)/);
        const city = cityMatch ? cityMatch[1] : "";

        // Raw entries metrics
        let totalPurchases = 0;
        let totalPayments = 0;
        entries.forEach(e => {
          if (e.drCr === "Cr") totalPurchases += (e.amount || 0);
          else if (e.drCr === "Dr") totalPayments += (e.amount || 0);
        });

        const partyRecord = {
          ledgerName: ledger.ledgerName,
          groupName: group.groupName,
          city,
          closingBalance: closing,
          totalPayable,
          isAdvancePaid,
          openingBalance: ledger.openingBalance || 0,
          totalPurchases,
          totalPayments,
          b0_30,
          b31_60,
          b61_90,
          b90_180,
          b180_plus,
          dominantCategory,
          pendingBills,
          entriesCount: entries.length,
          lastTransactionDate: entries.length > 0 ? entries[0].date : "N/A",
          rawLedger: ledger,
          entries: ledger.entries || []
        };

        creditors.push(partyRecord);
      }
    }

    // ─── CONSOLIDATE MULTI-BRANCH PARAGON LEDGERS INTO 1 MASTER RECORD ───
    if (paragonBranches.length > 0) {
      let combinedClosing = 0;
      let combinedOpening = 0;
      let combinedPurchases = 0;
      let combinedPayments = 0;
      let combinedEntries = [];
      const branchList = [];

      for (const item of paragonBranches) {
        const ledger = item.ledger;
        combinedClosing += (ledger.closingBalance || 0);
        combinedOpening += (ledger.openingBalance || 0);

        // Extract branch name (e.g., Bangalore, Kerala, Haryana, Medak, Tamil Nadu, Central)
        let branchTag = "Central";
        const m = ledger.ledgerName.match(/\(([^)]+)\)/);
        if (m) {
          branchTag = m[1];
        } else if (/medak/i.test(ledger.ledgerName)) {
          branchTag = "Medak (Telangana)";
        } else if (/tamil/i.test(ledger.ledgerName)) {
          branchTag = "Tamil Nadu";
        }

        let bDr = 0;
        let bCr = 0;

        for (const e of (ledger.entries || [])) {
          if (e.drCr === "Cr") bCr += (e.amount || 0);
          if (e.drCr === "Dr") bDr += (e.amount || 0);
          const pd = parseDate(e.date);
          if (pd) {
            combinedEntries.push({
              ...e,
              branch: branchTag,
              parsedDate: pd
            });
          }
        }

        combinedPurchases += bCr;
        combinedPayments += bDr;

        branchList.push({
          name: ledger.ledgerName,
          branch: branchTag,
          closingBalance: ledger.closingBalance || 0,
          purchases: bCr,
          payments: bDr,
          entriesCount: (ledger.entries || []).length
        });
      }

      // Sort branch list by highest purchases/balance
      branchList.sort((a, b) => b.purchases - a.purchases);

      // Sort pooled entries newest first
      combinedEntries.sort((a, b) => b.parsedDate - a.parsedDate);

      const totalPayable = combinedClosing > 0 ? combinedClosing : 0;
      let unallocatedBalance = totalPayable;
      let b0_30 = 0;
      let b31_60 = 0;
      let b61_90 = 0;
      let b90_180 = 0;
      let b180_plus = 0;
      const pendingBills = [];

      const invoiceEntries = combinedEntries.filter(e => e.drCr === "Cr" || e.type === "Purchase" || e.type === "Tax Invoice");

      for (const inv of invoiceEntries) {
        if (unallocatedBalance <= 0) break;
        const daysOld = Math.max(0, Math.floor((refDate - inv.parsedDate) / (1000 * 60 * 60 * 24)));
        const amountToAllocate = Math.min(unallocatedBalance, inv.amount || 0);

        let bucket = "0–30 days";
        if (daysOld <= 30) {
          b0_30 += amountToAllocate;
          bucket = "0–30 days";
        } else if (daysOld <= 60) {
          b31_60 += amountToAllocate;
          bucket = "31–60 days";
        } else if (daysOld <= 90) {
          b61_90 += amountToAllocate;
          bucket = "61–90 days";
        } else if (daysOld <= 180) {
          b90_180 += amountToAllocate;
          bucket = "90–180 days";
        } else {
          b180_plus += amountToAllocate;
          bucket = "180+ days";
        }

        pendingBills.push({
          date: inv.date,
          voucherNo: inv.voucherNo || "N/A",
          type: inv.type || "Purchase",
          branch: inv.branch || "Central",
          amount: amountToAllocate,
          totalBillAmount: inv.amount || 0,
          daysOld,
          bucket
        });

        unallocatedBalance -= amountToAllocate;
      }

      if (unallocatedBalance > 0) {
        b180_plus += unallocatedBalance;
        pendingBills.push({
          date: "Opening Balance",
          voucherNo: "OB",
          type: "Opening",
          branch: "Consolidated",
          amount: unallocatedBalance,
          totalBillAmount: unallocatedBalance,
          daysOld: 181,
          bucket: "180+ days"
        });
      }

      const buckets = [
        { key: "180plus", name: "180+ days", amount: b180_plus, priority: 5 },
        { key: "90_180", name: "90–180 days", amount: b90_180, priority: 4 },
        { key: "61_90", name: "61–90 days", amount: b61_90, priority: 3 },
        { key: "31_60", name: "31–60 days", amount: b31_60, priority: 2 },
        { key: "0_30", name: "0–30 days", amount: b0_30, priority: 1 }
      ];
      buckets.sort((a, b) => b.amount - a.amount || b.priority - a.priority);
      const dominantCategory = buckets[0].amount > 0 ? buckets[0].key : "0_30";

      const masterRecord = {
        ledgerName: "PARAGON POLYMER PRODUCTS PVT LTD (All Branches Consolidated)",
        groupName: "PARAGON",
        city: "All State Branches",
        isConsolidated: true,
        branchCount: branchList.length,
        branches: branchList,
        closingBalance: combinedClosing,
        totalPayable,
        isAdvancePaid: combinedClosing < 0,
        openingBalance: combinedOpening,
        totalPurchases: combinedPurchases,
        totalPayments: combinedPayments,
        b0_30,
        b31_60,
        b61_90,
        b90_180,
        b180_plus,
        dominantCategory,
        pendingBills,
        entriesCount: combinedEntries.length,
        lastTransactionDate: combinedEntries.length > 0 ? combinedEntries[0].date : "N/A",
        rawLedger: {
          ledgerName: "PARAGON POLYMER PRODUCTS PVT LTD (All Branches Consolidated)",
          groupName: "PARAGON",
          openingBalance: combinedOpening,
          closingBalance: combinedClosing,
          entries: combinedEntries
        },
        entries: combinedEntries
      };

      creditors.push(masterRecord);
    }

    return { creditors };
  });

  const allCreditors = computed(() => processedData.value.creditors);

  // Available groups for filtering
  const groupList = computed(() => {
    const set = new Set();
    allCreditors.value.forEach(p => {
      if (p.groupName) set.add(p.groupName);
    });
    return Array.from(set).sort();
  });

  // ─── Filtered & Sorted Creditors ─────────────────────────────────────────
  const filteredCreditors = computed(() => {
    let list = allCreditors.value;

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      list = list.filter(p => 
        p.ledgerName.toLowerCase().includes(q) ||
        p.groupName.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q))
      );
    }

    // Selected groups
    if (selectedGroups.value.length > 0) {
      const lower = selectedGroups.value.map(g => g.toLowerCase());
      list = list.filter(p => lower.includes(p.groupName.toLowerCase()));
    }

    // Active aging filter
    if (activeAgingFilter.value !== "all") {
      list = list.filter(p => {
        if (activeAgingFilter.value === "overdue_90plus") return (p.b90_180 + p.b180_plus) > 0;
        if (activeAgingFilter.value === "due_31_90") return (p.b31_60 + p.b61_90) > 0;
        if (activeAgingFilter.value === "0_30") return p.b0_30 > 0;
        if (activeAgingFilter.value === "31_60") return p.b31_60 > 0;
        if (activeAgingFilter.value === "61_90") return p.b61_90 > 0;
        if (activeAgingFilter.value === "90_180") return p.b90_180 > 0;
        if (activeAgingFilter.value === "180plus") return p.b180_plus > 0;
        return true;
      });
    }

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy.value === "payable_desc") return b.totalPayable - a.totalPayable;
      if (sortBy.value === "overdue_desc") {
        const overdueA = a.b90_180 + a.b180_plus;
        const overdueB = b.b90_180 + b.b180_plus;
        return overdueB - overdueA || b.totalPayable - a.totalPayable;
      }
      if (sortBy.value === "name_asc") return a.ledgerName.localeCompare(b.ledgerName);
      if (sortBy.value === "name_desc") return b.ledgerName.localeCompare(a.ledgerName);
      return b.totalPayable - a.totalPayable;
    });

    return list;
  });

  // ─── Group-Level Aggregation (For Group View) ──────────────────────────
  const groupSummaries = computed(() => {
    const map = new Map();

    filteredCreditors.value.forEach(p => {
      const gName = p.groupName || "Other";
      if (!map.has(gName)) {
        map.set(gName, {
          groupName: gName,
          partyCount: 0,
          totalPayable: 0,
          b0_30: 0,
          b31_60: 0,
          b61_90: 0,
          b90_180: 0,
          b180_plus: 0,
          parties: []
        });
      }

      const g = map.get(gName);
      g.partyCount++;
      g.totalPayable += p.totalPayable;
      g.b0_30 += p.b0_30;
      g.b31_60 += p.b31_60;
      g.b61_90 += p.b61_90;
      g.b90_180 += p.b90_180;
      g.b180_plus += p.b180_plus;
      g.parties.push(p);
    });

    const groups = Array.from(map.values());
    groups.sort((a, b) => b.totalPayable - a.totalPayable);
    return groups;
  });

  // ─── KPI Summary Statistics ─────────────────────────────────────────────
  const summaryStats = computed(() => {
    let totalPayable = 0;
    let b0_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90_180 = 0;
    let b180_plus = 0;

    let count0_30 = 0;
    let count31_60 = 0;
    let count61_90 = 0;
    let count90_180 = 0;
    let count180_plus = 0;

    let countOverdue90Plus = 0;
    let countDue31_90 = 0;

    allCreditors.value.forEach(p => {
      totalPayable += p.totalPayable;
      b0_30 += p.b0_30;
      b31_60 += p.b31_60;
      b61_90 += p.b61_90;
      b90_180 += p.b90_180;
      b180_plus += p.b180_plus;

      if (p.b0_30 > 0) count0_30++;
      if (p.b31_60 > 0) count31_60++;
      if (p.b61_90 > 0) count61_90++;
      if (p.b90_180 > 0) count90_180++;
      if (p.b180_plus > 0) count180_plus++;

      if (p.b90_180 + p.b180_plus > 0) countOverdue90Plus++;
      if (p.b31_60 + p.b61_90 > 0) countDue31_90++;
    });

    const safeTotal = totalPayable > 0 ? totalPayable : 1;
    const overdue90PlusAmount = b90_180 + b180_plus;
    const due31_90Amount = b31_60 + b61_90;

    return {
      totalPayable,
      vendorCount: allCreditors.value.length,
      b0_30,
      b31_60,
      b61_90,
      b90_180,
      b180_plus,
      overdue90PlusAmount,
      due31_90Amount,
      pct0_30: (b0_30 / safeTotal) * 100,
      pct31_60: (b31_60 / safeTotal) * 100,
      pct61_90: (b61_90 / safeTotal) * 100,
      pct90_180: (b90_180 / safeTotal) * 100,
      pct180_plus: (b180_plus / safeTotal) * 100,
      pctOverdue90Plus: (overdue90PlusAmount / safeTotal) * 100,
      pctDue31_90: (due31_90Amount / safeTotal) * 100,
      count0_30,
      count31_60,
      count61_90,
      count90_180,
      count180_plus,
      countOverdue90Plus,
      countDue31_90
    };
  });

  const getWhatsAppFollowupText = (party) => {
    if (!party) return "";

    let text = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n`;
    text += `  🏢 *SRI BRUNDABANA ENTERPRISES*\n`;
    text += `  📍 Rayagada, Odisha | SBE Hub\n`;
    text += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

    if (party.isConsolidated) {
      text += `📑 *CONSOLIDATED SUPPLIER STATEMENT*\n`;
      text += `👤 *Supplier:* ${party.ledgerName}\n`;
      text += `🏷️ *Branches Clubbed:* ${party.branchCount || party.branches?.length || '9'} State Branches\n`;
      text += `💰 *Net Combined Balance Payable:* *${formatINR(party.totalPayable)}*\n\n`;
    } else {
      text += `📑 *SUPPLIER ACCOUNT STATEMENT*\n`;
      text += `👤 *Supplier:* ${party.ledgerName}\n`;
      text += `🏷️ *Group:* ${party.groupName}\n`;
      text += `💰 *Net Balance Payable:* *${formatINR(party.totalPayable)}*\n\n`;
    }

    // Overdue / Aging Summary (Only non-zero buckets)
    const agingLines = [];
    if (party.b0_30 > 0) agingLines.push(`• 0–30 Days (Current): *${formatINR(party.b0_30)}*`);
    if (party.b31_60 > 0) agingLines.push(`• 31–60 Days (Due): *${formatINR(party.b31_60)}*`);
    if (party.b61_90 > 0) agingLines.push(`• 61–90 Days (Due): *${formatINR(party.b61_90)}*`);
    if (party.b90_180 > 0) agingLines.push(`• 90–180 Days (Overdue): *${formatINR(party.b90_180)}*`);
    if (party.b180_plus > 0) agingLines.push(`• 180+ Days (Critical): *${formatINR(party.b180_plus)}*`);

    if (agingLines.length > 0) {
      text += `📊 *Payables Tenure Summary:*\n`;
      text += agingLines.join("\n") + `\n\n`;
    }

    if (party.pendingBills && party.pendingBills.length > 0) {
      text += `🧾 *Recent Unsettled Bills:*\n`;
      party.pendingBills.slice(0, 4).forEach((b) => {
        const branchTag = b.branch ? ` [${b.branch}]` : "";
        text += `▫️ Bill #${b.voucherNo} (${b.date})${branchTag} ➔ *${formatINR(b.amount)}* [${b.daysOld}d]\n`;
      });
      text += `\n`;
    }

    text += `📄 *Detailed 6-Month Ledger Statement & Pending Invoices are attached in the PDF for verification.*\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_With Warm Regards,_\n`;
    text += `*Sri Brundabana Enterprises, Rayagada*`;

    return text;
  };

  const getWhatsAppFollowupLink = (party) => {
    const text = getWhatsAppFollowupText(party);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return {
    loading,
    error,
    loadLedgerData,
    viewMode,
    searchQuery,
    selectedGroups,
    activeAgingFilter,
    sortBy,
    groupList,
    filteredCreditors,
    groupSummaries,
    summaryStats,
    referenceDate,
    formatINR,
    getWhatsAppFollowupText,
    getWhatsAppFollowupLink
  };
}


import { computed } from 'vue';

/**
 * Stock Analytics Composable
 * Analyzes productHistory data to classify products by movement speed.
 *
 * @param {import('vue').Ref<Array>} stockData - Reactive stock data from appStore
 * @param {import('vue').Ref<number>} lookbackDays - Number of days to analyze (7, 30, 90)
 */
export function useStockAnalytics(stockData, lookbackDays) {

  /**
   * Flatten all products from all groups into a single array,
   * each enriched with analytics metrics.
   */
  const analyzedProducts = computed(() => {
    if (!stockData.value || !Array.isArray(stockData.value)) return [];

    const now = new Date();
    const windowMs = (lookbackDays.value || 30) * 24 * 60 * 60 * 1000;
    const cutoff = new Date(now.getTime() - windowMs);

    const results = [];

    stockData.value.forEach(group => {
      if (!group.products || group.groupName === '_META_DATA_') return;

      group.products.forEach(product => {
        const history = product.productHistory || [];
        const hasHistory = history.length > 0;

        // Filter entries within lookback window
        const windowEntries = history.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= cutoff;
        });

        // Compute metrics from window
        let totalSold = 0;
        let totalPurchased = 0;
        let soldEvents = 0;
        let purchasedEvents = 0;

        windowEntries.forEach(entry => {
          if (entry.type === 'sold') {
            totalSold += entry.qty;
            soldEvents++;
          } else if (entry.type === 'purchased') {
            totalPurchased += entry.qty;
            purchasedEvents++;
          }
        });

        const currentQty = product.quantity || 0;
        const daysInWindow = lookbackDays.value || 30;

        // Sell velocity: units sold per day
        const sellVelocity = daysInWindow > 0 ? totalSold / daysInWindow : 0;

        // Turnover: what % of (current + sold) was sold
        const totalHandled = currentQty + totalSold;
        const turnoverRate = totalHandled > 0 ? (totalSold / totalHandled) * 100 : 0;

        // Days of stock remaining at current sell rate
        const daysOfStock = sellVelocity > 0 ? currentQty / sellVelocity : Infinity;

        // Classification
        let category = 'healthy';
        let categoryLabel = 'Healthy';
        let categoryIcon = 'fa-check';
        let categoryColor = 'mint';
        let urgency = 3; // For sorting (lower = more urgent)

        // Minimum data points needed for reliable classification
        // Industry standard: at least 2 weeks of tracked data points
        const minEntries = lookbackDays.value <= 7 ? 2 : (lookbackDays.value <= 30 ? 3 : 5);
        const hasEnoughData = windowEntries.length >= minEntries;

        if (!hasHistory) {
          category = 'no-data';
          categoryLabel = 'No Data';
          categoryIcon = 'fa-clock';
          categoryColor = 'slate';
          urgency = 6;
        } else if (!hasEnoughData) {
          // Has some history but not enough data points for reliable analysis
          category = 'insufficient';
          categoryLabel = 'Insufficient Data';
          categoryIcon = 'fa-hourglass-start';
          categoryColor = 'slate';
          urgency = 5;
        } else if (currentQty === 0 && totalSold === 0 && totalPurchased === 0) {
          // Zero stock, zero movement — out of stock
          category = 'dead';
          categoryLabel = 'Dead Stock';
          categoryIcon = 'fa-box-archive';
          categoryColor = 'slate';
          urgency = 4;
        } else if (totalSold === 0 && totalPurchased === 0 && currentQty > 0) {
          // No movement at all in window, but has stock
          category = 'dead';
          categoryLabel = 'Dead Stock';
          categoryIcon = 'fa-box-archive';
          categoryColor = 'slate';
          urgency = 4;
        } else if (sellVelocity > 0 && daysOfStock < 7) {
          // Selling well but running low — MOST URGENT
          category = 'reorder';
          categoryLabel = 'Reorder';
          categoryIcon = 'fa-cart-shopping';
          categoryColor = 'amber';
          urgency = 0;
        } else if (turnoverRate >= 60 || soldEvents >= 3) {
          // High turnover or frequent sales
          category = 'fast';
          categoryLabel = 'Fast Moving';
          categoryIcon = 'fa-bolt';
          categoryColor = 'coral';
          urgency = 1;
        } else if (turnoverRate < 20 && currentQty > 0 && (soldEvents > 0 || purchasedEvents > 0)) {
          // Low turnover but has some movement
          category = 'slow';
          categoryLabel = 'Slow Moving';
          categoryIcon = 'fa-turtle';
          categoryColor = 'lavender';
          urgency = 3;
        }

        results.push({
          productName: product.productName,
          groupName: group.groupName,
          currentQty,
          imageUrl: product.imageUrl,
          totalSold,
          totalPurchased,
          sellVelocity: Math.round(sellVelocity * 100) / 100,
          turnoverRate: Math.round(turnoverRate),
          daysOfStock: daysOfStock === Infinity ? null : Math.round(daysOfStock),
          category,
          categoryLabel,
          categoryIcon,
          categoryColor,
          urgency,
          historyCount: history.length,
          windowEntries: windowEntries.length,
          soldEvents,
          purchasedEvents,
        });
      });
    });

    // Sort by urgency (reorder first, then fast, then healthy, then slow, then dead, then no-data)
    results.sort((a, b) => {
      if (a.urgency !== b.urgency) return a.urgency - b.urgency;
      // Secondary sort: by total sold descending (most active first)
      return b.totalSold - a.totalSold;
    });

    return results;
  });

  /**
   * Summary counts by category
   */
  const summary = computed(() => {
    const products = analyzedProducts.value;
    return {
      total: products.length,
      fast: products.filter(p => p.category === 'fast').length,
      reorder: products.filter(p => p.category === 'reorder').length,
      slow: products.filter(p => p.category === 'slow').length,
      dead: products.filter(p => p.category === 'dead').length,
      healthy: products.filter(p => p.category === 'healthy').length,
      noData: products.filter(p => p.category === 'no-data').length,
      insufficient: products.filter(p => p.category === 'insufficient').length,
    };
  });

  /**
   * Top groups by total sold (which brands are moving fastest)
   */
  const groupInsights = computed(() => {
    const products = analyzedProducts.value;
    const groupMap = {};

    products.forEach(p => {
      if (!groupMap[p.groupName]) {
        groupMap[p.groupName] = { groupName: p.groupName, totalSold: 0, totalProducts: 0, reorderCount: 0 };
      }
      groupMap[p.groupName].totalSold += p.totalSold;
      groupMap[p.groupName].totalProducts++;
      if (p.category === 'reorder') groupMap[p.groupName].reorderCount++;
    });

    return Object.values(groupMap)
      .filter(g => g.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10); // Top 10 groups
  });

  return {
    analyzedProducts,
    summary,
    groupInsights,
  };
}

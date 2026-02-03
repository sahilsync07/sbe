
import { ref, computed } from 'vue';
import { BRAND_LISTS, DEFAULT_MIN_DATE, NEW_ARRIVAL_MONTHS } from '../utils/constants';

export function useProductFilter(stockData, config) {
    const searchQuery = ref("");
    const selectedGroup = ref("All");
    const showImagesOnly = ref(true);
    const showNoImagesOnly = ref(false);
    const hideNegativeStocks = ref(true); // Default ON
    const hideOldArticles = ref(true);

    // Helper: Normalize strings for comparison
    const normalize = (name) => name ? name.toLowerCase().trim() : '';

    // Helper: Sort logic
    const compareGroups = (a, b) => {
        const nameA = normalize(a.groupName);
        const nameB = normalize(b.groupName);

        const sortList = config.value?.sortPriority || [];

        const indexA = sortList.findIndex((key) => nameA.includes(key));
        const indexB = sortList.findIndex((key) => nameB.includes(key));

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }

        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // "Old" Check - Force to bottom
        const isOldA = nameA.includes('old');
        const isOldB = nameB.includes('old');
        if (isOldA && !isOldB) return 1;
        if (!isOldA && isOldB) return -1;

        return nameA.localeCompare(nameB);
    };

    // Helper: Check for new arrival
    const isNewArrival = (product) => {
        if (!product) return false;
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - NEW_ARRIVAL_MONTHS);
        // Use default min date from constants or passed as string
        const minDate = DEFAULT_MIN_DATE;

        const imageDate = product.imageUploadedAt ? new Date(product.imageUploadedAt) : minDate;
        const itemDate = product.firstSeenAt ? new Date(product.firstSeenAt) : minDate;

        const latestDate = itemDate > imageDate ? itemDate : imageDate;
        return latestDate > cutoff;
    };

    const filteredStockData = computed(() => {
        let filtered = stockData.value || [];

        // Filter by Search Query
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            filtered = filtered
                .map((group) => ({
                    ...group,
                    products: group.products.filter((product) =>
                        product.productName.toLowerCase().includes(q)
                    ),
                }))
                .filter((group) => group.products.length > 0);
        }

        // Filter by Images Only
        if (showImagesOnly.value) {
            filtered = filtered.map(group => ({
                ...group,
                products: group.products.filter(p => !!p.imageUrl)
            })).filter(group => group.products.length > 0);
        }

        // Filter by No Images Only
        if (showNoImagesOnly.value) {
            filtered = filtered.map(group => ({
                ...group,
                products: group.products.filter(p => !p.imageUrl)
            })).filter(group => group.products.length > 0);
        }

        // Filter by Negative Stocks
        if (hideNegativeStocks.value) {
            filtered = filtered.map(group => ({
                ...group,
                products: group.products.filter(p => Number(p.quantity) >= 0)
            })).filter(group => group.products.length > 0);
        }

        // Filter by Hide Old Articles
        if (hideOldArticles.value) {
            filtered = filtered.filter(group => !group.groupName.toLowerCase().includes('old'));
        }

        // Selected Group Logic
        if (selectedGroup.value !== "All") {
            const groupKey = selectedGroup.value;

            // New Arrivals Logic - Flatten all into one group sorted by date
            if (groupKey === "NewArrivals") {
                const minDate = DEFAULT_MIN_DATE;
                const allNewProducts = [];

                // Collect all new arrival products from all groups
                filtered.forEach(group => {
                    group.products.forEach(p => {
                        if (isNewArrival(p)) {
                            allNewProducts.push(p);
                        }
                    });
                });

                // Sort by most recent first (imageUploadedAt = when made visible to customers)
                allNewProducts.sort((a, b) => {
                    const dateA = new Date(a.imageUploadedAt || a.firstSeenAt || minDate);
                    const dateB = new Date(b.imageUploadedAt || b.firstSeenAt || minDate);
                    return dateB - dateA;
                });

                // Return as single "New Arrivals" group  
                filtered = allNewProducts.length > 0 ? [{
                    groupName: "New Arrivals",
                    products: allNewProducts,
                    isSpecial: true
                }] : [];
            }
            // Check if it's a Brand Group (e.g. Paragon, Florex)
            else if (config.value?.brandGroups && config.value.brandGroups[groupKey]) {
                const allowedSubgroups = config.value.brandGroups[groupKey].map(g => normalize(g));
                filtered = filtered.filter(g => allowedSubgroups.includes(normalize(g.groupName)));
            }
            // Check if it's a Custom Filter
            else if (config.value?.customFilters && config.value.customFilters[groupKey]) {
                const keywords = config.value.customFilters[groupKey];
                filtered = filtered.map(group => ({
                    ...group,
                    products: group.products.filter(p =>
                        keywords.some(k => p.productName.toLowerCase().includes(k.toLowerCase()))
                    )
                })).filter(g => g.products.length > 0);
            }
            // Generic Club Logic
            else if (['Bansal', 'Airson', 'Kohinoor', 'Naresh'].includes(groupKey)) {
                let list = [];
                if (groupKey === 'Bansal') list = BRAND_LISTS.bansal;
                if (groupKey === 'Airson') list = BRAND_LISTS.airson;
                if (groupKey === 'Kohinoor') list = BRAND_LISTS.kohinoor;
                if (groupKey === 'Naresh') list = BRAND_LISTS.naresh;

                const clubbed = list.map(n => normalize(n));
                filtered = filtered.filter(g => clubbed.includes(normalize(g.groupName)));
            }
            // Specific Group Name match
            else {
                filtered = filtered.filter(g => g.groupName === groupKey);
            }
        }

        // Sort
        filtered = [...filtered].sort(compareGroups);

        // Inject "New Arrivals" at the top if viewing "All"
        if (selectedGroup.value === 'All' && stockData.value) {
            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - NEW_ARRIVAL_MONTHS);
            const minDate = DEFAULT_MIN_DATE;

            const newProducts = [];

            stockData.value.forEach(g => {
                g.products.forEach(p => {
                    if (searchQuery.value && !p.productName.toLowerCase().includes(searchQuery.value.toLowerCase())) return;
                    if (showImagesOnly.value && !p.imageUrl) return;
                    if (showNoImagesOnly.value && p.imageUrl) return;
                    if (hideNegativeStocks.value && Number(p.quantity) < 0) return;

                    if (isNewArrival(p)) {
                        newProducts.push(p);
                    }
                });
            });

            if (newProducts.length > 0) {
                newProducts.sort((a, b) => {
                    const dateA = new Date(a.imageUploadedAt || a.firstSeenAt || minDate);
                    const dateB = new Date(b.imageUploadedAt || b.firstSeenAt || minDate);
                    return dateB - dateA;
                });

                filtered.unshift({
                    groupName: "New Arrivals",
                    products: newProducts,
                    isSpecial: true
                });
            }
        }

        return filtered;
    });

    const sortedStockDataForDropdown = computed(() => {
        return [...(stockData.value || [])].sort(compareGroups);
    });

    return {
        searchQuery,
        selectedGroup,
        showImagesOnly,
        showNoImagesOnly,
        hideNegativeStocks,
        hideOldArticles,
        filteredStockData,
        sortedStockDataForDropdown,
        isNewArrival,
        compareGroups
    };
}

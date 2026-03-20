
import { ref, computed } from 'vue';
import { BRAND_LISTS, DEFAULT_MIN_DATE, NEW_ARRIVAL_MONTHS } from '../utils/constants';
import { useAppStore } from '../stores/appStore';
import { storeToRefs } from 'pinia';

export function useProductFilter(stockData, config) {
    const appStore = useAppStore();
    const { searchQuery, cleanView } = storeToRefs(appStore);
    
    const selectedGroup = ref("All");
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
            const queryParts = searchQuery.value.toLowerCase().split(/\s+/).filter(Boolean);
            filtered = filtered
                .map((group) => ({
                    ...group,
                    products: group.products.filter((product) => {
                        const productName = product.productName.toLowerCase();
                        return queryParts.every(part => productName.includes(part));
                    }),
                }))
                .filter((group) => group.products.length > 0);
        }

        // Clean View Logic (Replaces Images Only & Hide Negative)
        if (cleanView.value) {
            filtered = filtered.map(group => ({
                ...group,
                products: group.products.filter(p => !!p.imageUrl && Number(p.quantity) >= 4)
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
            // Paragon 40% Discount Logic
            else if (groupKey === "ParagonDiscount") {
                const targetGroups = ['PARAGON GENTS 40%', 'SOLEA DISC 40% OFFER'].map(n => normalize(n));
                filtered = filtered.filter(g => targetGroups.includes(normalize(g.groupName)));
            }
            // Check if it's a Brand Group (e.g. Paragon, Florex)
            else if (config.value?.brandGroups && config.value.brandGroups[groupKey]) {
                const allowedSubgroups = config.value.brandGroups[groupKey].map(g => normalize(g));
                filtered = filtered.filter(g => allowedSubgroups.includes(normalize(g.groupName)));
            }
            // Special Logic for Max Card
            else if (groupKey === "Max") {
                const maxProducts = [];
                const maxRegex = /\bmax\b/i;
                filtered.forEach(group => {
                    group.products.forEach(p => {
                        const name = p.productName || '';
                        const desc = p.description || '';

                        // Check if name or description contains the exact word "max" validation
                        if (maxRegex.test(name) || maxRegex.test(desc)) {
                            maxProducts.push(p);
                        }
                    });
                });
                filtered = maxProducts.length > 0 ? [{
                    groupName: "Max",
                    products: maxProducts
                }] : [];
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
                    if (searchQuery.value) {
                        const queryParts = searchQuery.value.toLowerCase().split(/\s+/).filter(Boolean);
                        const productName = p.productName.toLowerCase();
                        if (!queryParts.every(part => productName.includes(part))) return;
                    }

                    // Clean View Logic for New Arrivals
                    if (cleanView.value) {
                        if (!p.imageUrl || Number(p.quantity) < 4) return;
                    }

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
        cleanView,
        hideOldArticles,
        filteredStockData,
        sortedStockDataForDropdown,
        isNewArrival,
        compareGroups
    };
}

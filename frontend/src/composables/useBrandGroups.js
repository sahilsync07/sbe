
import { computed } from 'vue';
import { BRAND_LISTS, TOP_BRANDS_CONFIG, MID_BRANDS_CONFIG } from '../utils/constants';

export function useBrandGroups(stockData, config, searchQuery) {
    const lists = {
        paragon: BRAND_LISTS.paragon,
        bansal: BRAND_LISTS.bansal,
        airson: BRAND_LISTS.airson,
        kohinoor: BRAND_LISTS.kohinoor,
        naresh: BRAND_LISTS.naresh,
        socks: BRAND_LISTS.socks,
        general: BRAND_LISTS.general,
        generalLoosePacking: BRAND_LISTS.generalLoosePacking,
        generalBoxPacking: BRAND_LISTS.generalBoxPacking,
        midBrands: MID_BRANDS_CONFIG,
        topBrands: TOP_BRANDS_CONFIG
    };

    const groupedSidebar = computed(() => {
        let source = stockData.value || [];

        if (searchQuery && searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            source = source.filter(g => g.groupName.toLowerCase().includes(q));
        }

        const normalize = (name) => name ? name.toLowerCase().trim() : '';

        const groups = {
            paragon: [],
            topBrands: [],
            midBrands: [],
            generalLoosePackingGroups: [],
            generalBoxPackingGroups: [],
            socksGroups: [],
            general: [],
            bansalGroups: [],
            airsonGroups: [],
            kohinoorGroups: [],
            nareshGroups: [],
            others: []
        };

        const sets = {
            paragon: new Set(lists.paragon.map(n => normalize(n))),
            topBrands: new Set(lists.topBrands.map(n => normalize(n.name))),
            midBrands: new Set(lists.midBrands.map(n => normalize(n))),
            generalLoosePacking: new Set(lists.generalLoosePacking.map(n => normalize(n))),
            generalBoxPacking: new Set(lists.generalBoxPacking.map(n => normalize(n))),
            socks: new Set(lists.socks.map(n => normalize(n))),
            general: new Set(lists.general.map(n => normalize(n))),
            bansal: new Set(lists.bansal.map(n => normalize(n))),
            airson: new Set(lists.airson.map(n => normalize(n))),
            kohinoor: new Set(lists.kohinoor.map(n => normalize(n))),
            naresh: new Set(lists.naresh.map(n => normalize(n)))
        };

        source.forEach(group => {
            const nName = normalize(group.groupName);
            let categorized = false;

            // Check each category independently (brands can be in multiple groups)
            if (sets.paragon.has(nName)) {
                groups.paragon.push(group);
                categorized = true;
            }
            if (sets.topBrands.has(nName)) {
                const cfg = lists.topBrands.find(c => normalize(c.name) === nName);
                groups.topBrands.push({ group, logo: cfg ? cfg.logo : null });
                categorized = true;
            }
            if (sets.midBrands.has(nName)) {
                groups.midBrands.push({ group });
                categorized = true;
            }
            if (sets.generalLoosePacking.has(nName)) {
                groups.generalLoosePackingGroups.push({ group });
                categorized = true;
            }
            if (sets.generalBoxPacking.has(nName)) {
                groups.generalBoxPackingGroups.push({ group });
                categorized = true;
            }
            if (sets.socks.has(nName)) {
                groups.socksGroups.push({ group });
                categorized = true;
            }
            if (sets.general.has(nName)) {
                groups.general.push(group);
                categorized = true;
            }
            if (sets.bansal.has(nName)) {
                groups.bansalGroups.push(group);
                categorized = true;
            }
            if (sets.airson.has(nName)) {
                groups.airsonGroups.push(group);
                categorized = true;
            }
            if (sets.kohinoor.has(nName)) {
                groups.kohinoorGroups.push(group);
                categorized = true;
            }
            if (sets.naresh.has(nName)) {
                groups.nareshGroups.push(group);
                categorized = true;
            }

            // Only add to "others" if not categorized anywhere
            if (!categorized) {
                groups.others.push(group);
            }
        });

        return groups;
    });

    return {
        groupedSidebar,
        lists
    };
}

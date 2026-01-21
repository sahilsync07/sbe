
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
            socks: new Set(lists.socks.map(n => normalize(n))),
            general: new Set(lists.general.map(n => normalize(n))),
            bansal: new Set(lists.bansal.map(n => normalize(n))),
            airson: new Set(lists.airson.map(n => normalize(n))),
            kohinoor: new Set(lists.kohinoor.map(n => normalize(n))),
            naresh: new Set(lists.naresh.map(n => normalize(n)))
        };

        source.forEach(group => {
            const nName = normalize(group.groupName);

            if (sets.paragon.has(nName)) {
                groups.paragon.push(group);
            } else if (sets.topBrands.has(nName)) {
                const cfg = lists.topBrands.find(c => normalize(c.name) === nName);
                groups.topBrands.push({ group, logo: cfg ? cfg.logo : null });
            } else if (sets.midBrands.has(nName)) {
                groups.midBrands.push({ group });
            } else if (sets.socks.has(nName)) {
                groups.socksGroups.push({ group });
            } else if (sets.general.has(nName)) {
                groups.general.push(group);
            } else if (sets.bansal.has(nName)) {
                groups.bansalGroups.push(group);
            } else if (sets.airson.has(nName)) {
                groups.airsonGroups.push(group);
            } else if (sets.kohinoor.has(nName)) {
                groups.kohinoorGroups.push(group);
            } else if (sets.naresh.has(nName)) {
                groups.nareshGroups.push(group);
            } else {
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

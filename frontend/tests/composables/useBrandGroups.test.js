
import { describe, it, expect } from 'vitest';
import { useBrandGroups } from '../../src/composables/useBrandGroups';
import { ref } from 'vue';

describe('useBrandGroups Composable', () => {
    const mockStockData = [
        { groupName: 'Paragon', products: [] },
        { groupName: 'Cubix', products: [] },
        { groupName: 'Action', products: [] },
        { groupName: 'UnknownBrand', products: [] }
    ];

    it('should categorize brands correctly', () => {
        const stock = ref(mockStockData);
        const config = ref({});
        const searchQuery = ref('');

        const { groupedSidebar } = useBrandGroups(stock, config, searchQuery);

        // Paragon should be in paragon list
        expect(groupedSidebar.value.paragon).toHaveLength(1);
        expect(groupedSidebar.value.paragon[0].groupName).toBe('Paragon');

        // Cubix and Action should be in topBrands
        // Note: Cubix is in list, Action is in list.
        expect(groupedSidebar.value.topBrands).toHaveLength(2);

        // UnknownBrand should be in others
        expect(groupedSidebar.value.others).toHaveLength(1);
        expect(groupedSidebar.value.others[0].groupName).toBe('UnknownBrand');
    });

    it('should filter by sidebar search query', () => {
        const stock = ref(mockStockData);
        const config = ref({});
        const searchQuery = ref('Para');

        const { groupedSidebar } = useBrandGroups(stock, config, searchQuery);

        expect(groupedSidebar.value.paragon).toHaveLength(1);
        // Others should be empty as 'UnknownBrand' doesn't match 'Para'
        expect(groupedSidebar.value.others).toHaveLength(0);
    });
});


import { describe, it, expect, beforeEach } from 'vitest';
import { useProductFilter } from '../../src/composables/useProductFilter';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../../src/stores/appStore';

describe('useProductFilter Composable', () => {
    let appStore;

    beforeEach(() => {
        setActivePinia(createPinia());
        appStore = useAppStore();
    });

    const mockStockData = [
        { groupName: 'BrandA', products: [{ productName: 'Shoe 1', imageUrl: 'url1', quantity: 10 }, { productName: 'Old Shoe', imageUrl: 'url2', quantity: 0 }] },
        { groupName: 'BrandB', products: [{ productName: 'Shoe 2', imageUrl: null, quantity: 5 }] },
        { groupName: 'OldBrand', products: [{ productName: 'Ancient Shoe', imageUrl: 'url3', quantity: 8 }] }
    ];

    // Minimal config mock
    const mockConfig = {
        brandGroups: {
            'TopFive': ['BrandA']
        },
        customFilters: {
            'Shoe': ['Shoe']
        }
    };

    it('should filter by search query and include out of stock items', () => {
        const stock = ref(mockStockData);
        const config = ref(mockConfig);
        const { filteredStockData, searchQuery } = useProductFilter(stock, config);

        // Search for 'Old Shoe' which has 0 quantity (out of stock)
        searchQuery.value = 'Old Shoe';

        expect(filteredStockData.value).toHaveLength(1);
        expect(filteredStockData.value[0].groupName).toBe('BrandA');
        expect(filteredStockData.value[0].products).toHaveLength(1);
        expect(filteredStockData.value[0].products[0].productName).toBe('Old Shoe');
        expect(filteredStockData.value[0].products[0].quantity).toBe(0);
    });

    it('should filter by clean view when not searching', () => {
        const stock = ref(mockStockData);
        const config = ref(mockConfig);
        const { filteredStockData, cleanView } = useProductFilter(stock, config);

        cleanView.value = true;

        // BrandB has no images and Old Shoe has 0 quantity, so BrandA should only have Shoe 1
        const brandB = filteredStockData.value.find(g => g.groupName === 'BrandB');
        expect(brandB).toBeUndefined();

        const brandA = filteredStockData.value.find(g => g.groupName === 'BrandA');
        expect(brandA).toBeDefined();
        expect(brandA.products).toHaveLength(1);
        expect(brandA.products[0].productName).toBe('Shoe 1');
    });

    it('should filter old articles', () => {
        const stock = ref(mockStockData);
        const config = ref(mockConfig);
        const { filteredStockData, hideOldArticles } = useProductFilter(stock, config);

        hideOldArticles.value = true;

        // 'OldBrand' should be filtered out
        const oldBrand = filteredStockData.value.find(g => g.groupName === 'OldBrand');
        expect(oldBrand).toBeUndefined();
    });

    it('should select specific group', () => {
        const stock = ref(mockStockData);
        const config = ref(mockConfig);
        const { filteredStockData, selectedGroup, cleanView } = useProductFilter(stock, config);

        cleanView.value = false;
        selectedGroup.value = 'BrandB';

        expect(filteredStockData.value).toHaveLength(1);
        expect(filteredStockData.value[0].groupName).toBe('BrandB');
    });
});

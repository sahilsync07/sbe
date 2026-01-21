
import { describe, it, expect } from 'vitest';
import { useProductFilter } from '../../src/composables/useProductFilter';
import { ref } from 'vue';

describe('useProductFilter Composable', () => {
    const mockStockData = [
        { groupName: 'BrandA', products: [{ productName: 'Shoe 1', imageUrl: 'url1' }, { productName: 'Old Shoe', imageUrl: 'url2' }] },
        { groupName: 'BrandB', products: [{ productName: 'Shoe 2', imageUrl: null }] },
        { groupName: 'OldBrand', products: [{ productName: 'Ancient Shoe', imageUrl: 'url3' }] }
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

    it('should filter by search query', () => {
        const stock = ref(mockStockData);
        const config = ref(mockConfig);
        const { filteredStockData, searchQuery, showImagesOnly } = useProductFilter(stock, config);

        // Disable other filters for clarity
        showImagesOnly.value = false;
        searchQuery.value = 'Shoe 1';

        expect(filteredStockData.value).toHaveLength(1);
        expect(filteredStockData.value[0].groupName).toBe('BrandA');
        expect(filteredStockData.value[0].products).toHaveLength(1);
        expect(filteredStockData.value[0].products[0].productName).toBe('Shoe 1');
    });

    it('should filter by images only', () => {
        const stock = ref(mockStockData);
        const config = ref(mockConfig);
        const { filteredStockData, showImagesOnly } = useProductFilter(stock, config);

        showImagesOnly.value = true;

        // BrandB has no images, so it should be removed
        const brandB = filteredStockData.value.find(g => g.groupName === 'BrandB');
        expect(brandB).toBeUndefined();

        // Check BrandA
        const brandA = filteredStockData.value.find(g => g.groupName === 'BrandA');
        expect(brandA).toBeDefined();
        // BrandA originally has 'Shoe 1' (url1) and 'Old Shoe' (url2). Both have images.
        expect(brandA.products).toHaveLength(2);
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
        const { filteredStockData, selectedGroup, showImagesOnly } = useProductFilter(stock, config);

        showImagesOnly.value = false; // Disable image filter for this test
        selectedGroup.value = 'BrandB';

        expect(filteredStockData.value).toHaveLength(1);
        expect(filteredStockData.value[0].groupName).toBe('BrandB');
    });
});

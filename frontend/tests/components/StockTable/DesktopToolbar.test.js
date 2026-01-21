
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DesktopToolbar from '../../../src/components/StockTable/DesktopToolbar.vue';

describe('DesktopToolbar.vue', () => {
    it('renders correctly', () => {
        const wrapper = mount(DesktopToolbar, {
            props: {
                companyName: 'Test Company',
                cartTotalItems: 5,
                searchQuery: '',
                showImagesOnly: true
            }
        });

        expect(wrapper.text()).toContain('Test Company');
        expect(wrapper.text()).toContain('5'); // Cart count
    });

    it('emits toggle events', async () => {
        const wrapper = mount(DesktopToolbar, {
            props: { companyName: 'Test' }
        });

        // Find toggle buttons (first button is sidebar toggle)
        // We can rely on classes or order. The sidebar toggle works.
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('toggleSidebar')).toBeTruthy();
    });

    it('updates search query', async () => {
        const wrapper = mount(DesktopToolbar, {
            props: { companyName: 'Test', searchQuery: '' }
        });

        const input = wrapper.find('input[type="text"]');
        await input.setValue('shoe');

        expect(wrapper.emitted('update:searchQuery')[0]).toEqual(['shoe']);
    });
});


import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BrandsSidebar from '../../../src/components/StockTable/BrandsSidebar.vue';

describe('BrandsSidebar.vue', () => {
    it('renders correct brands', () => {
        const groupedSidebar = {
            paragon: [{ groupName: 'Paragon 1' }],
            general: [{ groupName: 'General 1' }]
        };

        const wrapper = mount(BrandsSidebar, {
            props: {
                showSidePanel: true,
                groupedSidebar,
                activeScrollGroup: '',
                selectedGroup: 'All'
            }
        });

        expect(wrapper.text()).toContain('Paragon 1');
        expect(wrapper.text()).toContain('General 1');
    });

    it('emits sidebarClick', async () => {
        const groupedSidebar = {
            general: [{ groupName: 'General 1' }]
        };

        const wrapper = mount(BrandsSidebar, {
            props: {
                showSidePanel: true,
                groupedSidebar
            }
        });

        // Find the readable text or class
        await wrapper.find('.group\\/brand').trigger('click');

        expect(wrapper.emitted('sidebarClick')).toBeTruthy();
        expect(wrapper.emitted('sidebarClick')[0][0]).toEqual({ groupName: 'General 1' });
    });
});

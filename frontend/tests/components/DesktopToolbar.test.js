import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DesktopToolbar from '../../src/android/components/StockTable/DesktopToolbar.vue';

describe('DesktopToolbar Component', () => {
    const defaultProps = {
        companyName: 'Test Company',
        cloudName: 'test-cloud',
        cartTotalItems: 0,
        isAdmin: false,
        isSuperAdmin: false
    };

    it('should render company name', () => {
        const wrapper = mount(DesktopToolbar, {
            props: defaultProps
        });

        expect(wrapper.text()).toContain('Test');
        expect(wrapper.text()).toContain('Company');
    });

    it('should display last sync time when provided', () => {
        const lastRefresh = new Date('2026-01-22T00:00:00');
        const wrapper = mount(DesktopToolbar, {
            props: {
                ...defaultProps,
                lastRefresh
            }
        });

        expect(wrapper.text()).toContain('Last Synced:');
    });

    it('should show "Never" when no last refresh', () => {
        const wrapper = mount(DesktopToolbar, {
            props: defaultProps
        });

        expect(wrapper.text()).toContain('Never');
    });

    it('should emit toggle-sidebar when sidebar button clicked', async () => {
        const wrapper = mount(DesktopToolbar, {
            props: defaultProps
        });

        const sidebarButton = wrapper.findAll('button')[0];
        await sidebarButton.trigger('click');

        expect(wrapper.emitted('toggle-sidebar')).toBeTruthy();
    });

    it('should emit toggle-cart when cart button clicked', async () => {
        const wrapper = mount(DesktopToolbar, {
            props: defaultProps
        });

        const buttons = wrapper.findAll('button');
        const cartButton = buttons[buttons.length - 1];
        await cartButton.trigger('click');

        expect(wrapper.emitted('toggle-cart')).toBeTruthy();
    });

    it('should show cart badge when items in cart', () => {
        const wrapper = mount(DesktopToolbar, {
            props: {
                ...defaultProps,
                cartTotalItems: 5
            }
        });

        expect(wrapper.text()).toContain('5');
    });

    it('should emit search-change when typing in search', async () => {
        const wrapper = mount(DesktopToolbar, {
            props: defaultProps
        });

        const searchInput = wrapper.find('input[type="text"]');
        await searchInput.trigger('input', { target: { value: 'test search' } });

        expect(wrapper.emitted('search-change')).toBeTruthy();
    });

    it('should emit admin-login when clicking company name', async () => {
        const wrapper = mount(DesktopToolbar, {
            props: defaultProps
        });

        const title = wrapper.find('h1');
        await title.trigger('click');

        expect(wrapper.emitted('admin-login')).toBeTruthy();
    });
});

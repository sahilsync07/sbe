import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BottomNavigation from '../src/android/components/BottomNavigation.vue';

describe('BottomNavigation Component', () => {
    it('should render all base tabs for non-admin', () => {
        const wrapper = mount(BottomNavigation, {
            props: {
                activeTab: 'home',
                isAdmin: false
            }
        });

        expect(wrapper.text()).toContain('HOME');
        expect(wrapper.text()).toContain('BRANDS');
        expect(wrapper.text()).toContain('PROFILE');
        expect(wrapper.text()).not.toContain('CATALOG');
    });

    it('should render catalog tab for admin', () => {
        const wrapper = mount(BottomNavigation, {
            props: {
                activeTab: 'home',
                isAdmin: true
            }
        });

        expect(wrapper.text()).toContain('HOME');
        expect(wrapper.text()).toContain('BRANDS');
        expect(wrapper.text()).toContain('CATALOG');
        expect(wrapper.text()).toContain('PROFILE');
    });

    it('should highlight active tab', () => {
        const wrapper = mount(BottomNavigation, {
            props: {
                activeTab: 'home',
                isAdmin: false
            }
        });

        const buttons = wrapper.findAll('button');
        // Home button should have active styling (text-slate-900)
        expect(buttons[0].classes()).toContain('active:scale-95');
    });

    it('should emit tab-change when clicking non-brands tab', async () => {
        const wrapper = mount(BottomNavigation, {
            props: {
                activeTab: 'home',
                isAdmin: false
            }
        });

        const buttons = wrapper.findAll('button');
        await buttons[2].trigger('click'); // Profile tab

        expect(wrapper.emitted('tab-change')).toBeTruthy();
        expect(wrapper.emitted('tab-change')[0][0]).toBe('profile');
    });

    it('should emit brands-click when clicking brands tab', async () => {
        const wrapper = mount(BottomNavigation, {
            props: {
                activeTab: 'home',
                isAdmin: false
            }
        });

        const buttons = wrapper.findAll('button');
        await buttons[1].trigger('click'); // Brands tab

        expect(wrapper.emitted('brands-click')).toBeTruthy();
        expect(wrapper.emitted('tab-change')).toBeFalsy();
    });

    it('should have 3 tabs for non-admin users', () => {
        const wrapper = mount(BottomNavigation, {
            props: {
                activeTab: 'home',
                isAdmin: false
            }
        });

        const buttons = wrapper.findAll('button');
        expect(buttons.length).toBe(3);
    });

    it('should have 4 tabs for admin users', () => {
        const wrapper = mount(BottomNavigation, {
            props: {
                activeTab: 'home',
                isAdmin: true
            }
        });

        const buttons = wrapper.findAll('button');
        expect(buttons.length).toBe(4);
    });

    it('should render icons for all tabs', () => {
        const wrapper = mount(BottomNavigation, {
            props: {
                activeTab: 'home',
                isAdmin: true
            }
        });

        const icons = wrapper.findAll('svg');
        expect(icons.length).toBeGreaterThanOrEqual(4);
    });
});

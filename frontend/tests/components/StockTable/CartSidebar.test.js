
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CartSidebar from '../../../src/components/StockTable/CartSidebar.vue';

describe('CartSidebar.vue', () => {
    it('renders cart items', () => {
        const cart = [
            { product: { productName: 'Shoe A', imageUrl: 'url' }, quantity: 2 }
        ];

        const wrapper = mount(CartSidebar, {
            props: {
                showCart: true,
                cart,
                filteredCart: cart,
                cartTotalItems: 2,
                cartItemCount: 1
            }
        });

        expect(wrapper.text()).toContain('Shoe A');
        expect(wrapper.text()).toContain('2 Sets');
    });

    it('emits update events', async () => {
        const cart = [
            { product: { productName: 'Shoe A' }, quantity: 1 }
        ];
        const wrapper = mount(CartSidebar, {
            props: { showCart: true, cart, filteredCart: cart, cartTotalItems: 1 }
        });

        // Find + button
        const buttons = wrapper.findAll('button');
        // The first few buttons are clear, then inside item: -, +, remove
        // We can search for text "+" inside button
        const plusBtn = buttons.find(b => b.text() === '+');
        await plusBtn.trigger('click');

        expect(wrapper.emitted('updateCartQuantity')).toBeTruthy();
        // index 0, change 1
        expect(wrapper.emitted('updateCartQuantity')[0]).toEqual([0, 1]);
    });
});

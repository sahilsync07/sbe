
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ImageModal from '../../../src/components/StockTable/ImageModal.vue';

describe('ImageModal.vue', () => {
    it('renders product details', () => {
        const product = { productName: 'Big Shoe', quantity: 10, imageUrl: 'url' };

        const wrapper = mount(ImageModal, {
            props: {
                showImagePopup: true,
                currentProduct: product,
                currentProductIndex: 0,
                currentGroupName: 'Group A',
                cartQty: 0
            }
        });

        expect(wrapper.text()).toContain('Big Shoe');
        expect(wrapper.text()).toContain('10 Sets');
    });

    it('emits add to cart', async () => {
        const product = { productName: 'Big Shoe', quantity: 10 };
        const wrapper = mount(ImageModal, {
            props: {
                showImagePopup: true,
                currentProduct: product,
                cartQty: 0
            }
        });

        await wrapper.find('button.bg-slate-900').trigger('click'); // Add to Cart button has this class

        expect(wrapper.emitted('addToCart')).toBeTruthy();
        expect(wrapper.emitted('addToCart')[0][0]).toEqual(product);
    });
});

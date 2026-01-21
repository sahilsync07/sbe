import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductCard from '../src/android/components/ProductCard.vue';

describe('ProductCard Component', () => {
    const mockProduct = {
        name: 'Test Shoe',
        stock: 100,
        image: 'https://example.com/image.jpg',
        brand: 'Test Brand'
    };

    it('should render product name', () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct
            }
        });

        expect(wrapper.text()).toContain('Test Shoe');
    });

    it('should display product stock', () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct
            }
        });

        expect(wrapper.text()).toContain('100');
        expect(wrapper.text()).toContain('Pairs');
    });

    it('should display brand name', () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct
            }
        });

        expect(wrapper.text()).toContain('Test Brand');
    });

    it('should show "Add to Cart" button when cartQuantity is 0', () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct,
                cartQuantity: 0
            }
        });

        const addButton = wrapper.find('button[aria-label*="Add"]');
        expect(addButton.exists()).toBe(true);
    });

    it('should display quantity controls when item is in cart', () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct,
                cartQuantity: 3
            }
        });

        // Should display the quantity number
        const quantityDisplay = wrapper.find('.text-blue-700');
        expect(quantityDisplay.text()).toBe('3');

        // Should have - and + buttons
        const buttons = wrapper.findAll('.text-blue-600');
        expect(buttons.length).toBe(2); // - and + buttons
    });

    it('should emit add-to-cart event when clicking add button', async () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct,
                cartQuantity: 0
            }
        });

        const addButton = wrapper.find('button[aria-label*="Add"]');
        await addButton.trigger('click');

        expect(wrapper.emitted('add-to-cart')).toBeTruthy();
        expect(wrapper.emitted('add-to-cart')[0][0]).toEqual(mockProduct);
    });

    it('should emit update-quantity event when clicking + button', async () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct,
                cartQuantity: 2
            }
        });

        // Find the + button (second button in quantity controls)
        const buttons = wrapper.findAll('.text-blue-600 button');
        const plusButton = buttons[1];

        await plusButton.trigger('click');

        expect(wrapper.emitted('update-quantity')).toBeTruthy();
        expect(wrapper.emitted('update-quantity')[0][0]).toEqual(mockProduct);
        expect(wrapper.emitted('update-quantity')[0][1]).toBe(1);
    });

    it('should emit update-quantity event when clicking - button', async () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct,
                cartQuantity: 2
            }
        });

        // Find the - button (first button in quantity controls)
        const buttons = wrapper.findAll('.text-blue-600 button');
        const minusButton = buttons[0];

        await minusButton.trigger('click');

        expect(wrapper.emitted('update-quantity')).toBeTruthy();
        expect(wrapper.emitted('update-quantity')[0][0]).toEqual(mockProduct);
        expect(wrapper.emitted('update-quantity')[0][1]).toBe(-1);
    });

    it('should display new arrival badge when isNewArrival is true', () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct,
                isNewArrival: true
            }
        });

        expect(wrapper.text()).toContain('NEW');
        expect(wrapper.find('.bg-new-arrival\\/90').exists()).toBe(true);
    });

    it('should render image when product has image', () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct
            }
        });

        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe(mockProduct.image);
        expect(img.attributes('alt')).toBe(mockProduct.name);
    });

    it('should show "No image" placeholder when product has no image', () => {
        const productWithoutImage = { ...mockProduct, image: null };
        const wrapper = mount(ProductCard, {
            props: {
                product: productWithoutImage
            }
        });

        expect(wrapper.find('img').exists()).toBe(false);
        expect(wrapper.text()).toContain('No image');
    });

    it('should emit click event when card is clicked', async () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct
            }
        });

        await wrapper.trigger('click');

        expect(wrapper.emitted('click')).toBeTruthy();
        expect(wrapper.emitted('click')[0][0]).toEqual(mockProduct);
    });

    it('should show upload button overlay when isAdmin is true', () => {
        const wrapper = mount(ProductCard, {
            props: {
                product: mockProduct,
                isAdmin: true
            }
        });

        expect(wrapper.text()).toContain('Add Photo');
    });
});

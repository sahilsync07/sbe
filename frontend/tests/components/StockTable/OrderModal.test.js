
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OrderModal from '../../../src/components/StockTable/OrderModal.vue';

describe('OrderModal.vue', () => {
    it('renders correctly when shown', () => {
        const wrapper = mount(OrderModal, {
            props: {
                show: true,
                customerName: 'John',
                customerPhone: '123'
            }
        });

        expect(wrapper.text()).toContain('Finalize Your Order');
        expect(wrapper.find('input[type="text"]').element.value).toBe('John');
    });

    it('emits update events', async () => {
        const wrapper = mount(OrderModal, {
            props: { show: true, customerName: '' }
        });

        const input = wrapper.find('input[type="text"]');
        await input.setValue('Jane');

        expect(wrapper.emitted('update:customerName')[0]).toEqual(['Jane']);
    });

    it('emits confirm event', async () => {
        const wrapper = mount(OrderModal, {
            props: { show: true }
        });

        const sendBtn = wrapper.findAll('button').find(b => b.text().includes('Send Order'));
        await sendBtn.trigger('click');

        expect(wrapper.emitted('confirm')).toBeTruthy();
    });
});

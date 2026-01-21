
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWhatsAppOrder } from '../../src/composables/useWhatsAppOrder';
import { ref } from 'vue';
import { toast } from 'vue3-toastify';

// Mock Toast
vi.mock('vue3-toastify', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn()
    }
}));

describe('useWhatsAppOrder Composable', () => {
    let mockCart;
    let mockConfig;

    beforeEach(() => {
        mockCart = ref([]);
        mockConfig = ref({ companyName: 'TestCompany' });
        vi.clearAllMocks();
        // Mock window.open
        global.window.open = vi.fn();
    });

    it('should show modal if cart has items', () => {
        mockCart.value = [{ product: { productName: 'P1' }, quantity: 1 }];
        const { sendOrderToWhatsapp, showOrderDetailsModal } = useWhatsAppOrder(mockCart, mockConfig);

        sendOrderToWhatsapp();

        expect(showOrderDetailsModal.value).toBe(true);
    });

    it('should not show modal if cart is empty', () => {
        mockCart.value = [];
        const { sendOrderToWhatsapp, showOrderDetailsModal } = useWhatsAppOrder(mockCart, mockConfig);

        sendOrderToWhatsapp();

        expect(showOrderDetailsModal.value).toBe(false);
    });

    it('should show error if name/phone missing', () => {
        const { finalizeOrderAndSend, customerName } = useWhatsAppOrder(mockCart, mockConfig);

        // Neither
        finalizeOrderAndSend();
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('name'), expect.any(Object));

        // Name only
        customerName.value = 'John';
        finalizeOrderAndSend();
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('phone'), expect.any(Object));
    });

    it('should open whatsapp url with correct message', () => {
        mockCart.value = [{ product: { productName: 'Shoe Pair' }, quantity: 2 }];
        const { finalizeOrderAndSend, customerName, customerPhone } = useWhatsAppOrder(mockCart, mockConfig);

        customerName.value = 'John Doe';
        customerPhone.value = '1234567890';

        finalizeOrderAndSend();

        expect(global.window.open).toHaveBeenCalled();
        const urlArgs = global.window.open.mock.calls[0][0];
        expect(urlArgs).toContain('wa.me');
        expect(urlArgs).toContain(encodeURIComponent('John Doe'));
        expect(urlArgs).toContain(encodeURIComponent('Shoe Pair'));
        expect(urlArgs).toContain('2%20Sets'); // 2 Sets
    });
});

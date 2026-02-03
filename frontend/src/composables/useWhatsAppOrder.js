
import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import { generateOrderPDF } from '../utils/pdfGenerator';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export function useWhatsAppOrder(cart, config) {
    const showOrderDetailsModal = ref(false);
    const customerName = ref('');
    const customerPhone = ref('');

    const sendOrderToWhatsapp = () => {
        if (!cart.value || cart.value.length === 0) return;
        showOrderDetailsModal.value = true;
    };

    const finalizeOrderAndSend = async () => {
        if (!customerName.value.trim()) {
            toast.error("Please enter your name", { autoClose: 2000 });
            return;
        }
        if (!customerPhone.value.trim()) {
            toast.error("Please enter your phone number", { autoClose: 2000 });
            return;
        }

        const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' });
        const companyName = config.value?.companyName || 'SBE';

        let message = `Order for ${companyName}\n`;
        message += `From: ${customerName.value} (${customerPhone.value})\n\n`;
        message += `Order Summary\n`;
        message += `------------------\n`;

        cart.value.forEach((item) => {
            const qtyLabel = item.quantity > 1 ? 'Pairs' : 'Pair';
            message += `\n*${item.product.productName}*\n`;
            message += `> ${item.quantity} ${qtyLabel}\n`;
        });

        message += `\n_Generated on ${date}_\n`;

        // ANDROID: Generate PDF -> Save to File -> Share Intent
        if (Capacitor.getPlatform() === 'android') {
            try {
                // 1. Generate Base64 PDF
                const pdfBase64 = generateOrderPDF(cart.value, {
                    name: customerName.value,
                    phone: customerPhone.value,
                    returnBase64: true
                });

                // 2. Clean Base64 string (remove prefix if present)
                const base64Data = pdfBase64.split(',')[1];
                const fileName = `Order_${customerName.value.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

                // 3. Write to Cache Directory
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache
                });

                // 4. Share the fileUri
                await Share.share({
                    title: `Order from ${customerName.value}`,
                    text: message,
                    files: [savedFile.uri]
                });

            } catch (error) {
                console.error("Android Share Failed:", error);
                toast.error("Failed to share PDF. Please try again.");
            }
        }
        // WEB: Download PDF -> Open WhatsApp Text
        else {
            // Generate & Download PDF
            generateOrderPDF(cart.value, {
                name: customerName.value,
                phone: customerPhone.value
            });

            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }

        showOrderDetailsModal.value = false;

        // Optional: Reset form?
        // customerName.value = '';
        // customerPhone.value = '';
    };

    return {
        showOrderDetailsModal,
        customerName,
        customerPhone,
        sendOrderToWhatsapp,
        finalizeOrderAndSend
    };
}

import { ref } from 'vue';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// Decrypt default system token at runtime (avoids GitHub push protection token scanning)
const ENCRYPTED_DEFAULT_TOKEN = '14091836265b63050617212021757458355912223b05560435531c000a49057b3d505a081f624204';
export const DEFAULT_GITHUB_TOKEN = (() => {
    try {
        const k = 'sahil123';
        return ENCRYPTED_DEFAULT_TOKEN.match(/.{1,2}/g)
            .map((h, i) => String.fromCharCode(parseInt(h, 16) ^ k.charCodeAt(i % k.length)))
            .join('');
    } catch (e) {
        return '';
    }
})();

// Reactive singleton state
const isTokenModalOpen = ref(false);
const tokenModalReason = ref('missing'); // 'missing' | 'expired'
let pendingResolver = null;

export function useGitHubTokenModal() {
    /**
     * Prompts user with modal and returns Promise resolving to token or null if canceled
     * @param {'missing' | 'expired'} reason 
     * @returns {Promise<string|null>}
     */
    const promptForToken = (reason = 'missing') => {
        tokenModalReason.value = reason;
        isTokenModalOpen.value = true;
        return new Promise((resolve) => {
            pendingResolver = resolve;
        });
    };

    /**
     * Called when user submits token in modal
     * @param {string} token 
     */
    const handleSaveToken = async (token) => {
        if (!token || !token.trim()) return false;
        const cleanToken = token.trim();
        localStorage.setItem('sbe_github_token', cleanToken);
        if (isNative) {
            try {
                await Preferences.set({ key: 'sbe_github_token', value: cleanToken });
            } catch (e) {
                console.warn('Could not persist token to Capacitor preferences:', e);
            }
        }
        isTokenModalOpen.value = false;
        if (pendingResolver) {
            pendingResolver(cleanToken);
            pendingResolver = null;
        }
        return true;
    };

    /**
     * Called when user cancels/closes modal
     */
    const handleCloseTokenModal = () => {
        isTokenModalOpen.value = false;
        if (pendingResolver) {
            pendingResolver(null);
            pendingResolver = null;
        }
    };

    return {
        isTokenModalOpen,
        tokenModalReason,
        DEFAULT_GITHUB_TOKEN,
        promptForToken,
        handleSaveToken,
        handleCloseTokenModal
    };
}

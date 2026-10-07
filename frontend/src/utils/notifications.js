import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { isNewArrival } from './formatters.js';

const STORAGE_KEY_SEEN = 'sbe_seen_new_arrivals';
const STORAGE_KEY_LAST_ALERT = 'sbe_last_new_arrival_alert_time';
const ALERT_NOTIFICATION_ID = 1001;
const OLD_SYNC_NOTIFICATION_ID = 1;

/**
 * Extract clean display brand name from product
 */
export function extractBrandFromProduct(product) {
    if (!product) return 'FOOTWEAR';
    const grp = (product.groupName || '').trim();
    const name = (product.productName || '').trim();

    const knownBrands = [
        'Paragon', 'Solea', 'Paralite', 'P-Toes', 'Vertex', 'Meriva', 'Comfy',
        'Stimulus', 'Fender', 'Eeken', 'Cubix', 'Florex', 'Action', 'Reliance',
        'Ajanta', 'Escoute', 'Walkaholic', 'Xpania', 'Tuffboot', 'Max'
    ];

    for (const b of knownBrands) {
        const reg = new RegExp(`\\b${b}\\b`, 'i');
        if (reg.test(grp) || reg.test(name)) return b.toUpperCase();
    }
    return (grp.replace(/[^A-Za-z0-9\s]/g, '').trim() || 'FOOTWEAR').toUpperCase();
}

/**
 * Initialize notification system:
 * 1. Cancels the obsolete generic morning sync notification (ID 1).
 * 2. Registers click listener to navigate to the New Arrivals tab.
 */
export async function setupDailySyncNotification(router = null) {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // Cancel old legacy morning sync notification (ID 1)
        const pending = await LocalNotifications.getPending();
        if (pending.notifications && pending.notifications.length > 0) {
            const hasLegacy = pending.notifications.some(n => n.id === OLD_SYNC_NOTIFICATION_ID);
            if (hasLegacy) {
                await LocalNotifications.cancel({ notifications: [{ id: OLD_SYNC_NOTIFICATION_ID }] });
                console.log('[Notifications] Cancelled legacy morning sync notification (ID 1).');
            }
        }

        // Listen for user tapping any notification
        LocalNotifications.removeAllListeners();
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            const extra = action.notification.extra || {};
            if (extra.type === 'broadcast') {
                console.log('[Notifications] User tapped Broadcast notification:', extra);
                const target = extra.target || 'Stock';
                if (router) {
                    if (target === 'NewArrivals') {
                        router.push({ path: '/', query: { brand: 'NewArrivals' } });
                    } else if (target === 'Stock') {
                        router.push({ path: '/' });
                    } else {
                        router.push({ path: '/', query: { brand: target } });
                    }
                } else if (typeof window !== 'undefined') {
                    window.location.hash = target === 'Stock' ? '#/' : `/#/?brand=${target}`;
                }
            } else if (extra.type === 'new_arrivals' || action.notification.id === ALERT_NOTIFICATION_ID) {
                console.log('[Notifications] User tapped New Arrivals notification');
                if (router) {
                    router.push({ path: '/', query: { brand: 'NewArrivals' } });
                } else if (typeof window !== 'undefined') {
                    window.location.hash = '#/?brand=NewArrivals';
                }
            }
        });
    } catch (e) {
        console.warn('[Notifications] Setup error:', e);
    }
}

/**
 * Detects genuinely fresh new arrival articles and triggers a marketing-style notification
 * highlighting brand names & trending model counts (e.g. "🔥 3 New EEKEN Trending Models Just Dropped!").
 */
export async function checkAndNotifyNewArrivals(catalog, router = null) {
    if (!Capacitor.isNativePlatform() || !catalog || !Array.isArray(catalog)) return;

    try {
        // 1. Gather all current in-stock new arrival products
        const currentNewArrivals = [];
        for (const group of catalog) {
            if (group.groupName === '_META_DATA_' || !group.products) continue;
            for (const p of group.products) {
                if (isNewArrival(p) && Number(p.quantity) > 0) {
                    currentNewArrivals.push({
                        ...p,
                        groupName: p.groupName || group.groupName
                    });
                }
            }
        }

        if (currentNewArrivals.length === 0) return;

        // 2. Load previously seen new arrival product names
        let seenMap = {};
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SEEN);
            if (raw) seenMap = JSON.parse(raw);
        } catch (e) {}

        const isFirstRun = Object.keys(seenMap).length === 0;

        // On first app launch after install, mark current catalog as seen so we don't spam immediately
        if (isFirstRun) {
            const now = Date.now();
            currentNewArrivals.forEach(p => {
                seenMap[p.productName] = now;
            });
            try {
                localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(seenMap));
            } catch (e) {}
            return;
        }

        // 3. Detect FRESH new arrivals that have never been notified
        const freshArrivals = currentNewArrivals.filter(p => !seenMap[p.productName]);
        if (freshArrivals.length === 0) return;

        // 4. Rate-limit / throttle notifications (at most once every 4 hours)
        const lastAlertTime = parseInt(localStorage.getItem(STORAGE_KEY_LAST_ALERT) || '0', 10);
        const now = Date.now();
        const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
        if (now - lastAlertTime < FOUR_HOURS_MS) {
            console.log('[Notifications] New arrivals detected but throttled (alerted recently).');
            freshArrivals.forEach(p => { seenMap[p.productName] = now; });
            try { localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(seenMap)); } catch (e) {}
            return;
        }

        // 5. Group fresh arrivals by brand to craft punchy marketing copy
        const brandCounts = {};
        freshArrivals.forEach(p => {
            const brand = extractBrandFromProduct(p);
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        });

        const sortedBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]);
        if (sortedBrands.length === 0) return;

        const topBrand = sortedBrands[0][0];
        const topBrandCount = sortedBrands[0][1];
        const totalCount = freshArrivals.length;

        // 6. Generate Catchy Marketing-Style Copy
        let title = '';
        let body = '';

        if (sortedBrands.length === 1) {
            // All new models from one brand (e.g. EEKEN)
            title = `🔥 ${topBrandCount} New ${topBrand} Trending Model${topBrandCount > 1 ? 's' : ''} Just Dropped!`;
            body = `Fresh ${topBrand} collection just arrived in stock. Tap to view the latest styles before they sell out! 👟`;
        } else if (sortedBrands.length === 2) {
            // Two brands
            const secondBrand = sortedBrands[1][0];
            title = `✨ Fresh Stock Alert: ${topBrand} & ${secondBrand}!`;
            body = `${totalCount} hot new trending models just added to catalog. Tap to explore what's new! 🔥`;
        } else {
            // Multiple brands
            title = `👟 ${totalCount} New Trending Models Just In! (${topBrand} & more)`;
            body = `Fresh new stock has arrived across top brands. Tap to check out the latest arrivals! ✨`;
        }

        // Ensure permissions
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
            const req = await LocalNotifications.requestPermissions();
            if (req.display !== 'granted') return;
        }

        // Schedule notification immediately
        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: ALERT_NOTIFICATION_ID,
                    extra: {
                        type: 'new_arrivals',
                        brand: topBrand,
                        count: totalCount
                    },
                    sound: null,
                    autoCancel: true
                }
            ]
        });

        console.log(`[Notifications] ✓ Triggered New Arrivals marketing alert: "${title}"`);

        // 7. Update storage
        freshArrivals.forEach(p => { seenMap[p.productName] = now; });
        // Clean up entries older than 60 days to prevent unbounded storage growth
        const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
        Object.keys(seenMap).forEach(key => {
            if (now - seenMap[key] > SIXTY_DAYS_MS) {
                delete seenMap[key];
            }
        });

        try {
            localStorage.setItem(STORAGE_KEY_SEEN, JSON.stringify(seenMap));
            localStorage.setItem(STORAGE_KEY_LAST_ALERT, String(now));
        } catch (e) {}

    } catch (err) {
        console.warn('[Notifications] Error checking new arrivals:', err);
    }
}

const STORAGE_KEY_SEEN_BROADCASTS = 'sbe_seen_broadcast_notifications';
const REMOTE_NOTIFICATIONS_URL = 'https://raw.githubusercontent.com/sahilsync07/sbe/refs/heads/main/frontend/public/assets/notifications.json';

/**
 * Checks for unseen admin broadcast notifications from notifications.json
 * and rings native Android status bar with an alert
 */
export async function checkAndNotifyBroadcasts(router = null) {
    if (!Capacitor.isNativePlatform()) return;

    try {
        let broadcasts = [];
        try {
            const baseUrl = typeof window !== 'undefined' ? (window.location.origin + (window.location.pathname.startsWith('/sbe') ? '/sbe/' : '/')) : '/';
            const res = await fetch(`${baseUrl}assets/notifications.json?t=${Date.now()}`);
            if (res.ok) {
                broadcasts = await res.json();
            }
        } catch (_) {}

        if (!Array.isArray(broadcasts) || broadcasts.length === 0) {
            try {
                const res = await fetch(`${REMOTE_NOTIFICATIONS_URL}?t=${Date.now()}`);
                if (res.ok) {
                    broadcasts = await res.json();
                }
            } catch (_) {}
        }

        if (!Array.isArray(broadcasts) || broadcasts.length === 0) return;

        let seenIds = [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SEEN_BROADCASTS);
            if (raw) seenIds = JSON.parse(raw);
        } catch (_) {}

        // Find unseen broadcasts
        const unseen = broadcasts.filter(b => b.id && !seenIds.includes(b.id));
        if (unseen.length === 0) return;

        const latest = unseen[0]; // broadcasts list is sorted newest first

        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
            const req = await LocalNotifications.requestPermissions();
            if (req.display !== 'granted') return;
        }

        const notifId = Number(String(latest.id).slice(-8)) || 2001;

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: latest.title,
                    body: latest.body,
                    id: notifId,
                    extra: {
                        type: 'broadcast',
                        target: latest.target,
                        id: latest.id
                    },
                    sound: null,
                    autoCancel: true
                }
            ]
        });

        console.log(`[Notifications] ✓ Triggered Broadcast alert: "${latest.title}"`);

        // Mark unseen as seen
        unseen.forEach(b => {
            if (!seenIds.includes(b.id)) seenIds.push(b.id);
        });
        localStorage.setItem(STORAGE_KEY_SEEN_BROADCASTS, JSON.stringify(seenIds.slice(-50)));
    } catch (err) {
        console.warn('[Notifications] Error checking broadcasts:', err);
    }
}


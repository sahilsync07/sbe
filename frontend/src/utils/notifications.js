import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useAdmin } from '../composables/useAdmin';
import { performDeltaSync } from './nativeCache';

export async function setupDailySyncNotification() {
    if (!Capacitor.isNativePlatform()) return;

    const { isAdmin, isSuperAdmin } = useAdmin();
    if (!isAdmin.value && !isSuperAdmin.value) return;

    try {
        // Request permissions first
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display !== 'granted') return;

        // Clear any old scheduled notifications to prevent duplicates
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
        }

        // Schedule for 9:00 AM daily
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: "Morning Stock Sync 📦",
                    body: "Tap here to update your offline catalog with the latest stock items and prices.",
                    id: 1,
                    schedule: {
                        on: {
                            hour: 9,
                            minute: 0
                        },
                        repeats: true
                    },
                    sound: null,
                    autoCancel: true,
                }
            ]
        });

        // Listen for user tapping the notification
        LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
            if (notificationAction.notification.id === 1) {
                // User tapped the morning sync notification
                performDeltaSync();
            }
        });

    } catch (e) {
        console.error("Failed to schedule daily sync notification", e);
    }
}

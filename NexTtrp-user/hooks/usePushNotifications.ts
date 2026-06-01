/**
 * @file hooks/usePushNotifications.ts
 * @description Registers for Expo push notifications and saves the token to the backend.
 *
 * Call this hook once in the root layout after the user is authenticated.
 * The token is persisted to AsyncStorage so we only re-register if it changes.
 *
 * Prerequisites:
 *  - expo-notifications installed
 *  - expo-device installed
 *  - expo-notifications plugin added to app.json
 *  - FCM credentials set up in EAS (Android)
 *  - APNs key uploaded in EAS (iOS)
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerDeviceToken } from '../lib/api/users';
import { useAuthStore } from '../store/authStore';

const TOKEN_STORAGE_KEY = '@nexttrp:push_token';

// Configure how notifications are displayed while the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(): void {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    if (!Device.isDevice) return;

    // Delay permission request slightly so it doesn't fire immediately on top
    // of other system dialogs (e.g. iOS app-tracking transparency).
    // This also prevents the double-alert that occurs when the permission dialog
    // is triggered at the same time as the app's first render.
    const timer = setTimeout(() => {
      void (async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        // Never ask again if the user already denied — respect their choice.
        if (existingStatus === 'denied') return;

        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

          // Android: ensure notification channel exists
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'NEXTTRP',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#E8631A',
          });
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        const stored = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (stored === token) return;

        const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
        await registerDeviceToken(token, platform);
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
      })();
    }, 2000); // 2-second delay prevents dialog clash on first open

    return () => clearTimeout(timer);
  }, [user]);
}

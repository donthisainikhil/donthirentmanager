import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { toast } from 'sonner';

export interface PushNotificationState {
  token: string | null;
  isRegistered: boolean;
  isSupported: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    isRegistered: false,
    isSupported: Capacitor.isNativePlatform(),
  });

  useEffect(() => {
    // Only run on native platforms (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const setupPushNotifications = async () => {
      try {
        // Request permission
        const permStatus = await PushNotifications.requestPermissions();
        
        if (permStatus.receive === 'granted') {
          // Register with Apple/Google for push notifications
          await PushNotifications.register();
        } else {
          toast.error('Push notification permission denied');
        }
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    // Listen for registration success
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      setState(prev => ({
        ...prev,
        token: token.value,
        isRegistered: true,
      }));
      // You can send this token to your server to send targeted notifications
      console.log('Push registration success, token:', token.value);
    });

    // Listen for registration errors
    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
      toast.error('Failed to register for push notifications');
    });

    // Listen for incoming notifications when app is in foreground
    const notificationReceivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        toast.info(notification.title || 'New Notification', {
          description: notification.body,
        });
      }
    );

    // Listen for notification tap/action
    const notificationActionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        // Handle notification tap - you can navigate to specific screens based on data
        console.log('Push notification action performed:', action);
        
        // Example: Navigate based on notification data
        const data = action.notification.data;
        if (data?.screen) {
          // You could use a navigation function here
          window.location.href = data.screen;
        }
      }
    );

    setupPushNotifications();

    // Cleanup listeners on unmount
    return () => {
      registrationListener.then(l => l.remove());
      registrationErrorListener.then(l => l.remove());
      notificationReceivedListener.then(l => l.remove());
      notificationActionListener.then(l => l.remove());
    };
  }, []);

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast.error('Push notifications are only available on mobile devices');
      return false;
    }

    try {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  return {
    ...state,
    requestPermission,
  };
}

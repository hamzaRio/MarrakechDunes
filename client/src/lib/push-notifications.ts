import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

export class PushNotificationService {
  private static instance: PushNotificationService;
  private vapidKey: string;
  private isSupported: boolean;

  constructor() {
    this.vapidKey = import.meta.env.VITE_PUSH_PUBLIC_KEY || '';
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  public async getToken(): Promise<string | null> {
    if (!this.isSupported) {
      return null;
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey,
      });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  public async subscribeToNotifications(): Promise<boolean> {
    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      const token = await this.getToken();
      if (!token) {
        console.error('Failed to get FCM token');
        return false;
      }

      // Send token to server
      await this.sendTokenToServer(token);
      
      // Listen for messages
      this.setupMessageListener();
      
      return true;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return false;
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Failed to send token to server');
      }
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  private setupMessageListener(): void {
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      
      // Show notification
      if (payload.notification) {
        this.showNotification(
          payload.notification.title || 'MarrakechDunes',
          payload.notification.body || 'You have a new notification',
          payload.notification.icon || '/icon-192x192.png'
        );
      }
    });
  }

  private showNotification(title: string, body: string, icon: string): void {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon,
          badge: '/icon-192x192.png',
          tag: 'marrakechdunes-notification',
          requireInteraction: true,
          // actions: [ // Not supported in all browsers
          //   {
          //     action: 'view',
          //     title: 'View',
          //     icon: '/icon-192x192.png',
          //   },
          //   {
          //     action: 'dismiss',
          //     title: 'Dismiss',
          //   },
          // ],
        });
      });
    }
  }

  public async unsubscribeFromNotifications(): Promise<void> {
    try {
      const token = await this.getToken();
      if (token) {
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
    }
  }

  public isNotificationSupported(): boolean {
    return this.isSupported;
  }

  public getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

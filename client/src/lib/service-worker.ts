import { Workbox } from 'workbox-window';

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private workbox: Workbox | null = null;

  constructor() {
    this.initializeServiceWorker();
  }

  public static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Initialize Workbox
        this.workbox = new Workbox('/sw.js');
        
        // Listen for service worker updates
        this.workbox.addEventListener('waiting', () => {
          this.showUpdatePrompt();
        });

        // Listen for service worker controlling
        this.workbox.addEventListener('controlling', () => {
          window.location.reload();
        });

        // Start the service worker
        await this.workbox.register();

        // Set up message handling
        this.setupMessageHandling();

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private setupMessageHandling(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;
        
        switch (type) {
          case 'NOTIFICATION_CLICKED':
            this.handleNotificationClick(payload);
            break;
          case 'CACHE_UPDATED':
            this.handleCacheUpdate(payload);
            break;
          default:
            console.log('Unknown message type:', type);
        }
      });
    }
  }

  private handleNotificationClick(payload: any): void {
    // Handle notification click actions
    const { action, data } = payload;
    
    switch (action) {
      case 'view':
        // Navigate to specific page based on notification data
        if (data?.url) {
          window.location.href = data.url;
        }
        break;
      case 'dismiss':
        // Notification was dismissed
        console.log('Notification dismissed');
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  private handleCacheUpdate(payload: any): void {
    console.log('Cache updated:', payload);
    // Handle cache update if needed
  }

  private showUpdatePrompt(): void {
    // Show update prompt to user
    const shouldUpdate = confirm(
      'A new version of MarrakechDunes is available. Would you like to update now?'
    );
    
    if (shouldUpdate && this.workbox) {
      this.workbox.messageSkipWaiting();
    }
  }

  public async updateServiceWorker(): Promise<void> {
    if (this.workbox) {
      await this.workbox.update();
    }
  }

  public async skipWaiting(): Promise<void> {
    if (this.workbox) {
      this.workbox.messageSkipWaiting();
    }
  }

  public isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  public async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      return await navigator.serviceWorker.getRegistration() || null;
    }
    return null;
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

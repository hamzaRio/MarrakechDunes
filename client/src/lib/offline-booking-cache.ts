import { api } from './api';

export interface OfflineBookingData {
  id: string;
  customerName: string;
  customerPhone: string;
  activityId: string;
  activityName: string;
  preferredDate: string;
  numberOfPeople: number;
  totalAmount: number;
  paymentMethod: string;
  notes?: string;
  status: 'draft' | 'pending' | 'synced';
  createdAt: string;
  lastModified: string;
}

export class OfflineBookingCache {
  private static instance: OfflineBookingCache;
  private cacheKey = 'marrakechdunes-offline-bookings';

  constructor() {
    this.initializeCache();
  }

  public static getInstance(): OfflineBookingCache {
    if (!OfflineBookingCache.instance) {
      OfflineBookingCache.instance = new OfflineBookingCache();
    }
    return OfflineBookingCache.instance;
  }

  private initializeCache(): void {
    // Initialize cache if it doesn't exist
    if (!this.getCache()) {
      this.setCache([]);
    }
  }

  private getCache(): OfflineBookingData[] {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error reading offline booking cache:', error);
      return [];
    }
  }

  private setCache(bookings: OfflineBookingData[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(bookings));
    } catch (error) {
      console.error('Error writing offline booking cache:', error);
    }
  }

  public saveDraftBooking(bookingData: Partial<OfflineBookingData>): string {
    const id = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const draftBooking: OfflineBookingData = {
      id,
      customerName: bookingData.customerName || '',
      customerPhone: bookingData.customerPhone || '',
      activityId: bookingData.activityId || '',
      activityName: bookingData.activityName || '',
      preferredDate: bookingData.preferredDate || '',
      numberOfPeople: bookingData.numberOfPeople || 1,
      totalAmount: bookingData.totalAmount || 0,
      paymentMethod: bookingData.paymentMethod || 'cash',
      notes: bookingData.notes || '',
      status: 'draft',
      createdAt: now,
      lastModified: now,
    };

    const cache = this.getCache();
    cache.push(draftBooking);
    this.setCache(cache);

    return id;
  }

  public updateDraftBooking(id: string, updates: Partial<OfflineBookingData>): boolean {
    const cache = this.getCache();
    const index = cache.findIndex(booking => booking.id === id);
    
    if (index === -1) return false;

    cache[index] = {
      ...cache[index],
      ...updates,
      lastModified: new Date().toISOString(),
    };

    this.setCache(cache);
    return true;
  }

  public getDraftBookings(): OfflineBookingData[] {
    return this.getCache().filter(booking => booking.status === 'draft');
  }

  public getPendingBookings(): OfflineBookingData[] {
    return this.getCache().filter(booking => booking.status === 'pending');
  }

  public getAllOfflineBookings(): OfflineBookingData[] {
    return this.getCache();
  }

  public deleteDraftBooking(id: string): boolean {
    const cache = this.getCache();
    const filtered = cache.filter(booking => booking.id !== id);
    
    if (filtered.length === cache.length) return false;
    
    this.setCache(filtered);
    return true;
  }

  public async syncPendingBookings(): Promise<void> {
    const pendingBookings = this.getPendingBookings();
    
    for (const booking of pendingBookings) {
      try {
        await this.syncBooking(booking);
      } catch (error) {
        console.error(`Failed to sync booking ${booking.id}:`, error);
      }
    }
  }

  private async syncBooking(booking: OfflineBookingData): Promise<void> {
    try {
      const response = await api.post('/bookings', {
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        activityId: booking.activityId,
        preferredDate: booking.preferredDate,
        numberOfPeople: booking.numberOfPeople,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        notes: booking.notes,
      });

      if (response.status === 201) {
        // Mark as synced
        this.updateDraftBooking(booking.id, { status: 'synced' });
        console.log(`Booking ${booking.id} synced successfully`);
      }
    } catch (error) {
      console.error(`Error syncing booking ${booking.id}:`, error);
      throw error;
    }
  }

  public async submitDraftBooking(id: string): Promise<boolean> {
    const cache = this.getCache();
    const booking = cache.find(b => b.id === id);
    
    if (!booking) return false;

    try {
      // Mark as pending
      this.updateDraftBooking(id, { status: 'pending' });
      
      // Try to sync immediately
      await this.syncBooking(booking);
      
      return true;
    } catch (error) {
      console.error('Error submitting draft booking:', error);
      return false;
    }
  }

  public clearSyncedBookings(): void {
    const cache = this.getCache();
    const filtered = cache.filter(booking => booking.status !== 'synced');
    this.setCache(filtered);
  }

  public getCacheSize(): number {
    return this.getCache().length;
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public setupOnlineSync(): void {
    window.addEventListener('online', () => {
      console.log('Connection restored, syncing pending bookings...');
      this.syncPendingBookings();
    });

    // Periodic sync attempt
    setInterval(() => {
      if (this.isOnline()) {
        this.syncPendingBookings();
      }
    }, 30000); // Every 30 seconds
  }
}

// Export singleton instance
export const offlineBookingCache = OfflineBookingCache.getInstance();

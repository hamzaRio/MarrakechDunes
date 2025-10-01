export interface WhatsAppPromoData {
  pwaLink: string;
  customerName?: string;
  activityName?: string;
  discountCode?: string;
}

export class WhatsAppPromoService {
  private static instance: WhatsAppPromoService;

  constructor() {}

  public static getInstance(): WhatsAppPromoService {
    if (!WhatsAppPromoService.instance) {
      WhatsAppPromoService.instance = new WhatsAppPromoService();
    }
    return WhatsAppPromoService.instance;
  }

  public generatePWAPromo(data: WhatsAppPromoData): string {
    const baseMessage = `📱 MarrakechDunes App – Offline booking, notifications, GPS & photo sharing.
Install: ${data.pwaLink}`;

    if (data.customerName) {
      return `Hi ${data.customerName}! ${baseMessage}`;
    }

    return baseMessage;
  }

  public generateActivityPromo(data: WhatsAppPromoData): string {
    if (!data.activityName) {
      return this.generatePWAPromo(data);
    }

    const baseMessage = `🌟 Discover ${data.activityName} with MarrakechDunes! 🌟

📱 Download our app for:
• Offline booking & notifications
• GPS meeting point navigation  
• Photo sharing & memories
• Real-time updates

Install: ${data.pwaLink}`;

    if (data.discountCode) {
      return `${baseMessage}

🎁 Use code ${data.discountCode} for 10% off your first booking!`;
    }

    return baseMessage;
  }

  public generateGroupPromo(data: WhatsAppPromoData): string {
    const baseMessage = `👥 Planning a group adventure? 

MarrakechDunes makes it easy:
• Group booking management
• Automatic group discounts
• Coordinated meeting points
• Shared photo galleries

📱 Get the app: ${data.pwaLink}`;

    if (data.discountCode) {
      return `${baseMessage}

🎁 Groups of 5+ get 15% off with code ${data.discountCode}`;
    }

    return baseMessage;
  }

  public generateSeasonalPromo(data: WhatsAppPromoData): string {
    const currentMonth = new Date().getMonth() + 1;
    let seasonalMessage = '';

    if (currentMonth >= 6 && currentMonth <= 8) {
      seasonalMessage = '☀️ Peak season adventures await!';
    } else if (currentMonth >= 4 && currentMonth <= 5 || currentMonth >= 9 && currentMonth <= 10) {
      seasonalMessage = '🌸 Perfect weather for outdoor adventures!';
    } else {
      seasonalMessage = '❄️ Cozy winter adventures available!';
    }

    return `${seasonalMessage}

📱 MarrakechDunes App:
• Offline booking & notifications
• GPS navigation & photo sharing
• Real-time weather updates
• Instant booking confirmations

Install: ${data.pwaLink}`;
  }

  public generateCustomPromo(template: string, data: WhatsAppPromoData): string {
    let message = template;
    
    // Replace placeholders
    message = message.replace(/\{pwaLink\}/g, data.pwaLink);
    message = message.replace(/\{customerName\}/g, data.customerName || 'Valued Customer');
    message = message.replace(/\{activityName\}/g, data.activityName || 'Amazing Activities');
    message = message.replace(/\{discountCode\}/g, data.discountCode || 'SAVE10');
    
    return message;
  }

  public shareToWhatsApp(message: string, phoneNumber?: string): string {
    const encodedMessage = encodeURIComponent(message);
    const phone = phoneNumber ? `&phone=${phoneNumber}` : '';
    
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }

  public shareToWhatsAppGroup(message: string, groupId?: string): string {
    const encodedMessage = encodeURIComponent(message);
    const group = groupId ? `&group=${groupId}` : '';
    
    return `https://wa.me/${group}?text=${encodedMessage}`;
  }

  public copyToClipboard(message: string): Promise<void> {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(message);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve();
    }
  }

  public getPromoTemplates(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'pwa',
        name: 'PWA App Promo',
        description: 'Basic app installation promotion'
      },
      {
        id: 'activity',
        name: 'Activity Promo',
        description: 'Promote specific activities with the app'
      },
      {
        id: 'group',
        name: 'Group Promo',
        description: 'Target group bookings and discounts'
      },
      {
        id: 'seasonal',
        name: 'Seasonal Promo',
        description: 'Season-based promotional messages'
      }
    ];
  }
}

// Export singleton instance
export const whatsappPromoService = WhatsAppPromoService.getInstance();

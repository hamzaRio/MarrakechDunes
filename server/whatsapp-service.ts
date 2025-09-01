// WhatsApp Business API Service for MarrakechDunes
// This service handles automated WhatsApp notifications to admins

export interface WhatsAppContact {
  name: string;
  phone: string;
  role: 'admin' | 'superadmin';
}

export interface BookingNotificationData {
  customerName: string;
  customerPhone: string;
  activityName: string;
  numberOfPeople: number;
  preferredDate?: Date;
  preferredTime?: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  bookingId: string;
}

export class WhatsAppService {
  private adminContacts: WhatsAppContact[];

  constructor() {
    // Read WhatsApp receivers from environment variable
    const receiversEnv = process.env.WHATSAPP_RECEIVERS || "212600623630,212693323368,212654497354";
    const receivers = receiversEnv.split(',').map(num => num.trim());
    
    // Map phone numbers to contacts with default names and roles
    this.adminContacts = [
      { name: "Ahmed", phone: `+${receivers[0] || "212600623630"}`, role: "admin" as const },
      { name: "Yahia", phone: `+${receivers[1] || "212693323368"}`, role: "admin" as const },
      { name: "Nadia", phone: `+${receivers[2] || "212654497354"}`, role: "superadmin" as const }
    ].filter(contact => contact.phone !== "+");
  }

  async sendBookingNotification(booking: BookingNotificationData): Promise<{
    success: boolean;
    recipients: WhatsAppContact[];
    message: string;
    whatsappLinks: Array<{name: string; phone: string; link: string}>;
    customerMessage?: string;
    customerWhatsappLink?: string;
  }> {
    const adminMessage = this.formatBookingMessage(booking);
    const customerMessage = this.formatCustomerConfirmation(booking);
    
    // Development: Log admin notifications
    if (process.env.NODE_ENV === 'development') {
      console.log('🏜️ SENDING WHATSAPP NOTIFICATIONS TO ALL ADMINS');
      console.log('================================================');
      
      this.adminContacts.forEach(admin => {
        console.log(`📱 Notification for ${admin.name} (${admin.role.toUpperCase()}) - ${admin.phone}:`);
        console.log(adminMessage);
        console.log('---');
      });

      console.log('📱 CUSTOMER CONFIRMATION MESSAGE:');
      console.log('=================================');
      console.log(`To: ${booking.customerPhone}`);
      console.log(customerMessage);
    }

    // Generate WhatsApp web links for immediate sending
    const whatsappLinks = this.adminContacts.map(admin => ({
      name: admin.name,
      phone: admin.phone,
      link: `https://wa.me/${admin.phone.replace('+', '')}?text=${encodeURIComponent(adminMessage)}`
    }));

    const customerWhatsappLink = `https://wa.me/${booking.customerPhone.replace('+', '')}?text=${encodeURIComponent(customerMessage)}`;

    return {
      success: true,
      recipients: this.adminContacts,
      message: adminMessage,
      whatsappLinks,
      customerMessage,
      customerWhatsappLink
    };
  }

  async sendPaymentConfirmation(booking: BookingNotificationData, paymentType: 'full' | 'deposit'): Promise<{
    success: boolean;
    message: string;
    whatsappLinks: Array<{name: string; phone: string; link: string}>;
  }> {
    const message = this.formatPaymentConfirmationMessage(booking, paymentType);
    
    console.log('💰 SENDING PAYMENT CONFIRMATION TO ALL ADMINS');
    console.log('==============================================');
    
    this.adminContacts.forEach(admin => {
      console.log(`📱 Payment notification for ${admin.name} - ${admin.phone}:`);
      console.log(message);
      console.log('---');
    });

    const whatsappLinks = this.adminContacts.map(admin => ({
      name: admin.name,
      phone: admin.phone,
      link: `https://wa.me/${admin.phone.replace('+', '')}?text=${encodeURIComponent(message)}`
    }));

    return {
      success: true,
      message,
      whatsappLinks
    };
  }

  private formatBookingMessage(booking: BookingNotificationData): string {
    const bookingDate = booking.preferredDate 
      ? new Date(booking.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'Non spécifiée';
    const totalAmount = `${booking.totalAmount} MAD`;
    
    // Extract participant names from notes or use customer name
    const participantNames = booking.notes?.includes('Participants:') 
      ? booking.notes.split('Participants:')[1].split('\n')[0].trim()
      : booking.customerName;
    
    return `📌 New Booking
Activity: ${booking.activityName}
Date: ${bookingDate}
People: ${booking.numberOfPeople}
Names: ${participantNames}
Phone: ${booking.customerPhone}
${booking.notes ? `Notes: ${booking.notes}` : ''}

💰 INFORMATIONS PAIEMENT:
• Méthode: ${this.getPaymentMethodText(booking.paymentMethod)}
• Statut: ${this.getPaymentStatusText(booking.paymentStatus)}
• Statut réservation: ${this.getBookingStatusText(booking.status)}

${booking.notes ? `📝 Notes spéciales: ${booking.notes}` : ''}

⏰ Réservation créée: ${new Date().toLocaleString('fr-FR')}

🎯 ACTION REQUISE:
1. Contactez le client rapidement
2. Confirmez la disponibilité 
3. Organisez le point de rendez-vous
4. Préparez l'expérience

📞 Contactez ${booking.customerName} au ${booking.customerPhone}`;
  }

  private formatCustomerConfirmation(booking: BookingNotificationData): string {
    const bookingDate = booking.preferredDate 
      ? new Date(booking.preferredDate).toLocaleDateString('fr-FR')
      : 'À confirmer';
    const bookingTime = booking.preferredTime || 'À confirmer';
    const totalAmount = `${booking.totalAmount} MAD`;
    
    return `🏜️ CONFIRMATION DE RÉSERVATION - MarrakechDunes

Bonjour ${booking.customerName},

✅ Votre réservation a été confirmée avec succès !

📋 DÉTAILS DE VOTRE RÉSERVATION:
• Activité: ${booking.activityName}
• Date: ${bookingDate}
• Heure: ${bookingTime}
• Nombre de personnes: ${booking.numberOfPeople}
• Montant total: ${totalAmount}
• ID de réservation: ${booking.bookingId}

💰 PAIEMENT:
• Mode de paiement: Espèces (sur place)
• Statut: ${this.getPaymentStatusText(booking.paymentStatus)}

📍 POINT DE RENDEZ-VOUS:
Nous vous contacterons sous peu pour confirmer le lieu et l'heure exacte de départ.

📞 CONTACT:
• Ahmed: +212600623630
• Yahia: +212693323368
• Nadia: +212654497354

🎯 PROCHAINES ÉTAPES:
1. Notre équipe vous contactera dans les 24h
2. Confirmation du point de rendez-vous
3. Instructions détaillées pour votre activité

Merci d'avoir choisi MarrakechDunes pour votre aventure marocaine !

L'équipe MarrakechDunes 🐪`;
  }

  private formatPaymentConfirmationMessage(booking: BookingNotificationData, paymentType: 'full' | 'deposit'): string {
    const paymentText = paymentType === 'full' ? 'PAIEMENT COMPLET' : 'ACOMPTE PAYÉ';
    const amount = paymentType === 'full' 
      ? `${booking.totalAmount} MAD (complet)`
      : `${Math.round(booking.totalAmount * 0.3)} MAD (acompte 30%)`;

    return `💰 ${paymentText} CONFIRMÉ - MarrakechDunes

📋 RÉSERVATION:
• ID: ${booking.bookingId}
• Client: ${booking.customerName}
• Activité: ${booking.activityName}
• Montant payé: ${amount}

✅ STATUT: Paiement confirmé en espèces
📅 Date: ${new Date().toLocaleString('fr-FR')}

${paymentType === 'deposit' ? `⚠️ SOLDE RESTANT: ${booking.totalAmount - Math.round(booking.totalAmount * 0.3)} MAD` : ''}

🎯 PROCHAINES ÉTAPES:
${paymentType === 'deposit' 
  ? '• Collecter le solde restant le jour J\n• Confirmer le point de rendez-vous\n• Préparer l\'activité' 
  : '• Confirmer le point de rendez-vous\n• Préparer l\'activité\n• Client entièrement payé'}

📞 Client: ${booking.customerPhone}`;
  }

  private getPaymentMethodText(method: string): string {
    switch (method) {
      case 'cash': return 'Espèces (paiement complet)';
      case 'cash_deposit': return 'Espèces (acompte)';
      default: return 'Espèces';
    }
  }

  private getPaymentStatusText(status: string): string {
    switch (status) {
      case 'unpaid': return '❌ Non payé';
      case 'deposit_paid': return '🟡 Acompte payé';
      case 'fully_paid': return '✅ Entièrement payé';
      default: return status;
    }
  }

  private getBookingStatusText(status: string): string {
    switch (status) {
      case 'pending': return '🟡 En attente';
      case 'confirmed': return '✅ Confirmée';
      case 'cancelled': return '❌ Annulée';
      default: return status;
    }
  }

  // Get direct WhatsApp links for manual sending
  getAdminWhatsAppLinks(message: string) {
    return this.adminContacts.map(admin => ({
      name: admin.name,
      phone: admin.phone,
      role: admin.role,
      link: `https://wa.me/${admin.phone.replace('+', '')}?text=${encodeURIComponent(message)}`
    }));
  }

  // Get admin contact information
  getAdminContacts(): WhatsAppContact[] {
    return this.adminContacts;
  }
}

export const whatsappService = new WhatsAppService();
import type { BookingType, ActivityType } from "@shared/schema";

interface WhatsAppContact {
  name: string;
  phone: string;
}

const whatsappContacts: WhatsAppContact[] = [
  { name: "Ahmed", phone: "+212600623630" },
  { name: "Yahia", phone: "+212693323368" },
  { name: "Nadia", phone: "+212654497354" },
];

export async function sendWhatsAppBooking(booking: BookingType, activity: ActivityType) {
  const message = `🌟 NEW BOOKING ALERT 🌟

Customer: ${booking.customerName}
Phone: ${booking.customerPhone}
Activity: ${activity.name}
Date: ${new Date(booking.preferredDate).toLocaleDateString()}
People: ${booking.numberOfPeople}
Total: ${booking.totalAmount} MAD

${booking.notes ? `Notes: ${booking.notes}` : ''}

Please contact the customer to confirm the booking!`;

  // Send to all contacts
  whatsappContacts.forEach(contact => {
    const whatsappUrl = `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
    // In a real implementation, you would use the WhatsApp Business API
    // For now, we'll just log the URL
    // Development: log WhatsApp URLs for testing
    if (import.meta.env.MODE === 'development') {
      console.log(`WhatsApp message for ${contact.name}:`, whatsappUrl);
    }
    
    // Open WhatsApp for the first contact as a demo
    if (contact.name === "Ahmed") {
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);
    }
  });
}

export function openWhatsAppChat(contactName: string, customMessage?: string) {
  const contact = whatsappContacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
  
  if (!contact) {
    console.error(`Contact ${contactName} not found`);
    return;
  }

  const defaultMessage = `Hello ${contact.name}, I'm interested in booking an activity with MarrakechDunes. Can you help me?`;
  const message = customMessage || defaultMessage;
  const whatsappUrl = `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
  
  window.open(whatsappUrl, '_blank');
}

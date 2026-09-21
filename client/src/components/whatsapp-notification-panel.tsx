import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MessageCircle, Phone, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getBookingDateOnly } from '@/lib/booking-utils';

interface WhatsAppContact {
  name: string;
  phone: string;
  role: 'admin' | 'superadmin';
}

interface WhatsAppNotificationPanelProps {
  booking?: any;
  message?: string;
  customerMessage?: string;
  customerPhone?: string;
  adminContacts?: WhatsAppContact[];
}

export function WhatsAppNotificationPanel({ 
  booking, 
  message, 
  customerMessage, 
  customerPhone,
  adminContacts = [
    { name: "Ahmed", phone: "+212600623630", role: "admin" },
    { name: "Yahia", phone: "+212693323368", role: "admin" },
    { name: "Nadia", phone: "+212654497354", role: "superadmin" }
  ]
}: WhatsAppNotificationPanelProps) {
  const { toast } = useToast();
  const [sentNotifications, setSentNotifications] = useState<string[]>([]);

  const handleSendWhatsApp = (phone: string, message: string, recipientName: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    
    setSentNotifications(prev => [...prev, phone]);
    toast({
      title: "WhatsApp ouvert",
      description: `Message prepare pour ${recipientName}`,
    });
  };

  const formatBookingMessage = (booking: any) => {
    if (!booking) return '';
    
    const bookingDate = booking.preferredDate
      ? getBookingDateOnly(booking.preferredDate)?.toLocaleDateString('fr-FR') || 'Non specifiee'
      : 'Non specifiee';
    const bookingTime = booking.preferredTime || 'Non specifiee';
    const totalAmount = `${booking.totalAmount} MAD`;
    
    return `NOUVELLE RESERVATION - MarrakechDunes

DETAILS DE LA RESERVATION:
- ID: ${booking._id || 'N/A'}
- Activite: ${booking.activityName || 'N/A'}
- Client: ${booking.customerName}
- Telephone: ${booking.customerPhone}
- Nombre de personnes: ${booking.numberOfPeople}
- Date souhaitee: ${bookingDate}
- Heure souhaitee: ${bookingTime}
- Montant total: ${totalAmount}

INFORMATIONS PAIEMENT:
- Methode: Especes
- Statut: En attente
- Statut reservation: En attente

${booking.notes ? `Notes speciales: ${booking.notes}` : ''}

Reservation creee: ${new Date().toLocaleString('fr-FR')}

ACTION REQUISE:
1. Contactez le client rapidement
2. Confirmez la disponibilite 
3. Organisez le point de rendez-vous
4. Preparez l'experience

Contactez ${booking.customerName} au ${booking.customerPhone}`;
  };

  const formatCustomerMessage = (booking: any) => {
    if (!booking) return '';
    
    const bookingDate = booking.preferredDate
      ? getBookingDateOnly(booking.preferredDate)?.toLocaleDateString('fr-FR') || 'A confirmer'
      : 'A confirmer';
    const bookingTime = booking.preferredTime || 'A confirmer';
    const totalAmount = `${booking.totalAmount} MAD`;
    
    return `CONFIRMATION DE RESERVATION - MarrakechDunes

Bonjour ${booking.customerName},

Votre reservation a ete confirmee avec succes !

DETAILS DE VOTRE RESERVATION:
- Activite: ${booking.activityName || 'N/A'}
- Date: ${bookingDate}
- Heure: ${bookingTime}
- Nombre de personnes: ${booking.numberOfPeople}
- Montant total: ${totalAmount}
- ID de reservation: ${booking._id || 'N/A'}

PAIEMENT:
- Mode de paiement: Especes (sur place)
- Statut: En attente

POINT DE RENDEZ-VOUS:
Nous vous contacterons sous peu pour confirmer le lieu et l'heure exacte de depart.

CONTACT:
- Ahmed: +212600623630
- Yahia: +212693323368
- Nadia: +212654497354

PROCHAINES ETAPES:
1. Notre equipe vous contactera dans les 24h
2. Confirmation du point de rendez-vous
3. Instructions detaillees pour votre activite

Merci d'avoir choisi MarrakechDunes pour votre aventure marocaine !

L'equipe MarrakechDunes`;
  };

  const adminMessage = message || formatBookingMessage(booking);
  const clientMessage = customerMessage || formatCustomerMessage(booking);

  return (
    <div className="space-y-6">
      {/* Admin Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-moroccan-red" />
            Notifications Administrateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {adminContacts.map((admin) => (
              <div key={admin.phone} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-moroccan-red" />
                  <div>
                    <div className="font-medium">{admin.name}</div>
                    <div className="text-sm text-gray-600">{admin.phone}</div>
                  </div>
                  <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                    {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant={sentNotifications.includes(admin.phone) ? 'outline' : 'default'}
                  onClick={() => handleSendWhatsApp(admin.phone, adminMessage, admin.name)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {sentNotifications.includes(admin.phone) ? 'Envoye' : 'Envoyer'}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Notification */}
      {customerPhone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-moroccan-red" />
              Confirmation Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-moroccan-red" />
                <div>
                  <div className="font-medium">{booking?.customerName || 'Client'}</div>
                  <div className="text-sm text-gray-600">{customerPhone}</div>
                </div>
                <Badge variant="outline">Client</Badge>
              </div>
              <Button
                size="sm"
                variant={sentNotifications.includes(customerPhone) ? 'outline' : 'default'}
                onClick={() => handleSendWhatsApp(customerPhone, clientMessage, booking?.customerName || 'Client')}
                className="bg-moroccan-blue hover:bg-blue-600 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {sentNotifications.includes(customerPhone) ? 'Envoye' : 'Confirmer'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                adminContacts.forEach(admin => {
                  handleSendWhatsApp(admin.phone, adminMessage, admin.name);
                });
              }}
              className="justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Envoyer a tous les admins
            </Button>
            {customerPhone && (
              <Button
                variant="outline"
                onClick={() => handleSendWhatsApp(customerPhone, clientMessage, booking?.customerName || 'Client')}
                className="justify-start"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Confirmer au client
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

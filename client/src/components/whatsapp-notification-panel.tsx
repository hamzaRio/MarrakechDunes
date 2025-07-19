import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MessageCircle, Phone, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      description: `Message préparé pour ${recipientName}`,
    });
  };

  const formatBookingMessage = (booking: any) => {
    if (!booking) return '';
    
    const bookingDate = booking.preferredDate 
      ? new Date(booking.preferredDate).toLocaleDateString('fr-FR')
      : 'Non spécifiée';
    const bookingTime = booking.preferredTime || 'Non spécifiée';
    const totalAmount = `${booking.totalAmount} MAD`;
    
    return `🏜️ NOUVELLE RÉSERVATION - MarrakechDunes

📋 DÉTAILS DE LA RÉSERVATION:
• ID: ${booking._id || 'N/A'}
• Activité: ${booking.activityName || 'N/A'}
• Client: ${booking.customerName}
• Téléphone: ${booking.customerPhone}
• Nombre de personnes: ${booking.numberOfPeople}
• Date souhaitée: ${bookingDate}
• Heure souhaitée: ${bookingTime}
• Montant total: ${totalAmount}

💰 INFORMATIONS PAIEMENT:
• Méthode: Espèces
• Statut: En attente
• Statut réservation: En attente

${booking.notes ? `📝 Notes spéciales: ${booking.notes}` : ''}

⏰ Réservation créée: ${new Date().toLocaleString('fr-FR')}

🎯 ACTION REQUISE:
1. Contactez le client rapidement
2. Confirmez la disponibilité 
3. Organisez le point de rendez-vous
4. Préparez l'expérience

📞 Contactez ${booking.customerName} au ${booking.customerPhone}`;
  };

  const formatCustomerMessage = (booking: any) => {
    if (!booking) return '';
    
    const bookingDate = booking.preferredDate 
      ? new Date(booking.preferredDate).toLocaleDateString('fr-FR')
      : 'À confirmer';
    const bookingTime = booking.preferredTime || 'À confirmer';
    const totalAmount = `${booking.totalAmount} MAD`;
    
    return `🏜️ CONFIRMATION DE RÉSERVATION - MarrakechDunes

Bonjour ${booking.customerName},

✅ Votre réservation a été confirmée avec succès !

📋 DÉTAILS DE VOTRE RÉSERVATION:
• Activité: ${booking.activityName || 'N/A'}
• Date: ${bookingDate}
• Heure: ${bookingTime}
• Nombre de personnes: ${booking.numberOfPeople}
• Montant total: ${totalAmount}
• ID de réservation: ${booking._id || 'N/A'}

💰 PAIEMENT:
• Mode de paiement: Espèces (sur place)
• Statut: En attente

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
                  {sentNotifications.includes(admin.phone) ? 'Envoyé' : 'Envoyer'}
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
                {sentNotifications.includes(customerPhone) ? 'Envoyé' : 'Confirmer'}
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
              Envoyer à tous les admins
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
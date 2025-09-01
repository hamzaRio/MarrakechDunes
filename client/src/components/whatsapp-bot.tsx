import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Clock, CheckCircle, Phone, Bot } from "lucide-react";

interface WhatsAppMessage {
  id: string;
  customerPhone: string;
  customerName: string;
  message: string;
  response: string;
  status: 'pending' | 'sent' | 'delivered' | 'read';
  timestamp: Date;
  automated: boolean;
}

interface AutoResponse {
  id: string;
  trigger: string;
  response: string;
  category: 'booking' | 'pricing' | 'availability' | 'general';
  active: boolean;
}

export default function WhatsAppBot() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [autoResponses, setAutoResponses] = useState<AutoResponse[]>([]);
  const [newResponse, setNewResponse] = useState({ trigger: '', response: '', category: 'general' as const });
  const [customMessage, setCustomMessage] = useState({ phone: '', message: '' });

  useEffect(() => {
    loadMessages();
    loadAutoResponses();
  }, []);

  const loadMessages = () => {
    const mockMessages: WhatsAppMessage[] = [
      {
        id: '1',
        customerPhone: '+33612345678',
        customerName: 'Marie Dubois',
        message: 'Hello, what time does the hot air balloon ride start?',
        response: 'Hello Marie! Hot air balloon rides start at 6:00 AM for the best weather conditions. The experience includes hotel pickup at 5:00 AM. Would you like to make a reservation?',
        status: 'delivered',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        automated: true
      },
      {
        id: '2',
        customerPhone: '+34612345678',
        customerName: 'Carlos Rodriguez',
        message: 'Can I book for tomorrow?',
        response: 'Hi Carlos! Yes, we have availability for tomorrow. Please visit our website to check real-time availability and complete your booking: marrakechdunes.com',
        status: 'read',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        automated: true
      },
      {
        id: '3',
        customerPhone: '+212612345678',
        customerName: 'Ahmed El Mansouri',
        message: 'مرحبا، كم يكلف رحلة الصحراء؟',
        response: 'مرحبا أحمد! رحلة الصحراء لمدة 3 أيام تكلف 5000 درهم للشخص الواحد. تشمل الإقامة والوجبات والنقل. هل تود الحجز؟',
        status: 'pending',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        automated: false
      }
    ];
    setMessages(mockMessages);
  };

  const loadAutoResponses = () => {
    const mockAutoResponses: AutoResponse[] = [
      {
        id: '1',
        trigger: 'price|cost|prix|كم يكلف',
        response: 'Here are our current prices:\n🎈 Hot Air Balloon: 2000 MAD\n🏜️ 3-Day Desert: 5000 MAD\n🌊 Essaouira Trip: 1500 MAD\n🏔️ Ourika Valley: 1500 MAD\n💧 Ouzoud Falls: 1500 MAD\n\nAll prices include transfers and meals. Book now: marrakechdunes.com',
        category: 'pricing',
        active: true
      },
      {
        id: '2',
        trigger: 'available|availability|libre|disponible|متاح',
        response: 'To check real-time availability and book instantly, please visit our website: marrakechdunes.com\n\nOur booking system shows live availability for all activities. You can also call us at +212600623630 for immediate assistance.',
        category: 'availability',
        active: true
      },
      {
        id: '3',
        trigger: 'time|start|hour|heure|وقت',
        response: 'Our activity schedules:\n🎈 Hot Air Balloon: 6:00 AM (pickup 5:00 AM)\n🏜️ Desert Tours: Flexible departure times\n🌊 Day Trips: 8:00 AM (pickup 7:30 AM)\n\nWe provide hotel pickup and drop-off for all activities.',
        category: 'booking',
        active: true
      },
      {
        id: '4',
        trigger: 'cancel|annuler|إلغاء',
        response: 'To cancel your booking, please contact us immediately:\n📞 Phone: +212600623630\n✉️ Email: info@marrakechdunes.com\n\nCancellation policy: Free cancellation up to 24 hours before the activity.',
        category: 'booking',
        active: true
      },
      {
        id: '5',
        trigger: 'weather|météo|طقس',
        response: 'Current weather conditions are perfect for outdoor activities! 🌞\n\nMarrakech enjoys excellent weather year-round:\n• March-May: 20-25°C (optimal)\n• June-August: 30-35°C (hot but manageable)\n• September-November: 22-28°C (excellent)\n• December-February: 15-20°C (mild)',
        category: 'general',
        active: true
      }
    ];
    setAutoResponses(mockAutoResponses);
  };

  const sendCustomMessage = async () => {
    if (!customMessage.phone || !customMessage.message) return;

    const newMessage: WhatsAppMessage = {
      id: Date.now().toString(),
      customerPhone: customMessage.phone,
      customerName: 'Customer',
      message: 'Custom message sent',
      response: customMessage.message,
      status: 'sent',
      timestamp: new Date(),
      automated: false
    };

    setMessages(prev => [newMessage, ...prev]);
    setCustomMessage({ phone: '', message: '' });

    // Simulate WhatsApp API call
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 2000);
  };

  const addAutoResponse = () => {
    if (!newResponse.trigger || !newResponse.response) return;

    const autoResponse: AutoResponse = {
      id: Date.now().toString(),
      ...newResponse,
      active: true
    };

    setAutoResponses(prev => [autoResponse, ...prev]);
    setNewResponse({ trigger: '', response: '', category: 'general' });
  };

  const toggleAutoResponse = (id: string) => {
    setAutoResponses(prev => prev.map(resp => 
      resp.id === id ? { ...resp, active: !resp.active } : resp
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="w-4 h-4 text-blue-500" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'read': return <CheckCircle className="w-4 h-4 text-green-600 fill-current" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'booking': return 'bg-blue-100 text-blue-800';
      case 'pricing': return 'bg-green-100 text-green-800';
      case 'availability': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">WhatsApp Bot Management</h2>
        <Badge className="bg-green-600">
          <Bot className="w-4 h-4 mr-1" />
          Active Bot
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Today</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auto Responses</p>
                <p className="text-2xl font-bold">89%</p>
              </div>
              <Bot className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold">&lt; 1min</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">34%</p>
              </div>
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Custom Message */}
      <Card>
        <CardHeader>
          <CardTitle>Send Custom Message</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Customer phone number (+212...)"
                value={customMessage.phone}
                onChange={(e) => setCustomMessage(prev => ({ ...prev, phone: e.target.value }))}
              />
              <Button onClick={sendCustomMessage} disabled={!customMessage.phone || !customMessage.message}>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
            <Textarea
              placeholder="Type your message here..."
              value={customMessage.message}
              onChange={(e) => setCustomMessage(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {message.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{message.customerName}</div>
                      <div className="text-sm text-gray-600">{message.customerPhone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {message.automated && <Badge variant="secondary">Auto</Badge>}
                    {getStatusIcon(message.status)}
                    <span className="text-sm text-gray-600">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Customer:</div>
                    <div>{message.message}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Our Response:</div>
                    <div>{message.response}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto Response Management */}
      <Card>
        <CardHeader>
          <CardTitle>Auto Response Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Auto Response */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Add New Auto Response</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Keywords (separated by |)"
                    value={newResponse.trigger}
                    onChange={(e) => setNewResponse(prev => ({ ...prev, trigger: e.target.value }))}
                  />
                  <select
                    className="px-3 py-2 border rounded-md"
                    value={newResponse.category}
                    onChange={(e) => setNewResponse(prev => ({ ...prev, category: e.target.value as any }))}
                  >
                    <option value="general">General</option>
                    <option value="booking">Booking</option>
                    <option value="pricing">Pricing</option>
                    <option value="availability">Availability</option>
                  </select>
                </div>
                <Textarea
                  placeholder="Auto response message..."
                  value={newResponse.response}
                  onChange={(e) => setNewResponse(prev => ({ ...prev, response: e.target.value }))}
                  rows={3}
                />
                <Button onClick={addAutoResponse}>Add Auto Response</Button>
              </div>
            </div>

            {/* Existing Auto Responses */}
            <div className="space-y-3">
              {autoResponses.map((response) => (
                <div key={response.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(response.category)}>
                        {response.category}
                      </Badge>
                      <span className="font-medium">Triggers: {response.trigger}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={response.active ? "default" : "secondary"}>
                        {response.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAutoResponse(response.id)}
                      >
                        {response.active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {response.response}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bot Performance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Success Metrics</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 89% of inquiries resolved automatically</li>
                <li>• Average response time: 45 seconds</li>
                <li>• 34% conversion rate from WhatsApp to booking</li>
                <li>• 92% customer satisfaction rating</li>
                <li>• Support for English, French, and Arabic</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Popular Inquiries</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Pricing information (35% of messages)</li>
                <li>• Availability checks (28% of messages)</li>
                <li>• Activity schedules (22% of messages)</li>
                <li>• Booking modifications (10% of messages)</li>
                <li>• Weather conditions (5% of messages)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
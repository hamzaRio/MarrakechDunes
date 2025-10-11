import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-utils';

interface EmailModalProps {
  customerEmail?: string;
  customerName?: string;
  bookingId?: string;
  trigger?: React.ReactNode;
}

export default function EmailModal({ 
  customerEmail = '', 
  customerName = '', 
  bookingId,
  trigger 
}: EmailModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerEmail: customerEmail,
    customerName: customerName,
    subject: '',
    message: ''
  });
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiFetch('/api/notifications/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          bookingId
        })
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Email has been sent successfully to the customer.",
      });
      setIsOpen(false);
      setFormData({
        customerEmail: '',
        customerName: '',
        subject: '',
        message: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerEmail || !formData.customerName || !formData.subject || !formData.message) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white shadow-xl rounded-lg border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Mail className="h-5 w-5" />
            Send Email to Customer
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Send a personalized email message to the customer.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName" className="text-gray-700 font-medium">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter customer name"
                className="bg-white border-gray-300 text-gray-900"
                required
              />
            </div>
            <div>
              <Label htmlFor="customerEmail" className="text-gray-700 font-medium">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter customer email"
                className="bg-white border-gray-300 text-gray-900"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="subject" className="text-gray-700 font-medium">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Enter email subject"
              className="bg-white border-gray-300 text-gray-900"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="message" className="text-gray-700 font-medium">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Enter your message to the customer..."
              rows={6}
              className="bg-white border-gray-300 text-gray-900"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 bg-white">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={sendEmailMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

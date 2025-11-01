/**
 * Customer Message Input Component
 * Allows admins to manually enter customer messages to trigger auto-responses
 * FREE MODE: For testing and manual message handling
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, TestTube } from "lucide-react";

export default function CustomerMessageInput() {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [customerName, setCustomerName] = useState("");

  const testMutation = useMutation({
    mutationFn: async (data: { phone: string; message: string; name?: string }) => {
      const response = await api.post('/auto-response/test', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Auto-Response Generated",
        description: `Confidence: ${Math.round(data.confidence * 100)}%. Check notification queue to send.`,
      });
      setMessage(""); // Clear message after testing
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate auto-response",
        variant: "destructive",
      });
    },
  });

  const handleTest = () => {
    if (!phone || !message) {
      toast({
        title: "Missing Information",
        description: "Please enter phone number and message",
        variant: "destructive",
      });
      return;
    }
    testMutation.mutate({ phone, message, name: customerName });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Auto-Response
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Enter a customer message to see the auto-generated response. The response will be added to the notification queue.
        </div>
        
        <div>
          <Label htmlFor="customerPhone">Customer Phone</Label>
          <Input
            id="customerPhone"
            type="tel"
            placeholder="+212600000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="customerName">Customer Name (Optional)</Label>
          <Input
            id="customerName"
            type="text"
            placeholder="John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="customerMessage">Customer Message</Label>
          <Textarea
            id="customerMessage"
            placeholder="E.g., 'When is my activity?' or 'Can I cancel my booking?'"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <Button
          onClick={handleTest}
          disabled={testMutation.isPending || !phone || !message}
          className="w-full"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          {testMutation.isPending ? "Generating..." : "Generate Auto-Response"}
        </Button>

        {testMutation.data && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">Generated Response:</p>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{testMutation.data.autoResponse}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-blue-600">
                Confidence: {Math.round(testMutation.data.confidence * 100)}%
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(testMutation.data.whatsappLink, '_blank')}
                className="text-xs"
              >
                <Send className="h-3 w-3 mr-1" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


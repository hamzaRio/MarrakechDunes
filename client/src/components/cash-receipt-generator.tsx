import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Receipt, 
  Download, 
  Print, 
  QrCode,
  MapPin,
  Phone,
  Calendar,
  User,
  Banknote,
  CheckCircle,
  Building
} from "lucide-react";
import type { BookingType, ActivityType } from "@shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

interface CashReceiptGeneratorProps {
  booking: BookingWithActivity;
  onClose: () => void;
}

export default function CashReceiptGenerator({ booking, onClose }: CashReceiptGeneratorProps) {
  const [receiptNumber, setReceiptNumber] = useState<string>(`RCP-${Date.now()}`);
  const [cashierName, setCashierName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [amountReceived, setAmountReceived] = useState<number>(parseInt(booking.totalAmount));
  const [change, setChange] = useState<number>(0);

  const totalAmount = parseInt(booking.totalAmount);
  const paidAmount = booking.paidAmount || 0;
  const balanceDue = totalAmount - paidAmount;

  const generateReceipt = () => {
    const receiptContent = `
🏜️ MARRAKECH DUNES - CASH RECEIPT 🏜️
═══════════════════════════════════════

Receipt #: ${receiptNumber}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Cashier: ${cashierName || 'N/A'}

═══════════════════════════════════════
CUSTOMER INFORMATION
═══════════════════════════════════════
Name: ${booking.customerName}
Phone: ${booking.customerPhone}
Email: ${booking.customerEmail || 'N/A'}

═══════════════════════════════════════
BOOKING DETAILS
═══════════════════════════════════════
Activity: ${booking.activity.name}
Category: ${booking.activity.category}
Date: ${new Date(booking.preferredDate).toLocaleDateString()}
Participants: ${booking.numberOfPeople} people
Duration: ${booking.activity.duration}

═══════════════════════════════════════
PAYMENT INFORMATION
═══════════════════════════════════════
Total Amount: ${totalAmount} MAD
Paid Amount: ${paidAmount} MAD
Balance Due: ${balanceDue} MAD

Payment Method: ${paymentMethod.toUpperCase()}
Amount Received: ${amountReceived} MAD
Change Given: ${change} MAD

Payment Status: ${booking.paymentStatus.toUpperCase()}

═══════════════════════════════════════
CONTACT INFORMATION
═══════════════════════════════════════
📍 Address: 54 Riad Zitoun Lakdim, Marrakech 40000
📞 Phone: +212 600 623 630
📧 Email: info@marrakechdunes.com
🌐 Website: www.marrakechdunes.com

═══════════════════════════════════════
IMPORTANT NOTES
═══════════════════════════════════════
• Please arrive 15 minutes before scheduled time
• Bring this receipt for verification
• Cash payments only - no cards accepted
• All prices include taxes and fees
• Cancellation policy: 24 hours notice required

Thank you for choosing MarrakechDunes!
We look forward to providing you with an
unforgettable Moroccan adventure! 🐪

═══════════════════════════════════════
Generated on: ${new Date().toLocaleString()}
    `.trim();

    return receiptContent;
  };

  const downloadReceipt = () => {
    const receiptContent = generateReceipt();
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptNumber}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReceipt = () => {
    const receiptContent = generateReceipt();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Cash Receipt - ${receiptNumber}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.4;
                margin: 20px;
                white-space: pre-line;
              }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center bg-moroccan-blue text-white">
          <CardTitle className="flex items-center justify-center gap-2">
            <Receipt className="w-6 h-6" />
            Cash Receipt Generator
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Receipt Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-moroccan-blue">Receipt Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  id="receiptNumber"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cashierName">Cashier Name</Label>
                <Input
                  id="cashierName"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Enter cashier name"
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-moroccan-blue">Payment Details</h3>
            
            <div className="bg-moroccan-sand/20 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">{totalAmount} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount:</span>
                <span className="font-bold text-green-600">{paidAmount} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Balance Due:</span>
                <span className="font-bold text-orange-600">{balanceDue} MAD</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amountReceived">Amount Received</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  value={amountReceived}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    setAmountReceived(amount);
                    setChange(amount - balanceDue);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="change">Change Given</Label>
                <Input
                  id="change"
                  type="number"
                  value={change}
                  onChange={(e) => setChange(parseFloat(e.target.value) || 0)}
                  className={change < 0 ? 'border-red-500' : ''}
                />
                {change < 0 && (
                  <p className="text-xs text-red-500 mt-1">Insufficient payment</p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-moroccan-blue">Booking Summary</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-medium">{booking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Activity:</span>
                <span className="font-medium">{booking.activity.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{new Date(booking.preferredDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Participants:</span>
                <span className="font-medium">{booking.numberOfPeople} people</span>
              </div>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-moroccan-blue">Receipt Preview</h3>
            
            <div className="bg-white border-2 border-gray-200 p-4 rounded-lg">
              <div className="text-center mb-4">
                <h4 className="font-bold text-lg">🏜️ MARRAKECH DUNES 🏜️</h4>
                <p className="text-sm text-gray-600">Cash Receipt #{receiptNumber}</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{booking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Activity:</span>
                  <span>{booking.activity.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span>{totalAmount} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Received:</span>
                  <span>{amountReceived} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>{change} MAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={downloadReceipt}
              className="flex-1 bg-moroccan-blue hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              onClick={printReceipt}
              className="flex-1 bg-moroccan-red hover:bg-red-600 text-white"
            >
              <Print className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This receipt serves as proof of cash payment for your MarrakechDunes booking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

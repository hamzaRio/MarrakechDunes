import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Shield, Clock, CheckCircle, AlertCircle } from "lucide-react";

// Deposit payment schema
const depositPaymentSchema = z.object({
  paymentMethod: z.enum(['cash_on_arrival', 'deposit_secure']),
  depositAmount: z.number().min(100, "Minimum deposit is 100 MAD").optional(),
  customerName: z.string().min(2, "Name is required"),
  customerPhone: z.string().min(8, "Phone number is required"),
  customerEmail: z.string().email("Valid email required").optional().or(z.literal('')),
});

type DepositPaymentData = z.infer<typeof depositPaymentSchema>;

interface DepositPaymentProps {
  activity: {
    _id: string;
    name: string;
    price: number;
    description: string;
  };
  numberOfPeople: number;
  onConfirm: (data: DepositPaymentData) => void;
  onCancel: () => void;
}

export default function DepositPaymentSystem({
  activity,
  numberOfPeople,
  onConfirm,
  onCancel
}: DepositPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash_on_arrival' | 'deposit_secure'>('cash_on_arrival');
  
  const totalAmount = activity.price * numberOfPeople;
  const depositAmount = Math.max(100, Math.round(totalAmount * 0.3)); // 30% or minimum 100 MAD
  const remainingAmount = totalAmount - depositAmount;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<DepositPaymentData>({
    resolver: zodResolver(depositPaymentSchema),
    defaultValues: {
      paymentMethod: 'cash_on_arrival',
      depositAmount: depositAmount
    }
  });

  const onSubmit = (data: DepositPaymentData) => {
    onConfirm(data);
  };

  const paymentMethods = [
    {
      id: 'cash_on_arrival',
      title: 'Pay Full Amount on Arrival',
      description: 'Pay the complete amount when you arrive at the meeting point',
      amount: totalAmount,
      icon: <Banknote className="w-6 h-6" />,
      color: 'bg-blue-50 border-blue-200',
      badge: 'Most Popular',
      badgeColor: 'bg-blue-100 text-blue-800',
      benefits: [
        'No upfront payment required',
        'Pay only when you arrive',
        'Full refund if cancelled 24h before'
      ]
    },
    {
      id: 'deposit_secure',
      title: 'Secure with Deposit',
      description: `Pay ${depositAmount} MAD now to secure your booking, balance on arrival`,
      amount: depositAmount,
      remainingAmount: remainingAmount,
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-orange-50 border-orange-200',
      badge: 'Recommended',
      badgeColor: 'bg-orange-100 text-orange-800',
      benefits: [
        'Guarantees your booking',
        'Reduces no-show risk',
        'Better availability priority',
        'Partial payment protection'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Payment Method</h2>
        <p className="text-gray-600">Select how you'd like to pay for your {activity.name} experience</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Payment Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedMethod === method.id
                  ? `${method.color} border-current`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod(method.id as any)}
            >
              <input
                type="radio"
                {...register('paymentMethod')}
                value={method.id}
                className="sr-only"
              />
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${method.color}`}>
                  {method.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{method.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${method.badgeColor}`}>
                      {method.badge}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{method.description}</p>
                  
                  <div className="space-y-2">
                    {method.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {method.id === 'deposit_secure' ? 'Deposit Amount:' : 'Total Amount:'}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {method.amount} MAD
                  </span>
                </div>
                
                {method.id === 'deposit_secure' && method.remainingAmount && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Balance on arrival:</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {method.remainingAmount} MAD
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Customer Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                {...register('customerName', { required: 'Name is required' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Your full name"
              />
              {errors.customerName && (
                <p className="text-red-500 text-sm mt-1">{errors.customerName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                {...register('customerPhone', { required: 'Phone number is required' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="+212 6XX XXX XXX"
              />
              {errors.customerPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.customerPhone.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address (Optional)
            </label>
            <input
              type="email"
              {...register('customerEmail')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="your.email@example.com"
            />
            {errors.customerEmail && (
              <p className="text-red-500 text-sm mt-1">{errors.customerEmail.message}</p>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{activity.name}</span>
              <span className="font-medium">{activity.price} MAD × {numberOfPeople}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{totalAmount} MAD</span>
            </div>
            
            {selectedMethod === 'deposit_secure' && (
              <>
                <div className="border-t border-orange-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-orange-700 font-medium">Deposit (30%)</span>
                    <span className="text-orange-700 font-bold">{depositAmount} MAD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance on arrival</span>
                    <span className="font-medium">{remainingAmount} MAD</span>
                  </div>
                </div>
              </>
            )}
            
            <div className="border-t border-orange-200 pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>
                  {selectedMethod === 'deposit_secure' ? 'Pay Now:' : 'Pay on Arrival:'}
                </span>
                <span className="text-orange-600">
                  {selectedMethod === 'deposit_secure' ? depositAmount : totalAmount} MAD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
          >
            {selectedMethod === 'deposit_secure' 
              ? `Pay ${depositAmount} MAD Deposit` 
              : `Confirm Booking (Pay ${totalAmount} MAD on Arrival)`
            }
          </button>
        </div>
      </form>
    </div>
  );
}

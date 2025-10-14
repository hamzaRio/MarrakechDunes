import { useState, useMemo, useId } from 'react';
import axios from '@/lib/api';
// import { PaymentType } from 'marrakechdunes-shared/types/finance';
enum PaymentType {
  CASH = 'CASH',
  DEPOSIT = 'DEPOSIT',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
  OTHER = 'OTHER',
}
import { toast } from 'sonner';

type Props = {
  bookingId: string;
  totalAmount: number;
  initialPaidAmount: number;
  onClose: () => void;
  onUpdated: (payment: any) => void;
};

const paymentOptions: { label: string; value: PaymentType }[] = [
  { label: 'Espèces (Cash)', value: PaymentType.CASH },
];

export default function PaymentModal({
  bookingId,
  totalAmount,
  initialPaidAmount,
  onClose,
  onUpdated,
}: Props) {
  const [type, setType] = useState<PaymentType>(PaymentType.CASH);
  const [paidAmount, setPaidAmount] = useState<number>(initialPaidAmount || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  const descId = useId();

  const remaining = useMemo(
    () => Math.max(0, totalAmount - (paidAmount || 0)),
    [totalAmount, paidAmount],
  );

  const updatePayment = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      console.log('Updating payment:', { bookingId, type, paidAmount });
      await axios.post(`/api/bookings/${bookingId}/payment`, { type, paidAmount });
      toast.success('Paiement mis à jour avec succès');
      const { data } = await axios.get(`/api/bookings/${bookingId}`);
      onUpdated(data.payment);
      onClose();
    } catch (error) {
      console.error('Payment update error:', error);
      toast.error('Erreur lors de la mise à jour du paiement');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-describedby={descId} className="p-4">
      <h3 className="text-xl font-semibold">Mettre à Jour le Statut de Paiement</h3>
      <p id={descId} className="text-sm text-muted-foreground">
        Modifiez le type et le montant payé pour cette réservation.
      </p>

      <div className="mt-4 space-y-1">
        <div className="flex justify-between"><span>Total:</span><span className="font-medium">{totalAmount} MAD</span></div>
        <div className="flex justify-between text-green-600"><span>Payé:</span><span className="font-medium">{Math.min(paidAmount,totalAmount)} MAD</span></div>
        <div className="flex justify-between text-red-600"><span>Restant:</span><span className="font-medium">{remaining} MAD</span></div>
      </div>

      <label className="block mt-4 text-sm font-medium">Type de Paiement</label>
      <select
        value={type}
        onChange={(e) => {
          const newType = e.target.value as PaymentType;
          console.log('Payment type changed:', newType);
          setType(newType);
        }}
        className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
      >
        {paymentOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <label className="block mt-3 text-sm font-medium">Montant Payé (MAD)</label>
      <input
        type="number"
        min={0}
        max={totalAmount}
        step={10}
        value={paidAmount}
        onChange={(e) => setPaidAmount(Number(e.target.value || 0))}
        className="w-full rounded-md border p-2"
      />

      <div className="mt-5 flex gap-2 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-md border" disabled={isUpdating}>
          Annuler
        </button>
        <button 
          onClick={updatePayment} 
          className="px-4 py-2 rounded-md bg-red-600 text-white disabled:opacity-50" 
          disabled={isUpdating}
        >
          {isUpdating ? 'Mise à jour...' : 'Mettre à Jour le Paiement'}
        </button>
      </div>
    </div>
  );
}

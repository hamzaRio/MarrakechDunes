export enum PaymentType {
  CASH = 'CASH',
  DEPOSIT = 'DEPOSIT',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  DEPOSIT_PAID = 'DEPOSIT_PAID',
  FULLY_PAID = 'FULLY_PAID',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export type PaymentUpdatePayload = {
  type: PaymentType;
  paidAmount: number;
};

import mongoose from 'mongoose';

export const SUPPORTED_GYG_CURRENCIES = ['MAD', 'EUR', 'USD', 'GBP'] as const;
export type SupportedGYGCurrency = typeof SUPPORTED_GYG_CURRENCIES[number];

const GYGComparableSchema = new mongoose.Schema({
  ourActivityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  url: { type: String, required: true, trim: true },
  normalizedUrl: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, enum: SUPPORTED_GYG_CURRENCIES },
  normalizedMadPrice: { type: Number, default: null, min: 0 },
  conversionRate: { type: Number, default: null, min: 0 },
  conversionRateSource: { type: String, default: null },
  conversionRateVerifiedAt: { type: Date, default: null },
  rating: { type: Number, min: 0, max: 5, default: null },
  reviewCount: { type: Number, min: 0, default: null },
  duration: { type: String, default: null },
  notes: { type: String, default: null },
  source: { type: String, default: 'manual_verified', immutable: true },
  sourceType: { type: String, default: 'MANUAL_VERIFIED', immutable: true },
  verified: { type: Boolean, default: true, immutable: true },
  createdBy: { type: String, required: true },
  verifiedAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

GYGComparableSchema.index({ ourActivityId: 1, normalizedUrl: 1 }, { unique: true });

export default mongoose.model('GYGComparable', GYGComparableSchema);

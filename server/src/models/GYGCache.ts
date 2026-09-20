import mongoose from "mongoose";

export interface GYGCacheDocument extends mongoose.Document {
  query: string;
  normalizedQuery: string;
  results: any[];
  source?: string;
  ourActivityId?: mongoose.Types.ObjectId;
  sourceType?: string;
  verified?: boolean;
  stale?: boolean;
  fetchedAt?: Date;
  resultCount: number;
  searchTime: number;
  lastFetched: Date;
  expiresAt: Date;
}

// Flexible, additive schema for normalized comparison offers. `strict: false`
// preserves legacy cache entries and provider-specific fields during the
// transition, while the explicit fields define the trusted comparison model.
const GYGOfferSchema = new mongoose.Schema({
  id: String,
  ourActivityId: mongoose.Schema.Types.ObjectId,
  matchedExternalId: String,
  matchedUrl: String,
  title: String,
  price: Number,
  currency: String,
  originalPrice: Number,
  originalCurrency: String,
  rating: Number,
  reviewCount: Number,
  duration: String,
  location: String,
  url: String,
  sourceType: String,
  verified: Boolean,
  stale: Boolean,
  fetchedAt: Date,
  expiresAt: Date,
  matchScore: Number,
  matchReasons: [String],
  validationState: String,
}, { _id: false, strict: false });

const GYGCacheSchema = new mongoose.Schema({
  query: { 
    type: String, 
    required: true,
    trim: true
  },
  normalizedQuery: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  results: {
    type: [GYGOfferSchema],
    default: [] 
  },
  source: {
    type: String,
    default: 'live'
  },
  ourActivityId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
  sourceType: { type: String, default: 'LEGACY_UNVERIFIED', index: true },
  verified: { type: Boolean, default: false },
  stale: { type: Boolean, default: false },
  fetchedAt: { type: Date, required: false },
  resultCount: {
    type: Number,
    required: true,
    default: 0
  },
  searchTime: {
    type: Number,
    required: true,
    default: 0
  },
  lastFetched: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, {
  timestamps: true
});

// Compound indexes for better performance
GYGCacheSchema.index({ normalizedQuery: 1, source: 1 });
GYGCacheSchema.index({ lastFetched: -1 });
GYGCacheSchema.index({ resultCount: -1 });

// Create TTL index for automatic cleanup
GYGCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to normalize query
GYGCacheSchema.pre('save', function(this: GYGCacheDocument, next) {
  if (this.isModified('query')) {
    this.normalizedQuery = this.query.toLowerCase().trim();
  }
  if (this.isModified('results')) {
    this.resultCount = this.results.length;
  }
  next();
});

export default mongoose.model<GYGCacheDocument>("GYGCache", GYGCacheSchema);

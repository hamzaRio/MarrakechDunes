import mongoose from "mongoose";

export interface GYGCacheDocument extends mongoose.Document {
  query: string;
  normalizedQuery: string;
  results: any[];
  source: 'live' | 'cache' | 'fallback';
  resultCount: number;
  searchTime: number;
  lastFetched: Date;
  expiresAt: Date;
}

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
    type: Array, 
    default: [] 
  },
  source: {
    type: String,
    enum: ['live', 'cache', 'fallback'],
    default: 'live'
  },
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

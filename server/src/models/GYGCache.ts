import mongoose from "mongoose";

const GYGCacheSchema = new mongoose.Schema({
  query: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  results: { 
    type: Array, 
    default: [] 
  },
  lastFetched: { 
    type: Date, 
    default: Date.now 
  },
  source: {
    type: String,
    enum: ['live', 'cache'],
    default: 'live'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, {
  timestamps: true
});

// Create TTL index for automatic cleanup
GYGCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("GYGCache", GYGCacheSchema);

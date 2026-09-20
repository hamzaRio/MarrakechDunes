import mongoose from 'mongoose';
import type { ManualOverrideDecision } from '../services/gyg-matching.js';

/**
 * Persisted superadmin decision on a single (our activity, GYG candidate)
 * comparability pair. Deliberately a separate, non-TTL collection from
 * GYGCache: cache entries expire and get recomputed automatically, but a
 * human decision here must survive that recomputation until a human changes
 * it again. Automatic rematching only ever recomputes `validationState` on
 * a cache entry — it must never write to this collection.
 */
export interface GYGMatchOverrideDocument extends mongoose.Document {
  ourActivityId: mongoose.Types.ObjectId;
  matchedExternalId: string;
  decision: ManualOverrideDecision;
  overriddenBy: string;
  overriddenByRole: string;
  overriddenAt: Date;
  // Snapshot of the automatic assessment at override time, kept purely for
  // audit/observability so staff can see what a human overrode and why.
  automaticValidationState?: string;
  automaticMatchScore?: number;
  note?: string;
}

const GYGMatchOverrideSchema = new mongoose.Schema<GYGMatchOverrideDocument>(
  {
    ourActivityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    matchedExternalId: { type: String, required: true },
    decision: { type: String, enum: ['ACCEPTED', 'REJECTED'], required: true },
    overriddenBy: { type: String, required: true },
    overriddenByRole: { type: String, required: true },
    overriddenAt: { type: Date, default: Date.now },
    automaticValidationState: { type: String },
    automaticMatchScore: { type: Number },
    note: { type: String },
  },
  { timestamps: true },
);

// One decision per (our activity, candidate) pair; a later ACCEPT/REJECT
// call updates this document in place rather than creating a duplicate.
GYGMatchOverrideSchema.index({ ourActivityId: 1, matchedExternalId: 1 }, { unique: true });

export default mongoose.model<GYGMatchOverrideDocument>('GYGMatchOverride', GYGMatchOverrideSchema);

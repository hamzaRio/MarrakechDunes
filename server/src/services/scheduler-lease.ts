import mongoose from 'mongoose';

const leaseSchema = new mongoose.Schema({ name: { type: String, unique: true }, owner: String, expiresAt: Date }, { collection: 'runtime_leases' });
const Lease = mongoose.models.RuntimeLease ?? mongoose.model('RuntimeLease', leaseSchema);

export async function initializeSchedulerLeaseIndexes(): Promise<void> { await Lease.init(); }

export async function acquireSchedulerLease(name: string, owner: string, now = new Date(), leaseMs = 55 * 60 * 1000): Promise<boolean> {
  try {
    const result: any = await Lease.findOneAndUpdate(
      { name, $or: [{ expiresAt: { $lte: now } }, { expiresAt: { $exists: false } }] },
      { $set: { owner, expiresAt: new Date(now.getTime() + leaseMs) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return result?.owner === owner;
  } catch (error: any) {
    if (error?.code === 11000) return false;
    throw error;
  }
}
export async function releaseSchedulerLease(name: string, owner: string): Promise<void> { await Lease.deleteOne({ name, owner }); }
export function schedulerOwner(): string { return `${process.pid}:${Math.random().toString(36).slice(2, 10)}`; }

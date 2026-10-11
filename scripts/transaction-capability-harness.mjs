import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { assertTransactionCapability } from '../server/dist/db.js';

const mongo = await MongoMemoryServer.create();
try {
  await mongoose.connect(mongo.getUri('standalone_capability_test'));
  let rejected = false;
  try { await assertTransactionCapability(); } catch (error) { rejected = /replica set|sharded/i.test(String(error?.message)); }
  if (!rejected) throw new Error('standalone MongoDB was not rejected by transaction capability validation');
  console.log('[transaction-capability] standalone fail-fast validation: PASS');
} finally {
  await mongoose.disconnect();
  await mongo.stop();
}

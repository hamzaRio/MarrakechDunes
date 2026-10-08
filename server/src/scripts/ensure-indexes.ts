// M10: explicit index management.
//
// Production connections no longer pass autoIndex:true (see src/db.ts) -
// building ~30 indexes implicitly on every server boot is a write-lock and
// latency cost that only makes sense for a small/dev database. Run this
// script instead, as a deliberate step during deploy or after a schema
// change:
//
//   npm run db:ensure-indexes --prefix server
//
// It connects using the same DATABASE_URL as the server, imports the
// schema/model definitions from storage.ts (which registers every
// collection's indexes with Mongoose), and calls createIndexes() on each
// registered model so any index declared in code but missing in the
// database gets created. It does not drop indexes that exist in the
// database but not in code - review `db.collection.getIndexes()` yourself
// before removing anything by hand.
import mongoose from 'mongoose';
import { resolveDatabaseUrl, getRedactedDatabaseUrl } from '../utils/database-url.js';

async function main() {
  const databaseUrl = resolveDatabaseUrl();
  console.log(`[ensure-indexes] Connecting to ${getRedactedDatabaseUrl(databaseUrl)}`);
  await mongoose.connect(databaseUrl, { autoIndex: false, autoCreate: true });

  // Importing storage.ts registers all mongoose.model() schemas/indexes
  // as a side effect, without needing it to export them.
  await import('../storage.js');

  const modelNames = mongoose.modelNames();
  console.log(`[ensure-indexes] Models registered: ${modelNames.join(', ')}`);

  for (const name of modelNames) {
    const model = mongoose.model(name);
    console.log(`[ensure-indexes] Creating indexes for ${name}...`);
    await model.createIndexes();
  }

  console.log('[ensure-indexes] Done.');
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('[ensure-indexes] Failed:', error);
  process.exitCode = 1;
});

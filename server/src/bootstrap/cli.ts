import dotenvFlow from 'dotenv-flow';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { bootstrapFirstSuperadmin } from './bootstrap-policy.js';
import { resolveDatabaseUrl } from '../utils/database-url.js';

// This command is deliberately separate from API startup. Deployment-provided
// environment variables take precedence over the server-root local files.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenvFlow.config({ path: path.resolve(serverRoot, '..'), silent: true });
dotenvFlow.config({ path: serverRoot, silent: true });

const { storage } = await import('../storage.js');

try {
  await mongoose.connect(resolveDatabaseUrl(), { serverSelectionTimeoutMS: 5000 });
  const result = await bootstrapFirstSuperadmin({
    getState: () => storage.getStaffBootstrapState(),
    createSuperadmin: async (username, password) => {
      // createUser is the existing persistence boundary that hashes once.
      await storage.createUser({ username, password, role: 'superadmin' });
    },
  }, process.env);
  console.log(result === 'created' ? 'First superadmin created' : 'Bootstrap not required; superadmin already exists');
} catch (error) {
  // Never stringify database errors, which can include connection details.
  const message = error instanceof Error ? error.message : '';
  console.error(message.startsWith('BOOTSTRAP_') || message.includes('manual recovery') || message.startsWith('DATABASE_URL')
    ? message : 'Bootstrap failed; check database connectivity and configuration');
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}

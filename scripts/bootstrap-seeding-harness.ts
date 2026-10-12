import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { hashPasswordForPersistence } from '../server/src/utils/password-hashing.js';
import { parseRuntimeConfig } from '../server/src/config/runtime-config.js';
import {
  bootstrapFirstSuperadmin,
  resolveStartupSeedingPolicy,
  runDemoSeed,
  runStartupSeeding,
  type StaffBootstrapState,
} from '../server/src/bootstrap/bootstrap-policy.js';

type Staff = { username: string; password: string; role: 'admin' | 'superadmin' };
const users: Staff[] = [];
let creates = 0;
const adapter = {
  getState: async (): Promise<StaffBootstrapState> =>
    users.length === 0 ? 'empty' : users.some((user) => user.role === 'superadmin') ? 'owned' : 'missing-owner',
  createSuperadmin: async (username: string, password: string) => {
    creates++;
    users.push({ username, password: await hashPasswordForPersistence(password), role: 'superadmin' });
  },
};
const bootstrapEnv = {
  BOOTSTRAP_ADMIN_USERNAME: 'new-owner',
  BOOTSTRAP_ADMIN_PASSWORD: 'initial-test-password',
};
assert.equal(await bootstrapFirstSuperadmin(adapter, bootstrapEnv), 'created');
assert.equal(creates, 1);
assert.equal(users.length, 1);
assert.equal(users[0].role, 'superadmin');
assert.equal(await bcrypt.compare(bootstrapEnv.BOOTSTRAP_ADMIN_PASSWORD, users[0].password), true);
const originalHash = users[0].password;
assert.equal(await bootstrapFirstSuperadmin(adapter, bootstrapEnv), 'already-owned');
assert.equal(creates, 1);
assert.equal(users[0].password, originalHash);
users.push({ username: 'another-staff-user', password: 'existing-hash-placeholder', role: 'admin' });
assert.equal(await bootstrapFirstSuperadmin(adapter, bootstrapEnv), 'already-owned');
assert.equal(users.length, 2);
assert.equal(users[1].role, 'admin');

const changedPassword = 'changed-in-admin-ui-password';
const { storage: realStorage } = await import('../server/src/storage.js');
const userModel = mongoose.model('User') as unknown as {
  updateOne: (filter: unknown, update: unknown) => Promise<unknown>;
  exists: (filter: unknown) => Promise<unknown>;
};
const originalUpdateOne = userModel.updateOne;
const originalExists = userModel.exists;
try {
  userModel.updateOne = async (filter, update) => {
    assert.deepEqual(filter, { username: 'new-owner' });
    users[0].password = (update as { $set: { password: string } }).$set.password;
    return { matchedCount: 1, modifiedCount: 1 };
  };
  userModel.exists = async (filter) => {
    const role = (filter as { role?: string }).role;
    return (role ? users.some((user) => user.role === role) : users.length > 0) ? { _id: 'mock-user' } : null;
  };
  assert.equal(await realStorage.getStaffBootstrapState(), 'owned');
  await realStorage.updateUserPassword('new-owner', changedPassword);
} finally {
  userModel.updateOne = originalUpdateOne;
  userModel.exists = originalExists;
}
const changedHash = users[0].password;
let legacyCalls = 0;
let demoCalls = 0;
const newMode = resolveStartupSeedingPolicy({ LEGACY_STARTUP_SEEDING: 'false' });
assert.equal(await runStartupSeeding(newMode, {
  runLegacy: async () => { legacyCalls++; users[0].password = originalHash; },
  seedDemo: async () => { demoCalls++; },
}), 'none');
assert.equal(legacyCalls, 0);
assert.equal(demoCalls, 0);
assert.equal(await bootstrapFirstSuperadmin(adapter, bootstrapEnv), 'already-owned');
assert.equal(users[0].password, changedHash);
assert.equal(await bcrypt.compare(changedPassword, users[0].password), true);
assert.equal(await bcrypt.compare(bootstrapEnv.BOOTSTRAP_ADMIN_PASSWORD, users[0].password), false);
assert.equal(users[1].username, 'another-staff-user');

const adminOnly: Staff[] = [{ username: 'existing-admin', password: 'unchanged-hash', role: 'admin' }];
await assert.rejects(() => bootstrapFirstSuperadmin({
  getState: async () => 'missing-owner',
  createSuperadmin: async () => { adminOnly.push({ username: 'unexpected', password: '', role: 'superadmin' }); },
}, bootstrapEnv), /manual recovery/);
assert.equal(adminOnly.length, 1);
assert.equal(adminOnly[0].password, 'unchanged-hash');
await assert.rejects(() => bootstrapFirstSuperadmin({
  getState: async () => 'empty',
  createSuperadmin: async () => { throw new Error('must not create'); },
}, { BOOTSTRAP_ADMIN_USERNAME: 'new-owner' }), /BOOTSTRAP_ADMIN_PASSWORD/);
try {
  await bootstrapFirstSuperadmin({
    getState: async () => 'empty',
    createSuperadmin: async () => {},
  }, { ...bootstrapEnv, BOOTSTRAP_ADMIN_PASSWORD: 'secret-marker' });
  assert.fail('Short password must fail');
} catch (error) {
  assert.ok(!String(error).includes('secret-marker'));
}

const productionCore = {
  NODE_ENV: 'production',
  DATABASE_URL: 'mongodb://localhost:27017/test',
  JWT_SECRET: 'test-jwt-secret',
  SESSION_SECRET: 'test-session-secret-at-least-32-characters',
  CORS_ALLOWED_ORIGINS: 'https://www.example.com,https://admin.example.com',
};
assert.equal(parseRuntimeConfig({
  ...productionCore,
  ADMIN_PASSWORD: 'legacy-admin-password',
  SUPERADMIN_PASSWORD: 'legacy-superadmin-password',
  LEGACY_STARTUP_SEEDING: 'true',
}).seeding.legacyStartupSeeding, true);
assert.throws(() => parseRuntimeConfig(productionCore), /ADMIN_PASSWORD/);
assert.equal(parseRuntimeConfig({
  ...productionCore,
  LEGACY_STARTUP_SEEDING: 'false',
}).seeding.legacyStartupSeeding, false);

const demoActivities: string[] = [];
let touchCount = 0;
const demoActions = {
  deleteSeeded: async () => { demoActivities.length = 0; },
  insert: async () => { demoActivities.push('sample-activity'); },
  touchAll: async () => { touchCount++; },
};
assert.equal(await runDemoSeed({ exists: false, needsLegacyImageRefresh: false }, false, demoActions), 'created');
assert.equal(demoActivities.length, 1);
assert.equal(touchCount, 0);
assert.equal(await runDemoSeed({ exists: true, needsLegacyImageRefresh: false }, false, demoActions), 'skipped');
assert.equal(demoActivities.length, 1);
assert.equal(await runDemoSeed({ exists: true, needsLegacyImageRefresh: true }, false, demoActions), 'skipped');
assert.equal(demoActivities.length, 1);
assert.equal(await runDemoSeed({ exists: true, needsLegacyImageRefresh: true }, true, demoActions), 'refreshed');
assert.equal(demoActivities.length, 1);
assert.equal(touchCount, 1);
assert.equal(await runStartupSeeding(resolveStartupSeedingPolicy({
  LEGACY_STARTUP_SEEDING: 'false', SEED_DEMO_DATA: 'true',
}), {
  runLegacy: async () => { legacyCalls++; },
  seedDemo: async () => { demoCalls++; },
}), 'demo');
assert.equal(demoCalls, 1);
assert.equal(legacyCalls, 0);

// Exercise the real storage demo path with Mongoose methods replaced in memory.
const activityModel = mongoose.model('Activity') as unknown as {
  findOne: (filter: unknown) => Promise<unknown>;
  insertMany: (documents: unknown[]) => Promise<unknown>;
  deleteMany: (filter: unknown) => Promise<unknown>;
  updateMany: (filter: unknown, update: unknown) => Promise<unknown>;
};
const originalActivityMethods = {
  findOne: activityModel.findOne,
  insertMany: activityModel.insertMany,
  deleteMany: activityModel.deleteMany,
  updateMany: activityModel.updateMany,
};
let storedDemoCount = 0;
let activityDeletes = 0;
let activityTouches = 0;
try {
  activityModel.findOne = async () => storedDemoCount ? { imageUrls: [] } : null;
  activityModel.insertMany = async (documents) => { storedDemoCount += documents.length; return documents; };
  activityModel.deleteMany = async () => { activityDeletes++; storedDemoCount = 0; return { deletedCount: 0 }; };
  activityModel.updateMany = async () => { activityTouches++; return { modifiedCount: 0 }; };
  await realStorage.seedDemoData();
  assert.equal(storedDemoCount, 5);
  await realStorage.seedDemoData();
  assert.equal(storedDemoCount, 5);
  assert.equal(activityDeletes, 0);
  assert.equal(activityTouches, 0);
} finally {
  Object.assign(activityModel, originalActivityMethods);
}

assert.equal(await runStartupSeeding(resolveStartupSeedingPolicy({ LEGACY_STARTUP_SEEDING: 'true' }), {
  runLegacy: async () => { legacyCalls++; },
  seedDemo: async () => { demoCalls++; },
}), 'legacy');
assert.equal(legacyCalls, 1);

const index = await readFile('server/src/index.ts', 'utf8');
const storage = await readFile('server/src/storage.ts', 'utf8');
const cli = await readFile('server/src/bootstrap/cli.ts', 'utf8');
assert.match(index, /runStartupSeeding\(runtimeConfig\.seeding/);
assert.match(storage, /async updateUserPassword[\s\S]*?hashPasswordForPersistence\(password\)/);
assert.match(storage, /async createUser[\s\S]*?hashPasswordForPersistence\(userData\.password\)/);
assert.match(storage, /async seedInitialData[\s\S]*?await this\.seedDemoData\(\{ legacyRefresh: true \}\)/);
assert.match(storage, /async seedDemoData[\s\S]*?runDemoSeed\(/);
assert.match(cli, /storage\.createUser\(\{ username, password, role: 'superadmin' \}\)/);
assert.doesNotMatch(cli, /ahmed|yahia|nadia|bcrypt\.hash|console\.log\([^\n]*password/i);
console.log('Bootstrap seeding harness: PASS');

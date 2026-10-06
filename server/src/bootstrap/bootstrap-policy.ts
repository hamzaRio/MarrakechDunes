export interface StartupSeedingPolicy {
  legacyStartupSeeding: boolean;
  seedDemoData: boolean;
}

export function resolveStartupSeedingPolicy(env: NodeJS.ProcessEnv): StartupSeedingPolicy {
  const legacy = env.LEGACY_STARTUP_SEEDING ?? 'false';
  const demo = env.SEED_DEMO_DATA ?? 'false';
  if (!['true', 'false'].includes(legacy)) throw new Error('LEGACY_STARTUP_SEEDING must be true or false');
  if (!['true', 'false'].includes(demo)) throw new Error('SEED_DEMO_DATA must be true or false');
  return { legacyStartupSeeding: legacy === 'true', seedDemoData: demo === 'true' };
}

export async function runStartupSeeding(
  policy: StartupSeedingPolicy,
  actions: { runLegacy: () => Promise<void>; seedDemo: () => Promise<void> },
): Promise<'legacy' | 'demo' | 'none'> {
  if (policy.legacyStartupSeeding) {
    await actions.runLegacy();
    return 'legacy';
  }
  if (policy.seedDemoData) {
    await actions.seedDemo();
    return 'demo';
  }
  return 'none';
}

export type StaffBootstrapState = 'empty' | 'owned' | 'missing-owner';

export function parseBootstrapCredentials(env: NodeJS.ProcessEnv): { username: string; password: string } {
  const username = (env.BOOTSTRAP_ADMIN_USERNAME || '').trim();
  const password = env.BOOTSTRAP_ADMIN_PASSWORD || '';
  if (!/^[a-z0-9._-]{3,64}$/i.test(username)) {
    throw new Error('BOOTSTRAP_ADMIN_USERNAME must be 3-64 letters, digits, dots, underscores or hyphens');
  }
  if (password.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters');
  return { username, password };
}

export async function bootstrapFirstSuperadmin(
  adapter: {
    getState: () => Promise<StaffBootstrapState>;
    createSuperadmin: (username: string, password: string) => Promise<void>;
  },
  env: NodeJS.ProcessEnv,
): Promise<'created' | 'already-owned'> {
  const state = await adapter.getState();
  if (state === 'owned') return 'already-owned';
  if (state === 'missing-owner') {
    throw new Error('Existing staff accounts have no superadmin; manual recovery is required');
  }
  const { username, password } = parseBootstrapCredentials(env);
  await adapter.createSuperadmin(username, password);
  return 'created';
}

export async function runDemoSeed(
  state: { exists: boolean; needsLegacyImageRefresh: boolean },
  legacyRefresh: boolean,
  actions: { deleteSeeded: () => Promise<void>; insert: () => Promise<void>; touchAll: () => Promise<void> },
): Promise<'created' | 'refreshed' | 'skipped'> {
  const refresh = legacyRefresh && state.exists && state.needsLegacyImageRefresh;
  if (state.exists && !refresh) return 'skipped';
  if (refresh) await actions.deleteSeeded();
  await actions.insert();
  if (legacyRefresh) await actions.touchAll();
  return refresh ? 'refreshed' : 'created';
}

export type RuntimeRole = 'all' | 'api' | 'worker';
const configuredRole = (process.env.ROLE || 'all').toLowerCase();
export const runtimeRole: RuntimeRole = configuredRole === 'api' || configuredRole === 'worker' ? configuredRole : 'all';
let ready = false;
let shuttingDown = false;
export const runtimeState = {
  isReady: () => ready && !shuttingDown,
  isShuttingDown: () => shuttingDown,
  markReady: () => { ready = true; },
  markShuttingDown: () => { shuttingDown = true; ready = false; },
  role: runtimeRole,
};

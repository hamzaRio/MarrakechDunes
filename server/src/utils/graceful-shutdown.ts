export interface ShutdownDependencies {
  closeServer: () => Promise<void>;
  stopTimers: () => void;
  closeLogging: () => Promise<void>;
  closeCache: () => Promise<void>;
  closeDatabase: () => Promise<void>;
  timeoutMs?: number;
  onTimeout?: () => void;
}

export function createGracefulShutdown(dependencies: ShutdownDependencies) {
  let shutdownPromise: Promise<void> | null = null;

  return async function gracefulShutdown(): Promise<void> {
    if (shutdownPromise) return shutdownPromise;

    shutdownPromise = (async () => {
      let timedOut = false;
      const hardTimeout = setTimeout(() => {
        if (timedOut) return;
        timedOut = true;
        try { dependencies.onTimeout?.(); }
        catch (error) { console.error('[shutdown] timeout handler failed', error instanceof Error ? error.name : 'UnknownError'); }
      }, dependencies.timeoutMs ?? 10_000);

      try {
        const runStage = async (name: string, stage: () => Promise<void> | void) => {
          try { await stage(); }
          catch (error) { console.error(`[shutdown] ${name} failed`, error instanceof Error ? error.name : 'UnknownError'); }
        };
        await runStage('server close', dependencies.closeServer);
        await runStage('timer stop', dependencies.stopTimers);
        await runStage('logging close', dependencies.closeLogging);
        await runStage('cache close', dependencies.closeCache);
        await runStage('database close', dependencies.closeDatabase);
      } finally {
        clearTimeout(hardTimeout);
      }
    })();

    return shutdownPromise;
  };
}

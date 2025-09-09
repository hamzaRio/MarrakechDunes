const HEALTH = process.env.BACKEND_HEALTH || 'https://marrakechdunes.onrender.com/health';
const TIMEOUT_MS = Number(process.env.WAIT_TIMEOUT_MS || 10 * 60 * 1000); // 10 min
const INTERVAL_MS = 5000;

const start = Date.now();
async function tick() {
  try {
    const r = await fetch(HEALTH, { cache: 'no-store' });
    if (r.ok) {
      console.log('[wait-backend] Backend healthy:', HEALTH);
      process.exit(0);
    }
    console.log('[wait-backend] Health not OK:', r.status);
  } catch (e) {
    console.log('[wait-backend] Error probing health:', e?.message || e);
  }
  if (Date.now() - start > TIMEOUT_MS) {
    console.error('[wait-backend] TIMEOUT after', TIMEOUT_MS, 'ms');
    process.exit(1);
  }
  setTimeout(tick, INTERVAL_MS);
}
tick();

const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));
const url = process.env.BACKEND_HEALTH || 'https://marrakechdunes.onrender.com/health';
const deadline = Date.now() + 10 * 60 * 1000; // 10 minutes
(async () => {
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { timeout: 5000 });
      if (r.ok) process.exit(0); // healthy -> let build proceed
    } catch {}
    await new Promise(r => setTimeout(r, 5000));
  }
  console.error('Backend not ready — skipping build');
  process.exit(1);
})();

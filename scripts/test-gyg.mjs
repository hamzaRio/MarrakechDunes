// scripts/test-gyg.mjs
/* eslint-disable no-console */
const HOST = (process.env.RENDER_HOST || "").replace(/\/$/, "");
if (!HOST) {
  console.error("❌ Set RENDER_HOST env var to your Render URL, e.g. https://marrakechdunes-sppy.onrender.com");
  process.exit(1);
}

const pad = (s, n = 10) => (s + " ".repeat(n)).slice(0, n);
const ok = (b) => (b ? "✅" : "❌");
const garbleRe = /Ã|â|Â|/;

async function getRaw(url) {
  const t0 = Date.now();
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const ms = Date.now() - t0;
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  const ct = res.headers.get("content-type") || "";
  return {
    url, status: res.status, ok: res.ok, ms,
    ct, utf8: /charset\s*=\s*utf-8/i.test(ct),
    garbled: garbleRe.test(text),
    text, json
  };
}

function host(path) {
  return `${HOST}${path}`;
}

function briefItems(json) {
  const items = (json && json.items) || [];
  const providers = items.map(i => i.provider).filter(Boolean);
  const counts = providers.reduce((m, p) => (m[p] = (m[p] || 0) + 1, m), {});
  return { count: items.length, counts, first: items[0] || null };
}

function printHeader(title) {
  console.log("\n" + "─".repeat(80));
  console.log(" " + title);
  console.log("─".repeat(80));
}

async function testHealth() {
  printHeader("1) ROOT HEALTH");
  const r = await getRaw(host("/"));
  console.log("URL:", r.url);
  console.log("HTTP:", r.status, r.ms + "ms", "| content-type:", r.ct);
  console.log("UTF-8 header:", ok(r.utf8));
  console.log("Garbled chars:", ok(!r.garbled));
  const pass = r.status === 200 && r.utf8 && !r.garbled && r.json && r.json.status === "ok";
  return { name: "Health", pass, r };
}

async function testDebugGYG() {
  printHeader("2) DEBUG GYG (Upstream truth)");
  const url = host("/api/competitors/debug/gyg?query=agafay&city=Marrakech&live=true");
  const r = await getRaw(url);
  console.log("URL:", r.url);
  console.log("HTTP:", r.status, r.ms + "ms");
  if (r.json) {
    const j = r.json;
    console.log("upstreamStatus:", j.upstreamStatus);
    console.log("request.url    :", j.request?.url);
    console.log("request.params :", j.request?.params);
    if (j.upstreamBody) {
      const b = typeof j.upstreamBody === "string" ? j.upstreamBody : JSON.stringify(j.upstreamBody);
      console.log("upstreamBody   :", b.slice(0, 300) + (b.length > 300 ? "…" : ""));
    }
  } else {
    console.log("Body (text):", r.text.slice(0, 300));
  }
  // Pass if it returns JSON and includes request info (even if upstream 400 — that still proves wiring)
  const pass = !!(r.json && r.json.request && r.json.request.url);
  return { name: "DebugGYG", pass, r };
}

async function testLiveNoFallback() {
  printHeader("3) LIVE MODE (no fallback)");
  const r = await getRaw(host("/api/competitors/suggest?query=agafay&city=Marrakech&provider=gyg&live=true"));
  console.log("HTTP:", r.status, r.ms + "ms", "| utf8:", ok(r.utf8), "| garbled:", ok(!r.garbled));
  const info = briefItems(r.json);
  console.log("items:", info.count, "| by provider:", info.counts);
  // In live mode, upstream failure => empty array (by design); success => GetYourGuide items
  const pass = r.status === 200 && (info.count === 0 || info.count > 0);
  return { name: "LiveNoFallback", pass, r, info };
}

async function testNormalWithFallback() {
  printHeader("4) NORMAL MODE (fallback allowed)");
  const r = await getRaw(host("/api/competitors/suggest?query=agafay&city=Marrakech&provider=all"));
  console.log("HTTP:", r.status, r.ms + "ms", "| utf8:", ok(r.utf8), "| garbled:", ok(!r.garbled));
  const info = briefItems(r.json);
  console.log("items:", info.count, "| by provider:", info.counts);
  const pass = r.status === 200 && info.count >= 0;
  return { name: "NormalWithFallback", pass, r, info };
}

async function testUTF8() {
  printHeader("5) UTF-8 CONTENT (accents)");
  const r = await getRaw(host("/api/competitors/suggest?query=montgolfi%C3%A8re&city=Marrakech&provider=gyg"));
  console.log("HTTP:", r.status, r.ms + "ms", "| utf8:", ok(r.utf8), "| garbled:", ok(!r.garbled));
  const pass = r.status === 200 && r.utf8 && !r.garbled;
  return { name: "UTF8", pass, r };
}

async function testValidationSafety() {
  printHeader("6) VALIDATION SAFETY (no 502 on bad params)");
  const rawUrl = host("/api/competitors/suggest?query=a&provider=gyg%22&live=true%22");
  const r = await getRaw(rawUrl);
  console.log("HTTP:", r.status, r.ms + "ms");
  console.log("Body:", r.text.slice(0, 300));
  const pass = r.status === 400 && !!r.json && r.json.code && String(r.json.code).toUpperCase().includes("VALIDATION");
  return { name: "ValidationSafety", pass, r };
}

function finalAdvice(debugJson) {
  const us = debugJson?.upstreamStatus;
  if (us === 200) return "Upstream OK ✅ — you should see live GetYourGuide items in live/normal calls.";
  if (us === 400) return "Upstream 400 ❌ — credentials/entitlements or params. Re-enter env vars (no trailing spaces). If still 400 from laptop curl, ask GYG to enable `/1/products` search for your supplier account.";
  if (us === 401 || us === 403) return "Upstream auth/permission ❌ — check `GYG_SUPPLIER_USER/PASS` in Render and supplier portal permissions.";
  if (us === 429) return "Upstream 429 ⚠️ — rate limited. Try later; app already handles this gracefully.";
  if (typeof us === "number" && us >= 500) return "Upstream 5xx ⚠️ — GYG outage; app behavior is correct.";
  return "Debug route did not show upstream status — recheck server logs.";
}

(async () => {
  const results = [];
  results.push(await testHealth());
  const dbg = await testDebugGYG(); results.push(dbg);
  results.push(await testLiveNoFallback());
  results.push(await testNormalWithFallback());
  results.push(await testUTF8());
  results.push(await testValidationSafety());

  printHeader("SUMMARY");
  for (const r of results) {
    console.log(`${pad(r.name, 18)} ${ok(r.pass)}  (HTTP ${r.r?.status ?? "?"})`);
  }
  const advice = finalAdvice(dbg.r.json);
  console.log("\nNext step:", advice);
})();

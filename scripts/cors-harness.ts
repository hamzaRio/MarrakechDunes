import assert from "node:assert/strict";
import express from "express";
import cors from "cors";
import type { AddressInfo } from "node:net";
import { isAllowedCorsOrigin, isMarrakechDunesAdminPreviewOrigin, isMarrakechDunesPreviewOrigin } from "../server/src/utils/cors-origins.js";

const canonicalOrigin = "https://marrakech-dunes.vercel.app";
const envPreviewOrigin = "https://marrakech-dunes-env123-hamzarios-projects.vercel.app";
const dynamicPreviewOrigin = "https://marrakech-dunes-test123-hamzarios-projects.vercel.app";
const adminOrigin = "https://marrakech-dunes-admin.vercel.app";
const adminPreviewOrigin = "https://marrakech-dunes-admin-test123-hamzarios-projects.vercel.app";
const allowedOrigins = [canonicalOrigin, envPreviewOrigin, adminOrigin];
const allowedPatterns = [
  /^https:\/\/marrakech-dunes-[a-z0-9]+(?:-[a-z0-9]+)*-hamzarios-projects\.vercel\.app$/i,
  /^https:\/\/marrakech-dunes-admin-[a-z0-9]+(?:-[a-z0-9]+)*-hamzarios-projects\.vercel\.app$/i,
];

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedCorsOrigin(origin, allowedOrigins, true, allowedPatterns)) return callback(null, true);
    const error = new Error("Origin not allowed") as Error & { code?: string };
    error.code = "CORS_ORIGIN_DENIED";
    return callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Idempotency-Key"],
}));
app.get("/api/cors-test", (_req, res) => res.json({ ok: true }));
app.use((error: Error & { code?: string }, _req, res, _next) => {
  if (error.code === "CORS_ORIGIN_DENIED") {
    return res.status(403).json({ status: "error", code: "CORS_ORIGIN_DENIED", message: "Origin not allowed" });
  }
  return res.status(500).json({ status: "error", code: "INTERNAL" });
});

const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
  const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
});
const port = (server.address() as AddressInfo).port;

async function preflight(origin: string) {
  return fetch(`http://127.0.0.1:${port}/api/cors-test`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type, Idempotency-Key",
    },
  });
}

try {
  const trusted = await preflight(canonicalOrigin);
  assert.equal(trusted.status, 204);
  assert.equal(trusted.headers.get("access-control-allow-origin"), canonicalOrigin);
  assert.equal(trusted.headers.get("access-control-allow-credentials"), "true");
  assert.match(trusted.headers.get("access-control-allow-headers") ?? "", /Idempotency-Key/i);

  const dynamic = await preflight(dynamicPreviewOrigin);
  assert.equal(dynamic.status, 204);
  assert.equal(dynamic.headers.get("access-control-allow-origin"), dynamicPreviewOrigin);
  assert.equal(dynamic.headers.get("access-control-allow-credentials"), "true");

  const admin = await preflight(adminOrigin);
  assert.equal(admin.status, 204);
  assert.equal(admin.headers.get("access-control-allow-origin"), adminOrigin);
  assert.equal(admin.headers.get("access-control-allow-credentials"), "true");

  const adminPreview = await preflight(adminPreviewOrigin);
  assert.equal(adminPreview.status, 204);
  assert.equal(adminPreview.headers.get("access-control-allow-origin"), adminPreviewOrigin);

  const exactEnv = await preflight(envPreviewOrigin);
  assert.equal(exactEnv.status, 204);
  assert.equal(exactEnv.headers.get("access-control-allow-origin"), envPreviewOrigin);

  for (const origin of [
    "https://evil.vercel.app",
    "https://marrakech-dunes-test123-otherteam.vercel.app",
    "https://marrakech-dunes-admin.attacker.vercel.app",
    "https://marrakech-dunes-admin.vercel.app.evil.com",
    "https://marrakech-dunes-admin-test123-wrongteam.vercel.app",
    "https://marrakech-dunes-admin--test123-hamzarios-projects.vercel.app",
    "https://marrakech-dunes-admin-test123-hamzarios-projects.vercel.app.evil.com",
    "http://marrakech-dunes-test123-hamzarios-projects.vercel.app",
  ]) {
    const rejected = await preflight(origin);
    assert.equal(rejected.status, 403, origin);
    assert.equal(rejected.headers.get("access-control-allow-origin"), null, origin);
    assert.equal((await rejected.json()).code, "CORS_ORIGIN_DENIED");
  }

  assert.equal(isMarrakechDunesPreviewOrigin(dynamicPreviewOrigin), true);
  assert.equal(isMarrakechDunesAdminPreviewOrigin(adminPreviewOrigin), true);
  assert.equal(isAllowedCorsOrigin(undefined, allowedOrigins, true), true);
  console.log("CORS runtime harness: PASS");
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

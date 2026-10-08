import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const forbidden = [
  /timedizzy45@gmail\.com/i,
  /\+?212600623630/i,
  /\+?212693323368/i,
  /\+?212654497354/i,
  /marrakech-dunes\.vercel\.app/i,
  /marrakechdunes-sppy\.onrender\.com/i,
  /LEGACY_OWNER_CORS_COMPAT/i,
];
const roots = ['client/src', 'client/public', 'server/src', '.env.example'];
const files = [];
async function collect(path) {
  const stat = await readdir(path, { withFileTypes: true }).catch(() => null);
  if (!stat) { files.push(path); return; }
  for (const entry of stat) await collect(join(path, entry.name));
}
for (const root of roots) await collect(root);
for (const file of files) {
  const source = await readFile(file, 'utf8');
  for (const pattern of forbidden) assert.doesNotMatch(source, pattern, `${file} contains owner-specific runtime value ${pattern}`);
}
console.log('Owner de-identification harness: PASS');

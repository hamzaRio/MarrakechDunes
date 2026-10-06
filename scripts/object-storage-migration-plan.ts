import { readFile } from 'node:fs/promises';
import { planMigration } from './object-storage-migration.js';

const inputPath = process.argv[2];
const publicBaseUrl = process.env.OBJECT_STORAGE_S3_PUBLIC_BASE_URL?.trim();
if (!inputPath || !publicBaseUrl) {
  console.error('Usage: OBJECT_STORAGE_S3_PUBLIC_BASE_URL=https://cdn.example.test node scripts/object-storage-migration-plan.ts records.json');
  process.exit(2);
}

const records = JSON.parse(await readFile(inputPath, 'utf8')) as Array<{ recordId: string; imageUrls: string[] }>;
if (!Array.isArray(records)) throw new Error('Input must be an array of records');
const knownOrigins = (process.env.OBJECT_STORAGE_LEGACY_PUBLIC_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
const legacyPrefixes = (process.env.OBJECT_STORAGE_LEGACY_URL_PREFIXES || '').split(',').map((value) => value.trim()).filter(Boolean);
process.stdout.write(`${JSON.stringify(planMigration(records, publicBaseUrl, knownOrigins, legacyPrefixes), null, 2)}\n`);

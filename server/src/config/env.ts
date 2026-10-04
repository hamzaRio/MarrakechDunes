import dotenvFlow from 'dotenv-flow';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseRuntimeConfig } from './runtime-config.js';

// The deployment environment wins over local files. This is the only
// application startup path that loads and validates server configuration.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenvFlow.config({ path: serverRoot, silent: true });

if (!process.env.PORT) process.env.PORT = '10000';
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'mongodb://localhost:27017/marrakechdunes';
  if (!process.env.CLIENT_URL && !process.env.CORS_ALLOWED_ORIGINS) process.env.CLIENT_URL = 'http://localhost:5173';
}

export const runtimeConfig = parseRuntimeConfig(process.env);
console.log('[Env] Server configuration validated:', {
  NODE_ENV: runtimeConfig.nodeEnv,
  PORT: runtimeConfig.port,
  CORS_SOURCE: runtimeConfig.cors.source,
});

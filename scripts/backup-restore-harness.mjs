import { MongoClient } from 'mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const executable = process.platform === 'win32' ? '.exe' : '';
function resolveTool(name) {
  const explicit = process.env.MONGODB_DATABASE_TOOLS_DIR;
  if (explicit) return path.join(explicit, `${name}${executable}`);
  try {
    return execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', [`${name}${executable}`], { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
  } catch {
    throw new Error(`MongoDB Database Tools not found: set MONGODB_DATABASE_TOOLS_DIR or put ${name}${executable} on PATH`);
  }
}
const dump = resolveTool('mongodump');
const restore = resolveTool('mongorestore');

function withDatabase(baseUri, dbName) {
  const url = new URL(baseUri);
  url.pathname = `${url.pathname.replace(/\/$/, '')}/${encodeURIComponent(dbName)}`;
  return url.toString();
}

const repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
const base = repl.getUri();
const sourceUri = withDatabase(base, 'hardening_source');
const restoreUri = withDatabase(base, 'hardening_restore');
const temp = mkdtempSync(path.join(tmpdir(), 'marrakech-h4-'));
const archive = path.join(temp, 'backup.archive');

try {
  const source = new MongoClient(sourceUri);
  await source.connect();
  const db = source.db();
  const passwordHash = '$2b$12$synthetic-h4-password-hash';
  await db.collection('users').insertMany([
    { username: 'h4-superadmin', role: 'superadmin', password: passwordHash },
    { username: 'h4-admin', role: 'admin', password: '$2b$12$synthetic-h4-admin-hash' },
  ]);
  const activity = await db.collection('activities').insertOne({ title: 'H4 synthetic activity' });
  await db.collection('bookings').insertOne({ bookingReference: 'BK-H4', activityId: activity.insertedId, paymentStatus: 'deposit_paid', paidAmount: 100 });
  await db.collection('auditLogs').insertOne({ action: 'h4.synthetic', actor: 'h4-admin' });
  await db.collection('sessions').insertOne({ marker: 'H4_SESSION_SHOULD_NOT_RESTORE' });
  await source.close();

  execFileSync(dump, ['--uri', sourceUri, `--archive=${archive}`], { stdio: 'inherit' });
  execFileSync(restore, ['--uri', restoreUri, `--archive=${archive}`, '--drop', '--nsInclude=hardening_source.*', '--nsExclude=hardening_source.sessions', '--nsFrom=hardening_source.*', '--nsTo=hardening_restore.*'], { stdio: 'inherit' });

  const restored = new MongoClient(restoreUri);
  await restored.connect();
  const rdb = restored.db();
  const [users, activities, bookings, audits] = await Promise.all([
    rdb.collection('users').find({}).sort({ username: 1 }).toArray(),
    rdb.collection('activities').countDocuments(),
    rdb.collection('bookings').findOne({ bookingReference: 'BK-H4' }),
    rdb.collection('auditLogs').countDocuments(),
  ]);
  const restoredSession = await rdb.collection('sessions').findOne({ marker: 'H4_SESSION_SHOULD_NOT_RESTORE' });
  if (users.length !== 2 || users[1].username !== 'h4-superadmin' || users[1].role !== 'superadmin' || users[1].password !== passwordHash) throw new Error('user restore mismatch');
  if (activities !== 1 || !bookings || bookings.paymentStatus !== 'deposit_paid' || bookings.paidAmount !== 100 || audits !== 1) throw new Error('business data restore mismatch');
  if (restoredSession) throw new Error('ephemeral session was restored');
  await restored.close();
  console.log('H4 backup/restore PASS (sessions intentionally excluded)');
} finally {
  rmSync(temp, { recursive: true, force: true });
  await repl.stop();
}

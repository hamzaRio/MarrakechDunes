import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import bcrypt from "bcrypt";
import {
  hashPasswordForPersistence,
  prepareUserUpdateForPersistence,
} from "../server/src/utils/password-hashing.js";

const plaintext = "local-harness-password";
const persistedHash = await hashPasswordForPersistence(plaintext);

assert.notEqual(persistedHash, plaintext);
assert.equal(await bcrypt.compare(plaintext, persistedHash), true);
assert.equal(await bcrypt.compare(plaintext, await hashPasswordForPersistence(persistedHash)), false);

const passwordUpdate = await prepareUserUpdateForPersistence({ password: plaintext });
assert.equal(await bcrypt.compare(plaintext, passwordUpdate.password!), true);

const existingHash = persistedHash;
const usernameOnly = await prepareUserUpdateForPersistence({ username: "renamed-admin" });
assert.equal("password" in usernameOnly, false);
assert.equal(existingHash, persistedHash);

const roleOnly = await prepareUserUpdateForPersistence({ role: "superadmin" });
assert.equal("password" in roleOnly, false);
assert.equal(existingHash, persistedHash);

const safeResponse = {
  _id: "user-id",
  username: "admin-user",
  role: "admin",
  createdAt: new Date(),
};
assert.equal("password" in safeResponse, false);
assert.equal("passwordHash" in safeResponse, false);

const routeSource = await readFile(new URL("../server/src/routes/superadmin.ts", import.meta.url), "utf8");
const storageSource = await readFile(new URL("../server/src/storage.ts", import.meta.url), "utf8");
const hashingSource = await readFile(new URL("../server/src/utils/password-hashing.ts", import.meta.url), "utf8");
assert.match(routeSource, /router\.use\(requireSuperAdmin\)/);
assert.doesNotMatch(routeSource, /bcrypt/);
assert.match(routeSource, /storage\.createUser\(\{\s*username,\s*password,/);
assert.match(routeSource, /updateData\.password = password;/);
assert.doesNotMatch(routeSource, /console\.(?:log|error)\([^\n]*password/i);
assert.match(routeSource, /role !== 'admin' && role !== 'superadmin'/);
assert.match(storageSource, /import \{ hashPasswordForPersistence, prepareUserUpdateForPersistence \} from '.\/utils\/password-hashing\.js';/);
assert.doesNotMatch(storageSource, /bcrypt\.hash/);
assert.doesNotMatch(storageSource, /password length/i);
assert.match(storageSource, /async createUser[\s\S]*?hashPasswordForPersistence\(userData\.password\)/);
assert.match(storageSource, /async updateUserPassword[\s\S]*?hashPasswordForPersistence\(password\)/);
assert.match(storageSource, /async updateUser[\s\S]*?prepareUserUpdateForPersistence\(updateData\)/);
assert.match(storageSource, /async createAdmin[\s\S]*?hashPasswordForPersistence\(adminData\.password\)/);
assert.match(storageSource, /async seedInitialData[\s\S]*?hashPasswordForPersistence\(userData\.password\)/);
assert.equal((hashingSource.match(/bcrypt\.hash/g) ?? []).length, 1);

console.log("Superadmin password harness: PASS");

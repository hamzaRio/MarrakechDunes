import bcrypt from 'bcrypt';

const PASSWORD_HASH_ROUNDS = 10;

/** Storage-only password persistence helpers. Route handlers always pass plaintext. */
export async function hashPasswordForPersistence(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

export async function prepareUserUpdateForPersistence<T extends { password?: string }>(updateData: T): Promise<T> {
  if (!updateData.password) return { ...updateData };
  return {
    ...updateData,
    password: await hashPasswordForPersistence(updateData.password),
  };
}

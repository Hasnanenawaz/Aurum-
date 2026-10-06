// Server-only auth helpers for route handlers and server components.
import { cookies } from 'next/headers';
import { read } from './db.js';
import { SESSION_COOKIE, verifySession } from './session.js';
import { HttpError } from './http.js';

/** Strip private fields before sending a user to the browser. */
export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

/**
 * The logged-in user, freshly loaded from the database (so a role change
 * or deactivation takes effect immediately, even with an old cookie).
 */
export async function getCurrentUser() {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session?.sub) return null;
  const db = await read();
  const user = db.users.find((u) => u.id === session.sub);
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'Please sign in first.');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new HttpError(403, 'Admin access only.');
  return user;
}

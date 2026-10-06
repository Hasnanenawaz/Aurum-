import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { route, readJson, HttpError } from '@/lib/http';
import { read, write } from '@/lib/db';
import { publicUser } from '@/lib/auth';
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';

export const POST = route(async (req) => {
  rateLimit(req, 'login', { limit: 10 });
  const body = await readJson(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  const db = await read();
  const user = db.users.find((u) => u.email === email);
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new HttpError(401, 'That email and password don’t match.');
  if (!user.active) throw new HttpError(403, 'This account has been paused. Please contact Aurum.');

  await write((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) u.lastLoginAt = new Date().toISOString();
  });

  const res = NextResponse.json({ user: publicUser(user) });
  res.cookies.set(SESSION_COOKIE, await signSession(user), sessionCookieOptions);
  return res;
});

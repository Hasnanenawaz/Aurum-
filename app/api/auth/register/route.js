import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { route, readJson, HttpError } from '@/lib/http';
import { write, newId } from '@/lib/db';
import { publicUser } from '@/lib/auth';
import { validateRegistration } from '@/lib/validate';
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';

// Anyone can create a CUSTOMER account. Admins are promoted from the admin panel.
export const POST = route(async (req) => {
  rateLimit(req, 'register', { limit: 5 });
  const input = validateRegistration(await readJson(req));
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await write((db) => {
    if (db.users.some((u) => u.email === input.email)) {
      throw new HttpError(409, 'An account with this email already exists. Try signing in.');
    }
    const u = {
      id: newId('usr'),
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: 'customer',
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    db.users.push(u);
    return u;
  });

  const res = NextResponse.json({ user: publicUser(user) }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, await signSession(user), sessionCookieOptions);
  return res;
});

// Edge-safe session helpers (used by middleware.js AND server code).
// Sessions are signed JWTs stored in an httpOnly cookie.
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'aurum_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const DEV_SECRET = 'dev-only-secret-change-me-in-env-file-0000';

function secretKey() {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    console.warn('[aurum] JWT_SECRET is not set — using an insecure default. Set it in .env.local!');
  }
  return new TextEncoder().encode(s || DEV_SECRET);
}

export async function signSession(user) {
  return new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload; // { sub, role, name, iat, exp }
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  // Secure cookies need HTTPS. Set COOKIE_SECURE=false to test a production build over plain http.
  secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

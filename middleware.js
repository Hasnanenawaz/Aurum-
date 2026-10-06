// Keeps non-admins out of /admin pages. (API routes re-check the
// database on every request, so this is a first line of defence only.)
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/session.js';

export async function middleware(req) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session?.role === 'admin') return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/account';
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ['/admin/:path*'] };

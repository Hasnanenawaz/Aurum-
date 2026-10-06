// Very small in-memory rate limiter (per process). Good enough to slow down
// password guessing on a single server; use Redis/Upstash if you scale out.
import { HttpError } from './http.js';

const g = globalThis;
g.__aurumRate ??= new Map();

export function rateLimit(req, key, { limit = 10, windowMs = 10 * 60 * 1000 } = {}) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = g.__aurumRate.get(bucketKey);
  if (!bucket || bucket.reset < now) {
    g.__aurumRate.set(bucketKey, { count: 1, reset: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
  }
}

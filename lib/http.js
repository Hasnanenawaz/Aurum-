// Small helpers that keep every API route short and consistent.
import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Wrap a route handler so thrown HttpErrors become JSON responses:
 *   export const GET = route(async (req, ctx) => ({ products }));
 * Return a plain object → 200 JSON. Return a NextResponse → sent as-is.
 */
export function route(handler) {
  return async (req, ctx) => {
    try {
      const result = await handler(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
      }
      console.error('[aurum] Unhandled API error:', err);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
  };
}

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
}

/** Next 15 passes params as a promise. */
export async function paramsOf(ctx) {
  return (await ctx?.params) || {};
}

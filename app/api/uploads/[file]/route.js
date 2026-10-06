import fs from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR, CONTENT_TYPES, safeUploadName } from '@/lib/uploads';

// GET /api/uploads/:file — serves product photos saved by the admin.
export async function GET(req, ctx) {
  const { file } = await ctx.params;
  const name = safeUploadName(file);
  if (!name) return new Response('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(path.join(UPLOAD_DIR, name));
    return new Response(buf, {
      headers: {
        'Content-Type': CONTENT_TYPES[name.split('.').pop()],
        // File names are unique, so browsers can cache them forever.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

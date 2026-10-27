// Product photo storage.
//
// • BLOB_READ_WRITE_TOKEN set (Vercel): photos go to Vercel Blob and the
//   product stores the public blob URL.
// • otherwise (offline dev): saved to data/uploads and streamed back
//   through /api/uploads/[file]. (Not public/ — Next.js only serves files
//   that existed there at build time, so new uploads would 404.)
//
// The rest of the app only stores the URL.
import fs from 'node:fs/promises';
import path from 'node:path';
import { put, del } from '@vercel/blob';
import { DATA_DIR } from './db.js';
import { HttpError } from './http.js';

export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB (Vercel caps request bodies at 4.5 MB)
export const URL_PREFIX = '/api/uploads/';
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const BLOB_HOST = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/products\//i;

// Detect type from the file's first bytes (don't trust the browser's label).
function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', type: 'image/jpeg' };
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: 'png', type: 'image/png' };
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return { ext: 'webp', type: 'image/webp' };
  return null;
}

export const CONTENT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function saveUpload(file) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new HttpError(400, 'No file received.');
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'Photos must be 4 MB or smaller.');
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) throw new HttpError(415, 'Please upload a JPG, PNG or WebP photo.');
  const name = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${kind.ext}`;
  if (useBlob) {
    const blob = await put(`products/${name}`, buf, {
      access: 'public',
      contentType: kind.type,
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000, // names are unique, so cache forever
    });
    return blob.url;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return `${URL_PREFIX}${name}`;
}

/** Only accepts names we generated — blocks ../ path tricks. */
export function safeUploadName(name) {
  return /^[a-z0-9]+-[a-f0-9]{8}\.(jpg|png|webp)$/.test(name) ? name : null;
}

export async function deleteUploadedFile(url) {
  if (typeof url !== 'string') return;
  if (useBlob && BLOB_HOST.test(url)) {
    await del(url).catch(() => {});
    return;
  }
  if (!url.startsWith(URL_PREFIX)) return;
  const name = safeUploadName(url.slice(URL_PREFIX.length));
  if (!name) return;
  await fs.unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}

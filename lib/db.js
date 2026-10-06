// ─────────────────────────────────────────────────────────────
// Tiny JSON-file database.
//
// Everything lives in data/db.json. This keeps the starter
// dependency-free and easy to inspect. Writes are serialised
// through a single queue and saved atomically (write tmp → rename),
// so two admin actions at once can't corrupt the file.
//
// When the shop grows, swap this file for Postgres/MongoDB —
// every route only uses read() and write(), so nothing else changes.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSeedData } from './seed.js';

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Shared across hot-reloads / route bundles in the same process.
const g = globalThis;
g.__aurumDbQueue ??= Promise.resolve();

async function loadFromDisk() {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    // First run: create the database with seed data.
    await fs.mkdir(DATA_DIR, { recursive: true });
    const seeded = await buildSeedData();
    await saveToDisk(seeded);
    console.log('[aurum] Created data/db.json with seed data.');
    return seeded;
  }
}

async function saveToDisk(data) {
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, DB_FILE);
}

/** Read a snapshot of the whole database. Safe to mutate (it's a copy). */
export async function read() {
  await g.__aurumDbQueue; // don't read halfway through a write
  return loadFromDisk();
}

/**
 * Change the database. `mutator` receives the live data object;
 * change it in place and optionally return a value.
 *   const product = await write(db => { db.products.push(p); return p; });
 */
export function write(mutator) {
  const run = g.__aurumDbQueue.then(async () => {
    const data = await loadFromDisk();
    const result = await mutator(data);
    await saveToDisk(data);
    return result;
  });
  g.__aurumDbQueue = run.catch(() => {});
  return run;
}

export function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** A URL slug for a product that no other product is using. */
export function uniqueSlug(db, name, ignoreId) {
  const base = slugify(name) || 'piece';
  let slug = base;
  let n = 2;
  while (db.products.some((p) => p.slug === slug && p.id !== ignoreId)) slug = `${base}-${n++}`;
  return slug;
}

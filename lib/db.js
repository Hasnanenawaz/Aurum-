// ─────────────────────────────────────────────────────────────
// Tiny document database.
//
// The whole shop (products, offers, users, orders) is one JSON
// document, with two interchangeable backends:
//   • DATABASE_URL set (Vercel / Neon): a single JSONB row in Postgres.
//     write() locks it with SELECT … FOR UPDATE inside a transaction,
//     so concurrent writes from several functions can't clobber each other.
//   • otherwise (offline dev): data/db.json. Writes are serialised
//     through a single queue and saved atomically (write tmp → rename).
//
// Every route only uses read() and write(), so nothing else changes.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { buildSeedData } from './seed.js';

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const usePg = Boolean(process.env.DATABASE_URL);

// Shared across hot-reloads / route bundles in the same process.
const g = globalThis;
g.__aurumDbQueue ??= Promise.resolve();

// ── File backend ─────────────────────────────────────────────

// On Windows, renaming over db.json fails with EPERM/EACCES/EBUSY while
// another request has it open for reading. Those locks last milliseconds,
// so retry briefly instead of failing the request.
const TRANSIENT = new Set(['EPERM', 'EACCES', 'EBUSY']);

async function withRetry(fn) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!TRANSIENT.has(err.code) || attempt >= 10) throw err;
      await new Promise((r) => setTimeout(r, 10 * (attempt + 1)));
    }
  }
}

async function loadFromDisk() {
  try {
    return JSON.parse(await withRetry(() => fs.readFile(DB_FILE, 'utf8')));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    // First run: create the database with seed data (once, even if
    // several requests arrive together).
    g.__aurumDbSeeding ??= (async () => {
      await saveToDisk(await buildSeedData());
      console.log('[aurum] Created data/db.json with seed data.');
    })().finally(() => { g.__aurumDbSeeding = null; });
    await g.__aurumDbSeeding;
    return JSON.parse(await withRetry(() => fs.readFile(DB_FILE, 'utf8')));
  }
}

async function saveToDisk(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  try {
    await withRetry(() => fs.rename(tmp, DB_FILE));
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }
}

async function readFile() {
  await g.__aurumDbQueue; // don't read halfway through a write
  return loadFromDisk();
}

function writeFile(mutator) {
  const run = g.__aurumDbQueue.then(async () => {
    const data = await loadFromDisk();
    const result = await mutator(data);
    await saveToDisk(data);
    return result;
  });
  g.__aurumDbQueue = run.catch(() => {});
  return run;
}

// ── Postgres backend ─────────────────────────────────────────

function pool() {
  if (!g.__aurumPgPool) {
    g.__aurumPgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    // Lets Vercel close idle clients before the function is suspended.
    attachDatabasePool(g.__aurumPgPool);
  }
  return g.__aurumPgPool;
}

// Create the table and seed it on first run (once, even if several
// functions race here — ON CONFLICT keeps the first insert).
async function ensureSeeded() {
  g.__aurumPgReady ??= (async () => {
    await pool().query('CREATE TABLE IF NOT EXISTS aurum_store (id int PRIMARY KEY, data jsonb NOT NULL)');
    const { rowCount } = await pool().query(
      'INSERT INTO aurum_store (id, data) SELECT 1, $1 WHERE NOT EXISTS (SELECT 1 FROM aurum_store WHERE id = 1) ON CONFLICT (id) DO NOTHING',
      [JSON.stringify(await buildSeedData())],
    );
    if (rowCount) console.log('[aurum] Seeded Postgres with sample data.');
  })().catch((err) => {
    g.__aurumPgReady = null;
    throw err;
  });
  return g.__aurumPgReady;
}

async function readPg() {
  await ensureSeeded();
  const { rows } = await pool().query('SELECT data FROM aurum_store WHERE id = 1');
  return rows[0].data;
}

async function writePg(mutator) {
  await ensureSeeded();
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT data FROM aurum_store WHERE id = 1 FOR UPDATE');
    const data = rows[0].data;
    const result = await mutator(data);
    await client.query('UPDATE aurum_store SET data = $1 WHERE id = 1', [JSON.stringify(data)]);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// ── Public interface ─────────────────────────────────────────

/** Read a snapshot of the whole database. Safe to mutate (it's a copy). */
export function read() {
  return usePg ? readPg() : readFile();
}

/**
 * Change the database. `mutator` receives the live data object;
 * change it in place and optionally return a value.
 *   const product = await write(db => { db.products.push(p); return p; });
 */
export function write(mutator) {
  return usePg ? writePg(mutator) : writeFile(mutator);
}

/** Where the data lives, for CLI messages. */
export const storageLabel = usePg ? 'Postgres (DATABASE_URL)' : DB_FILE;

/** Wipe everything and replace it with the seed catalogue (npm run seed). */
export async function resetToSeed() {
  if (!usePg) return saveToDisk(await buildSeedData());
  await ensureSeeded();
  await pool().query('UPDATE aurum_store SET data = $1 WHERE id = 1', [JSON.stringify(await buildSeedData())]);
}

/** Close database connections so CLI scripts can exit. */
export async function close() {
  await g.__aurumPgPool?.end();
  g.__aurumPgPool = null;
  g.__aurumPgReady = null;
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

// npm run seed — wipes data/db.json and recreates it with the seed catalogue.
// Uploaded photos in data/uploads are left alone.
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSeedData } from '../lib/seed.js';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const file = path.join(dataDir, 'db.json');

if (!process.argv.includes('--yes')) {
  try {
    await fs.access(file);
    console.log(`This will ERASE ${file} (all products, offers, users and orders).`);
    console.log('Run again with:  npm run seed -- --yes');
    process.exit(1);
  } catch {
    /* no db yet — safe to create */
  }
}

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(file, JSON.stringify(await buildSeedData(), null, 2));
console.log(`Seeded ${file}`);
console.log(`Admin login: ${process.env.ADMIN_EMAIL || 'admin@aurum.local'} / ${process.env.ADMIN_PASSWORD ? '(from ADMIN_PASSWORD)' : 'aurum-admin-123'}`);

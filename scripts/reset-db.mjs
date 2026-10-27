// npm run seed — wipes the database and recreates it with the seed catalogue.
// Uses Postgres when DATABASE_URL is set (e.g. from .env.local), otherwise
// data/db.json. Uploaded photos are left alone.
import { resetToSeed, close, storageLabel } from '../lib/db.js';

if (!process.argv.includes('--yes')) {
  console.log(`This will ERASE ${storageLabel} (all products, offers, users and orders).`);
  console.log('Run again with:  npm run seed -- --yes');
  process.exit(1);
}

await resetToSeed();
await close();
console.log(`Seeded ${storageLabel}`);
console.log(`Admin login: ${process.env.ADMIN_EMAIL || 'admin@aurum.local'} / ${process.env.ADMIN_PASSWORD ? '(from ADMIN_PASSWORD)' : 'aurum-admin-123'}`);

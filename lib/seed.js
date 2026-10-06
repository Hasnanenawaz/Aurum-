// Seed data used the first time the app runs (or with `npm run seed`).
// Product names, prices and descriptions are PLACEHOLDERS — replace them
// with Aurum's real catalogue from the admin panel.
import bcrypt from 'bcryptjs';

const now = () => new Date().toISOString();
const id = (p, n) => `${p}_seed${String(n).padStart(4, '0')}`;

const PRODUCTS = [
  ['Petal Halo Ring', 'rings', 1299, null, 'A ring of tiny petals around a single crystal. Sits flat, so it stacks with anything.', ['birthday', 'self-gift'], true],
  ['Twin Band Stacker', 'rings', 899, 749, 'Two slim bands joined at one point — wear it as one ring that looks like two.', ['just-because', 'self-gift'], false],
  ['First Light Pendant', 'necklaces', 1599, null, 'A small sunburst on a 16-inch chain with a 2-inch extender. The piece we reach for most.', ['birthday', 'anniversary'], true],
  ['Initial Charm Necklace', 'necklaces', 1199, null, 'A single letter on a fine chain. Tell us the initial in your order note.', ['birthday', 'just-because'], false],
  ['Bow Studs', 'earrings', 699, null, 'Little gold bows, a nod to the ribbon on every Aurum box. Light enough to sleep in.', ['just-because', 'birthday'], true],
  ['Huggie Hoops', 'earrings', 999, null, 'Small hoops that hug the lobe. Click-shut hinge, no backs to lose.', ['self-gift'], false],
  ['Promise Chain Bracelet', 'bracelets', 1399, null, 'A delicate paperclip chain with a heart clasp you can wear at the front.', ['anniversary', 'just-because'], true],
  ['Open Cuff', 'bracelets', 1499, null, 'A polished open cuff that adjusts to most wrists with a gentle squeeze.', ['self-gift', 'anniversary'], false],
  ['The Smile Box', 'gift-sets', 2499, null, 'Pendant, studs and a stacking ring in our cream gift box with a handwritten To/From tag.', ['birthday', 'anniversary'], true],
  ['Little Joys Duo', 'gift-sets', 1699, null, 'Bow Studs and the Twin Band Stacker, boxed together. An easy yes for any occasion.', ['just-because', 'birthday'], false],
];

export async function buildSeedData() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@aurum.local').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'aurum-admin-123';
  const t = now();

  const products = PRODUCTS.map(([name, category, price, salePrice, description, tags, featured], i) => ({
    id: id('prd', i + 1),
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    name,
    category,
    price,
    salePrice,
    description,
    material: '18k gold-plated brass, anti-tarnish coating', // placeholder — confirm with brand
    images: [], // empty → storefront shows the category placeholder illustration
    stock: 10 + ((i * 7) % 15),
    featured,
    tags,
    status: 'active',
    createdAt: t,
    updatedAt: t,
  }));

  // A festive offer that runs until just after Diwali 2026 (8 Nov).
  const offers = [
    {
      id: id('off', 1),
      name: 'Festive Smiles',
      description: '15% off every gift set until Diwali',
      type: 'percent',
      value: 15,
      scope: 'category',
      categories: ['gift-sets'],
      productIds: [],
      startsAt: null,
      endsAt: '2026-11-09T18:29:59.000Z', // 9 Nov 2026, 11:59 pm IST
      active: true,
      showInBanner: true,
      createdAt: t,
    },
  ];

  const users = [
    {
      id: id('usr', 1),
      name: 'Aurum Admin',
      email: adminEmail,
      phone: '',
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'admin',
      active: true,
      createdAt: t,
      lastLoginAt: null,
    },
  ];

  return { products, offers, users, orders: [], meta: { orderCounter: 1000, createdAt: t } };
}

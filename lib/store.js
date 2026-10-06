// Read helpers shared by storefront pages (server components) and the public API.
import { read } from './db.js';
import { withPricing, headlineOffer } from './pricing.js';

export async function listProducts({ category, q, tag, sort, ids, featured, includeDrafts = false } = {}) {
  const db = await read();
  const now = new Date();
  let items = db.products.filter((p) => includeDrafts || p.status === 'active');

  if (ids?.length) items = items.filter((p) => ids.includes(p.id));
  if (category) items = items.filter((p) => p.category === category);
  if (tag) items = items.filter((p) => (p.tags || []).includes(tag));
  if (featured) items = items.filter((p) => p.featured);
  if (q) {
    const needle = q.toLowerCase();
    items = items.filter((p) =>
      [p.name, p.description, p.category, ...(p.tags || [])].join(' ').toLowerCase().includes(needle)
    );
  }

  let priced = items.map((p) => withPricing(p, db.offers, now));

  if (sort === 'price-asc') priced.sort((a, b) => a.pricing.finalPrice - b.pricing.finalPrice);
  else if (sort === 'price-desc') priced.sort((a, b) => b.pricing.finalPrice - a.pricing.finalPrice);
  else if (sort === 'newest') priced.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  else priced.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));

  return priced;
}

export async function getProductBySlug(slug) {
  const db = await read();
  const p = db.products.find((x) => x.slug === slug && x.status === 'active');
  return p ? withPricing(p, db.offers, new Date()) : null;
}

export async function getHeadlineOffer() {
  const db = await read();
  const offer = headlineOffer(db.offers);
  if (!offer) return null;
  const { id, name, description, type, value, endsAt, scope, categories } = offer;
  return { id, name, description, type, value, endsAt, scope, categories };
}

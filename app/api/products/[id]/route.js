import { route, readJson, paramsOf, HttpError } from '@/lib/http';
import { read, write, uniqueSlug } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { withPricing } from '@/lib/pricing';
import { validateProduct } from '@/lib/validate';
import { deleteUploadedFile } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

// GET /api/products/:id  (accepts an id or a slug)
export const GET = route(async (req, ctx) => {
  const { id } = await paramsOf(ctx);
  const db = await read();
  const p = db.products.find((x) => x.id === id || x.slug === id);
  if (!p || p.status !== 'active') {
    // Drafts are visible to admins only.
    if (p) await requireAdmin();
    else throw new HttpError(404, 'Product not found.');
  }
  return { product: withPricing(p, db.offers) };
});

// PATCH /api/products/:id — partial update (admin)
export const PATCH = route(async (req, ctx) => {
  await requireAdmin();
  const { id } = await paramsOf(ctx);
  const changes = validateProduct(await readJson(req), { partial: true });
  const product = await write((db) => {
    const p = db.products.find((x) => x.id === id);
    if (!p) throw new HttpError(404, 'Product not found.');
    const merged = { ...p, ...changes };
    if (merged.salePrice && merged.salePrice >= merged.price) {
      throw new HttpError(400, 'Please fix the highlighted fields.', { salePrice: 'Sale price should be lower than the regular price.' });
    }
    if (changes.name && changes.name !== p.name) merged.slug = uniqueSlug(db, changes.name, p.id);
    merged.updatedAt = new Date().toISOString();
    Object.assign(p, merged);
    return p;
  });
  return { product };
});

// DELETE /api/products/:id (admin) — also removes its uploaded photos
export const DELETE = route(async (req, ctx) => {
  await requireAdmin();
  const { id } = await paramsOf(ctx);
  const removed = await write((db) => {
    const i = db.products.findIndex((x) => x.id === id);
    if (i === -1) throw new HttpError(404, 'Product not found.');
    const [p] = db.products.splice(i, 1);
    // Drop it from any product-specific offers too.
    for (const o of db.offers) o.productIds = (o.productIds || []).filter((pid) => pid !== id);
    return p;
  });
  await Promise.all((removed.images || []).map(deleteUploadedFile));
  return { ok: true, deleted: removed.id };
});

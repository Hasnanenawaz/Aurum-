import { route, readJson, paramsOf, HttpError } from '@/lib/http';
import { write } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { validateOffer } from '@/lib/validate';

// PATCH /api/offers/:id — edit, pause (active:false) or resume (admin)
export const PATCH = route(async (req, ctx) => {
  await requireAdmin();
  const { id } = await paramsOf(ctx);
  const changes = validateOffer(await readJson(req), { partial: true });
  const offer = await write((db) => {
    const o = db.offers.find((x) => x.id === id);
    if (!o) throw new HttpError(404, 'Offer not found.');
    Object.assign(o, changes, { updatedAt: new Date().toISOString() });
    return o;
  });
  return { offer };
});

// DELETE /api/offers/:id (admin)
export const DELETE = route(async (req, ctx) => {
  await requireAdmin();
  const { id } = await paramsOf(ctx);
  await write((db) => {
    const i = db.offers.findIndex((x) => x.id === id);
    if (i === -1) throw new HttpError(404, 'Offer not found.');
    db.offers.splice(i, 1);
  });
  return { ok: true };
});

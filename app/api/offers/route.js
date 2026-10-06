import { route, readJson } from '@/lib/http';
import { read, write, newId } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { isOfferLive } from '@/lib/pricing';
import { validateOffer } from '@/lib/validate';
import { getHeadlineOffer } from '@/lib/store';

export const dynamic = 'force-dynamic';

// GET /api/offers           → admin: every offer with a live/scheduled/ended status
// GET /api/offers?public=1  → anyone: just the current headline offer (for banners)
export const GET = route(async (req) => {
  if (req.nextUrl.searchParams.get('public') === '1') {
    return { offer: await getHeadlineOffer() };
  }
  await requireAdmin();
  const db = await read();
  const now = new Date();
  const offers = db.offers
    .map((o) => ({ ...o, status: offerStatus(o, now) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { offers };
});

// POST /api/offers — create (admin)
export const POST = route(async (req) => {
  await requireAdmin();
  const data = validateOffer(await readJson(req));
  const offer = await write((db) => {
    const o = {
      id: newId('off'),
      description: '',
      categories: [],
      productIds: [],
      startsAt: null,
      endsAt: null,
      active: true,
      showInBanner: true,
      ...data,
      createdAt: new Date().toISOString(),
    };
    db.offers.push(o);
    return o;
  });
  return Response.json({ offer }, { status: 201 });
});

function offerStatus(o, now) {
  if (!o.active) return 'paused';
  if (isOfferLive(o, now)) return 'live';
  if (o.startsAt && new Date(o.startsAt) > now) return 'scheduled';
  return 'ended';
}

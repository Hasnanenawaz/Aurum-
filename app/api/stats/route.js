import { route } from '@/lib/http';
import { read } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { isOfferLive } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// GET /api/stats — numbers for the admin dashboard
export const GET = route(async () => {
  await requireAdmin();
  const db = await read();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const valid = db.orders.filter((o) => o.status !== 'cancelled');
  const thisMonth = valid.filter((o) => o.createdAt >= monthStart);

  return {
    revenueThisMonth: thisMonth.reduce((s, o) => s + o.total, 0),
    ordersThisMonth: thisMonth.length,
    newOrders: db.orders.filter((o) => o.status === 'new').length,
    products: db.products.filter((p) => p.status === 'active').length,
    drafts: db.products.filter((p) => p.status === 'draft').length,
    lowStock: db.products
      .filter((p) => p.status === 'active' && p.stock <= 3)
      .map(({ id, name, stock }) => ({ id, name, stock })),
    customers: db.users.filter((u) => u.role === 'customer').length,
    liveOffers: db.offers.filter((o) => isOfferLive(o, now)).map(({ id, name, type, value, endsAt }) => ({ id, name, type, value, endsAt })),
    recentOrders: [...db.orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map(({ id, number, customer, total, status, createdAt }) => ({ id, number, customer: customer.name, total, status, createdAt })),
  };
});

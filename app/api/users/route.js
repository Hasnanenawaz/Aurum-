import { route } from '@/lib/http';
import { read } from '@/lib/db';
import { requireAdmin, publicUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/users?q=priya&role=customer — admin list with order counts
export const GET = route(async (req) => {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const q = (sp.get('q') || '').toLowerCase();
  const role = sp.get('role');
  const db = await read();

  const users = db.users
    .filter((u) => !role || u.role === role)
    .filter((u) => !q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((u) => {
      const orders = db.orders.filter((o) => o.userId === u.id && o.status !== 'cancelled');
      return {
        ...publicUser(u),
        orderCount: orders.length,
        totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
      };
    });
  return { users };
});

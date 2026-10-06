import { route } from '@/lib/http';
import { getCurrentUser, publicUser } from '@/lib/auth';
import { read } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Returns the signed-in user (or null) plus their past orders.
export const GET = route(async () => {
  const user = await getCurrentUser();
  if (!user) return { user: null, orders: [] };
  const db = await read();
  const orders = db.orders
    .filter((o) => o.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ adminNote, ...o }) => o);
  return { user: publicUser(user), orders };
});

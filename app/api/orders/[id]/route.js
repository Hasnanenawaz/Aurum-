import { route, readJson, paramsOf, HttpError } from '@/lib/http';
import { write } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { validateOrderStatus } from '@/lib/validate';

// PATCH /api/orders/:id — move an order along (new → confirmed → packed → shipped → delivered)
// Cancelling puts the stock back; un-cancelling takes it out again.
export const PATCH = route(async (req, ctx) => {
  await requireAdmin();
  const { id } = await paramsOf(ctx);
  const { status, adminNote } = validateOrderStatus(await readJson(req));
  const order = await write((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) throw new HttpError(404, 'Order not found.');
    const wasCancelled = o.status === 'cancelled';
    const nowCancelled = status === 'cancelled';
    if (wasCancelled !== nowCancelled) {
      for (const line of o.items) {
        const p = db.products.find((x) => x.id === line.productId);
        if (p) p.stock = Math.max(0, p.stock + (nowCancelled ? line.qty : -line.qty));
      }
    }
    o.status = status;
    if (adminNote !== undefined) o.adminNote = adminNote;
    o.updatedAt = new Date().toISOString();
    return o;
  });
  return { order };
});

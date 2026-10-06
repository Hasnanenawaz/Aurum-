import { route, readJson, HttpError } from '@/lib/http';
import { read, write, newId } from '@/lib/db';
import { requireAdmin, getCurrentUser } from '@/lib/auth';
import { priceProduct } from '@/lib/pricing';
import { validateOrder } from '@/lib/validate';
import { orderWhatsappUrl } from '@/lib/whatsapp';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/orders?status=new — admin list
export const GET = route(async (req) => {
  await requireAdmin();
  const status = req.nextUrl.searchParams.get('status');
  const db = await read();
  const orders = db.orders
    .filter((o) => !status || o.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { orders };
});

// POST /api/orders — place an order from the bag (guests allowed).
// Prices are ALWAYS recalculated here; the browser's numbers are ignored.
export const POST = route(async (req) => {
  rateLimit(req, 'order', { limit: 20 });
  const { items, customer } = validateOrder(await readJson(req));
  const user = await getCurrentUser();

  const order = await write((db) => {
    const now = new Date();
    const lines = items.map(({ productId, qty }) => {
      const p = db.products.find((x) => x.id === productId && x.status === 'active');
      if (!p) throw new HttpError(400, 'One of the pieces in your bag is no longer available.');
      if (p.stock < qty) throw new HttpError(409, `Only ${p.stock} left of ${p.name}. Please update your bag.`);
      const pricing = priceProduct(p, db.offers, now);
      return {
        productId: p.id,
        name: p.name,
        image: p.images?.[0] || null,
        category: p.category,
        qty,
        unitPrice: pricing.finalPrice,
        listPrice: pricing.price,
        offerName: pricing.offer?.name || null,
      };
    });

    // Reserve stock.
    for (const l of lines) db.products.find((p) => p.id === l.productId).stock -= l.qty;

    db.meta.orderCounter = (db.meta.orderCounter || 1000) + 1;
    const subtotal = lines.reduce((s, l) => s + l.listPrice * l.qty, 0);
    const total = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const o = {
      id: newId('ord'),
      number: `AU${db.meta.orderCounter}`,
      userId: user?.id || null,
      customer: { ...customer, email: customer.email || user?.email || '' },
      items: lines,
      subtotal,
      discount: subtotal - total,
      total,
      status: 'new',
      adminNote: '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    db.orders.push(o);
    return o;
  });

  const { adminNote, ...publicOrder } = order;
  return Response.json({ order: publicOrder, whatsappUrl: orderWhatsappUrl(order) }, { status: 201 });
});

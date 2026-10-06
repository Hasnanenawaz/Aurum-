import { route, readJson } from '@/lib/http';
import { write, newId, uniqueSlug } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { listProducts } from '@/lib/store';
import { validateProduct } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// GET /api/products?category=rings&q=bow&tag=birthday&sort=price-asc&ids=a,b&featured=1
// Admins can add ?all=1 to include draft products.
export const GET = route(async (req) => {
  const sp = req.nextUrl.searchParams;
  const includeDrafts = sp.get('all') === '1';
  if (includeDrafts) await requireAdmin();
  const products = await listProducts({
    category: sp.get('category') || undefined,
    q: sp.get('q') || undefined,
    tag: sp.get('tag') || undefined,
    sort: sp.get('sort') || undefined,
    ids: sp.get('ids')?.split(',').filter(Boolean),
    featured: sp.get('featured') === '1',
    includeDrafts,
  });
  return { products };
});

// POST /api/products — create (admin)
export const POST = route(async (req) => {
  await requireAdmin();
  const data = validateProduct(await readJson(req));
  const product = await write((db) => {
    const now = new Date().toISOString();
    const p = {
      id: newId('prd'),
      slug: uniqueSlug(db, data.name),
      salePrice: null,
      description: '',
      material: '',
      images: [],
      tags: [],
      stock: 0,
      featured: false,
      status: 'active',
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    db.products.push(p);
    return p;
  });
  return Response.json({ product }, { status: 201 });
});


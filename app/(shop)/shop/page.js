import Link from 'next/link';
import { Suspense } from 'react';
import { listProducts } from '@/lib/store';
import { CATEGORIES, OCCASIONS, categoryName } from '@/lib/catalog';
import ProductCard from '@/components/ProductCard';
import SortSelect from '@/components/SortSelect';

export async function generateMetadata({ searchParams }) {
  const { category } = await searchParams;
  const name = category ? categoryName(category) : 'All jewellery';
  return {
    title: name,
    description: `Shop Aurum ${name.toLowerCase()} — gift-boxed with a handwritten To/From tag.`,
  };
}

export default async function ShopPage({ searchParams }) {
  const { category, q, tag, sort } = await searchParams;
  const products = await listProducts({ category, q, tag, sort });
  const cat = CATEGORIES.find((c) => c.slug === category);
  const occasion = OCCASIONS.find((o) => o.tag === tag);

  const title = q ? `“${q}”` : cat?.name || occasion?.name || 'All jewellery';
  const sub = q
    ? `${products.length} piece${products.length === 1 ? '' : 's'} found`
    : cat?.blurb || occasion?.line || 'Every piece arrives gift-boxed and ready to give.';

  const href = (c) => {
    const p = new URLSearchParams();
    if (c) p.set('category', c);
    if (sort) p.set('sort', sort);
    const s = p.toString();
    return s ? `/shop?${s}` : '/shop';
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">{q ? 'Search' : occasion ? 'Gift for' : 'Shop'}</p>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>{title}</h1>
          <p>{sub}</p>
        </div>
      </section>

      <div className="container">
        <div className="filter-bar">
          <nav className="pill-row" aria-label="Filter by category">
            <Link href={href()} className={`pill${!category ? ' active' : ''}`}>All</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={href(c.slug)} className={`pill${category === c.slug ? ' active' : ''}`}>
                {c.name}
              </Link>
            ))}
          </nav>
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>

        {products.length ? (
          <div className="product-grid">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>Nothing here just yet</h2>
            <p>Try another category, or message us on Instagram — we can often source a piece for you.</p>
            <Link href="/shop" className="btn" style={{ marginTop: 20 }}>See everything</Link>
          </div>
        )}
      </div>
    </>
  );
}

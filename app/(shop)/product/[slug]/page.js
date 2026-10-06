import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, listProducts } from '@/lib/store';
import { categoryName, formatINR } from '@/lib/catalog';
import { BRAND } from '@/lib/brand';
import Gallery from '@/components/Gallery';
import Price from '@/components/Price';
import AddToBag from '@/components/AddToBag';
import ProductCard from '@/components/ProductCard';
import { TagIcon } from '@/components/Icons';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: 'Not found' };
  return {
    title: p.name,
    description: p.description?.slice(0, 155),
    openGraph: { title: `${p.name} · Aurum`, images: p.images?.length ? [p.images[0]] : ['/brand/aurum-logo.jpg'] },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = (await listProducts({ category: product.category })).filter((p) => p.id !== product.id).slice(0, 4);
  const { pricing } = product;

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href={`/shop?category=${product.category}`}>{categoryName(product.category)}</Link> / {product.name}
      </nav>

      <div className="pdp">
        <Gallery product={product} />

        <div className="pdp-info">
          <p className="eyebrow">{categoryName(product.category)}</p>
          <h1>{product.name}</h1>
          <Price pricing={pricing} large />

          {pricing.offer && (
            <div className="offer-note">
              <TagIcon />
              <span>
                <strong>{pricing.offer.name}</strong> applied — you save {formatINR(pricing.price - pricing.finalPrice)}
              </span>
            </div>
          )}

          <p className="pdp-desc">{product.description}</p>

          <AddToBag productId={product.id} stock={product.stock} />

          <div className="faq spec-list">
            <details open>
              <summary>Details</summary>
              <p>{product.material || 'Details coming soon.'}</p>
            </details>
            <details>
              <summary>Gift wrapping</summary>
              <p>Arrives in the cream Aurum box with a rose ribbon and a To/From tag. Add your message at checkout.</p>
            </details>
            <details>
              <summary>Care</summary>
              <p>Keep away from perfume and water. Wipe with a soft cloth and store in its box to keep the shine.</p>
            </details>
            <details>
              <summary>Questions?</summary>
              <p>
                Message us on{' '}
                <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
                  Instagram
                </a>{' '}
                — we usually reply within a few hours.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <p className="eyebrow">Pairs beautifully with</p>
            <h2>More {categoryName(product.category).toLowerCase()}</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: product.images?.[0] ? `${BRAND.siteUrl}${product.images[0]}` : undefined,
            brand: { '@type': 'Brand', name: 'Aurum' },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: pricing.finalPrice,
              availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />
    </div>
  );
}

import { Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getHeadlineOffer } from '@/lib/store';
import { categoryName } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }) {
  const offer = await getHeadlineOffer();
  const offerHref = offer?.scope === 'category' && offer.categories?.length === 1 ? `/shop?category=${offer.categories[0]}` : '/shop';

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="announce">
        {offer ? (
          <>
            <strong>{offer.name}</strong> · {offer.description ||
              `${offer.type === 'percent' ? `${offer.value}%` : `₹${offer.value}`} off${offer.scope === 'category' ? ` ${offer.categories.map(categoryName).join(', ')}` : ''}`}
            <Link href={offerHref}>Shop now</Link>
          </>
        ) : (
          <>Every piece arrives gift-boxed with a handwritten To/From tag</>
        )}
      </div>
      <Suspense fallback={<div style={{ height: 127 }} />}>
        <Header />
      </Suspense>
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { CATEGORIES } from '@/lib/catalog';
import { BRAND } from '@/lib/brand';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        {/* The footer repeats the one main action: find a gift. */}
        <div className="footer-cta">
          <p className="eyebrow" style={{ color: 'var(--blush)' }}>Somebody deserves a smile</p>
          <h2>Find the piece, we&rsquo;ll do the wrapping.</h2>
          <p>Every order leaves in an Aurum gift box with a handwritten To/From tag — tell us who it&rsquo;s for at checkout.</p>
          <Link href="/shop" className="btn btn-light">Find a gift</Link>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <Image src="/brand/aurum-badge.png" alt="Aurum gives smile logo" width={92} height={88} />
            <p style={{ margin: 0, maxWidth: 260, fontSize: '0.92rem' }}>
              Jewellery chosen to be given. Boxed, tagged and sent with a smile.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop?category=${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link href="/#faq">FAQs</Link></li>
              <li><Link href="/#faq">Shipping &amp; delivery</Link></li>
              <li><Link href="/#faq">Jewellery care</Link></li>
              <li><Link href="/account">Your account</Link></li>
            </ul>
          </div>
          <div>
            <h4>Say hello</h4>
            <ul>
              <li>
                <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">@{BRAND.instagramHandle}</a>
              </li>
              {BRAND.whatsappNumber && (
                <li>
                  <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Aurum. All rights reserved.</span>
          <span>Made in India with a smile.</span>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import { listProducts, getHeadlineOffer } from '@/lib/store';
import { CATEGORIES, OCCASIONS, placeholderFor, categoryName } from '@/lib/catalog';
import { BRAND } from '@/lib/brand';
import ProductCard from '@/components/ProductCard';
import ProductImage from '@/components/ProductImage';
import Countdown from '@/components/Countdown';
import { ChatIcon, GiftIcon, InstagramIcon, SparkleIcon, TagIcon } from '@/components/Icons';

// FAQ copy is a starting point — confirm shipping times, plating and returns with the brand.
const FAQS = [
  ['Is every order gift-wrapped?', 'Yes. Every piece leaves in the cream Aurum box tied with a rose ribbon, plus a To/From tag. Add a note at checkout and we write it on the tag by hand.'],
  ['What is the jewellery made of?', 'Our pieces are 18k gold-plated with an anti-tarnish coating, so they keep their shine with everyday wear. Each product page lists its exact material.'],
  ['How long does delivery take?', 'Orders are packed within 1–2 working days. Delivery across India usually takes 3–7 days depending on your city. We share tracking on WhatsApp.'],
  ['Can I send a gift straight to someone else?', 'Of course. Put their address at checkout and your message in the gift note. We never put the price inside the box.'],
  ['How do I care for my piece?', 'Keep it away from perfume and water, wipe it with a soft cloth after wearing, and store it in its Aurum box. That’s it.'],
  ['How do I place an order?', 'Add pieces to your bag and check out — your order goes straight to us on WhatsApp so we can confirm it with you personally.'],
];

export default async function HomePage() {
  const [featured, offer, giftSets] = await Promise.all([
    listProducts({ featured: true }),
    getHeadlineOffer(),
    listProducts({ category: 'gift-sets' }),
  ]);
  const heroProduct = giftSets[0] || featured[0];
  const offerHref = offer?.scope === 'category' && offer.categories?.length === 1 ? `/shop?category=${offer.categories[0]}` : '/shop';

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Jewellery for giving</p>
            <h1>
              The gift that opens
              <span className="script">into a smile</span>
            </h1>
            <p>
              Rings, pendants and earrings chosen to be given — each one boxed in cream, tied in rose ribbon and
              tagged by hand with your message.
            </p>
            <div className="hero-actions">
              <Link href="/shop" className="btn">Find a gift</Link>
              <Link href="/shop?category=gift-sets" className="btn btn-ghost">See gift sets</Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="arch">
              {heroProduct ? (
                <ProductImage product={heroProduct} priority sizes="(max-width: 900px) 80vw, 470px" alt={`${heroProduct.name}, boxed as a gift`} />
              ) : (
                <Image src={placeholderFor('gift-sets')} alt="" fill unoptimized />
              )}
            </div>
            <div className="hero-badge">
              <Image src="/brand/aurum-badge.png" alt="Aurum gives smile" width={116} height={110} />
            </div>
            <div className="hero-tag">
              <span className="muted">To: someone special</span>
              <strong>From: you, with a smile</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── Promises strip ── */}
      <section className="promises" aria-label="What comes with every order">
        <div className="container">
          <ul>
            <li><GiftIcon /> Gift-boxed, always</li>
            <li><TagIcon /> Handwritten To/From tag</li>
            <li><SparkleIcon /> Anti-tarnish finish</li>
            <li><ChatIcon /> Order help on WhatsApp</li>
          </ul>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Shop by category</p>
            <h2>Something for every kind of smile</h2>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} className="cat-tile">
                <div className="cat-img" style={{ position: 'relative' }}>
                  <Image src={placeholderFor(c.slug)} alt="" fill unoptimized sizes="20vw" />
                </div>
                <h3>{c.name}</h3>
                <p>{c.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live offer (managed from Admin → Offers) ── */}
      {offer && (
        <section className="container" aria-label="Current offer">
          <div className="offer-band">
            <div className="offer-number">
              {offer.type === 'percent' ? `${offer.value}%` : `₹${offer.value}`}
              <small>off{offer.scope === 'category' ? ` ${offer.categories.map(categoryName).join(' & ')}` : ''}</small>
            </div>
            <div>
              <p className="eyebrow" style={{ color: 'var(--blush)' }}>Limited time</p>
              <h2>{offer.name}</h2>
              <p>{offer.description}</p>
              {offer.endsAt && <Countdown endsAt={offer.endsAt} />}
            </div>
            <Link href={offerHref} className="btn btn-light">Shop the offer</Link>
          </div>
        </section>
      )}

      {/* ── Featured ── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Most gifted</p>
            <h2>The pieces people come back for</h2>
            <p>Our most-loved picks, chosen again and again for birthdays, anniversaries and no reason at all.</p>
          </div>
          <div className="product-grid">
            {/* Show complete rows of 4 so the grid never ends on a lonely card */}
            {featured.slice(0, featured.length >= 8 ? 8 : 4).map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <Link href="/shop" className="btn btn-ghost">Shop all jewellery</Link>
          </div>
        </div>
      </section>

      {/* ── Gift ritual ── */}
      <section className="section ritual">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">How an Aurum gift arrives</p>
            <h2>Three steps from <span className="script">click</span> to smile</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">01</div>
              <h3>Pick the piece</h3>
              <p>Choose from rings, pendants, studs, bracelets or a ready-made gift set.</p>
            </div>
            <div className="step">
              <div className="step-num">02</div>
              <h3>Tell us what to write</h3>
              <p>Add a gift note at checkout. We write it by hand on the To/From tag and tie it to the ribbon.</p>
            </div>
            <div className="step">
              <div className="step-num">03</div>
              <h3>We send the smile</h3>
              <p>Your order is confirmed on WhatsApp, packed in the cream Aurum box and shipped with tracking.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Occasions ── */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Gift by occasion</p>
            <h2>Who&rsquo;s smiling next?</h2>
          </div>
          <div className="occasion-grid">
            {OCCASIONS.map((o) => (
              <Link key={o.tag} href={`/shop?tag=${o.tag}`} className="occasion">
                <div>
                  <h3>{o.name}</h3>
                  <p>{o.line}</p>
                </div>
                <span className="link-arrow">Shop gifts</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instagram ── */}
      <section className="container">
        <div className="insta">
          <p className="eyebrow">Follow the smiles</p>
          <h2>See how Aurum gifts are opened</h2>
          <span className="handle">@{BRAND.instagramHandle}</span>
          <a className="btn btn-ghost" href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
            <InstagramIcon /> Follow on Instagram
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow">Good to know</p>
            <h2>Questions, answered</h2>
          </div>
          <div className="faq">
            {FAQS.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
          }),
        }}
      />
    </>
  );
}

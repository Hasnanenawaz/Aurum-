'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { clearBag, getBag, onBagChange, removeFromBag, setQty } from '@/lib/bag';
import { categoryName, formatINR } from '@/lib/catalog';
import { BRAND } from '@/lib/brand';
import ProductImage from '@/components/ProductImage';

export default function BagClient() {
  const [bag, setBag] = useState(null); // null = loading
  const [products, setProducts] = useState({});
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '', giftNote: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null); // { order, whatsappUrl }

  // Load bag + keep in sync with other tabs.
  useEffect(() => {
    setBag(getBag());
    return onBagChange(setBag);
  }, []);

  // Fetch live prices for whatever is in the bag.
  const ids = bag?.map((i) => i.id).join(',') || '';
  useEffect(() => {
    if (!ids) return;
    fetch(`/api/products?ids=${ids}`)
      .then((r) => r.json())
      .then(({ products }) => setProducts(Object.fromEntries((products || []).map((p) => [p.id, p]))));
  }, [ids]);

  // Prefill from the signed-in account, if any.
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(({ user }) => user && setCustomer((c) => ({ ...c, name: c.name || user.name, email: c.email || user.email, phone: c.phone || user.phone || '' })))
      .catch(() => {});
  }, []);

  const lines = useMemo(() => (bag || []).map((i) => ({ ...i, product: products[i.id] })).filter((l) => l.product), [bag, products]);
  const subtotal = lines.reduce((s, l) => s + l.product.pricing.price * l.qty, 0);
  const total = lines.reduce((s, l) => s + l.product.pricing.finalPrice * l.qty, 0);

  async function placeOrder(e) {
    e.preventDefault();
    setPlacing(true);
    setErrors({});
    setFormError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines.map((l) => ({ productId: l.id, qty: l.qty })), customer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.details || {});
        setFormError(data.error || 'Could not place the order.');
        return;
      }
      clearBag();
      setPlaced(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setFormError('Network problem — please try again.');
    } finally {
      setPlacing(false);
    }
  }

  const set = (k) => (e) => setCustomer((c) => ({ ...c, [k]: e.target.value }));

  if (placed) {
    return (
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: 560 }}>
        <p className="eyebrow">Order {placed.order.number}</p>
        <h1 style={{ fontSize: '2.6rem' }}>
          Thank you, <span className="script">{placed.order.customer.name.split(' ')[0]}</span>
        </h1>
        <p className="muted">
          We&rsquo;ve saved your order for {formatINR(placed.order.total)}.{' '}
          {placed.whatsappUrl ? 'Tap below to send it to us on WhatsApp — we’ll confirm payment and delivery with you there.' : 'We’ll get in touch shortly to confirm payment and delivery.'}
        </p>
        <div style={{ display: 'grid', gap: 12, marginTop: 24 }}>
          {placed.whatsappUrl ? (
            <a className="btn btn-block" href={placed.whatsappUrl} target="_blank" rel="noopener noreferrer">Send order on WhatsApp</a>
          ) : (
            <a className="btn btn-block" href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">Message us on Instagram</a>
          )}
          <Link href="/shop" className="btn btn-ghost btn-block">Keep shopping</Link>
        </div>
      </div>
    );
  }

  if (bag === null) return <p className="empty">Opening your bag…</p>;

  if (!bag.length) {
    return (
      <div className="empty">
        <h2>Your bag is empty</h2>
        <p>Somebody out there is waiting for a smile.</p>
        <Link href="/shop" className="btn" style={{ marginTop: 20 }}>Find a gift</Link>
      </div>
    );
  }

  return (
    <div className="bag-layout">
      <section aria-label="Items in your bag">
        {lines.length === 0 && <p className="muted">Loading your pieces…</p>}
        {lines.map((l) => (
          <div key={l.id} className="bag-line">
            <div className="thumb" style={{ position: 'relative' }}>
              <ProductImage product={l.product} sizes="96px" />
            </div>
            <div>
              <span className="muted" style={{ fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                {categoryName(l.product.category)}
              </span>
              <h3>
                <Link href={`/product/${l.product.slug}`}>{l.product.name}</Link>
              </h3>
              <div className="price">
                <span className="now">{formatINR(l.product.pricing.finalPrice)}</span>
                {l.product.pricing.offer && <span className="was">{formatINR(l.product.pricing.price)}</span>}
              </div>
              <button className="text-btn" onClick={() => removeFromBag(l.id)}>Remove</button>
            </div>
            <div className="qty">
              <button aria-label={`One less ${l.product.name}`} onClick={() => setQty(l.id, l.qty - 1)}>−</button>
              <span>{l.qty}</span>
              <button aria-label={`One more ${l.product.name}`} onClick={() => setQty(l.id, Math.min(l.qty + 1, l.product.stock, 10))}>+</button>
            </div>
          </div>
        ))}
      </section>

      <form className="summary-card" onSubmit={placeOrder} noValidate>
        <h2 style={{ fontSize: '1.9rem' }}>Order summary</h2>
        <div className="summary-row"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
        {subtotal > total && (
          <div className="summary-row" style={{ color: 'var(--success)' }}>
            <span>Offer savings</span><span>−{formatINR(subtotal - total)}</span>
          </div>
        )}
        <div className="summary-row"><span>Gift box &amp; tag</span><span>Included</span></div>
        <div className="summary-row total"><span>Total</span><span>{formatINR(total)}</span></div>

        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '22px 0' }} />
        <h3 style={{ fontSize: '1.3rem' }}>Delivery details</h3>
        {formError && <div className="form-error" role="alert">{formError}</div>}

        <Field label="Your name" error={errors.name}>
          <input className="input" value={customer.name} onChange={set('name')} autoComplete="name" required />
        </Field>
        <Field label="WhatsApp number" error={errors.phone}>
          <input className="input" value={customer.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" required />
        </Field>
        <Field label="Email (optional)">
          <input className="input" type="email" value={customer.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Delivery address" error={errors.address}>
          <textarea className="textarea" value={customer.address} onChange={set('address')} autoComplete="street-address" placeholder="House, street, city, PIN" required />
        </Field>
        <Field label="Gift tag note (optional)">
          <input className="input" value={customer.giftNote} onChange={set('giftNote')} maxLength={120} placeholder="To Riya — happy birthday! Love, Ananya" />
        </Field>

        <button className="btn btn-block" disabled={placing || !lines.length}>
          {placing ? 'Placing order…' : 'Place order'}
        </button>
        <p className="muted" style={{ fontSize: '0.8rem', textAlign: 'center', marginBottom: 0 }}>
          We confirm payment and delivery with you on WhatsApp.
        </p>
      </form>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="field">
      <label>
        <span className="label">{label}</span>
        <span style={{ display: 'block', marginTop: 6 }}>{children}</span>
      </label>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

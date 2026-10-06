'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '@/lib/api-client';
import { CATEGORIES, categoryName, formatINR } from '@/lib/catalog';
import Drawer from '@/components/admin/Drawer';

const EMPTY = {
  name: '',
  description: '',
  type: 'percent',
  value: 10,
  scope: 'all',
  categories: [],
  productIds: [],
  startsAt: '',
  endsAt: '',
  active: true,
  showInBanner: true,
};

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function OffersAdmin() {
  const [offers, setOffers] = useState(null);
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => api('/api/offers').then((d) => setOffers(d.offers)), []);
  useEffect(() => {
    load();
    api('/api/products?all=1').then((d) => setProducts(d.products));
  }, [load]);

  async function toggle(o) {
    await api(`/api/offers/${o.id}`, { method: 'PATCH', body: { active: !o.active } });
    load();
  }
  async function remove(o) {
    if (!confirm(`Delete the offer “${o.name}”? Prices go back to normal straight away.`)) return;
    await api(`/api/offers/${o.id}`, { method: 'DELETE' });
    load();
  }

  const scopeText = (o) =>
    o.scope === 'all'
      ? 'Whole store'
      : o.scope === 'category'
        ? o.categories.map(categoryName).join(', ')
        : `${o.productIds.length} product${o.productIds.length === 1 ? '' : 's'}`;

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Offers &amp; prices</h1>
          <p>Run a discount on the whole store, a category or hand-picked pieces. The best price always wins — offers never stack.</p>
        </div>
        <button className="btn" onClick={() => setEditing({ ...EMPTY })}>+ New offer</button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Offer</th>
              <th>Discount</th>
              <th>Applies to</th>
              <th>Runs</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(offers || []).map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.name}</strong>
                  {o.description && (
                    <>
                      <br />
                      <span className="muted" style={{ fontSize: '0.82rem' }}>{o.description}</span>
                    </>
                  )}
                </td>
                <td style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--maroon)' }}>
                  {o.type === 'percent' ? `${o.value}%` : formatINR(o.value)}
                </td>
                <td>{scopeText(o)}</td>
                <td style={{ fontSize: '0.85rem' }}>
                  {o.startsAt ? fmtDate(o.startsAt, true) : 'Now'} → {o.endsAt ? fmtDate(o.endsAt, true) : 'No end'}
                </td>
                <td><span className={`status ${o.status}`}>{o.status}</span></td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => toggle(o)}>{o.active ? 'Pause' : 'Resume'}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(o)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(o)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {offers && offers.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 40 }}>No offers yet. Create one for the next festival!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <OfferForm
          initial={editing}
          products={products}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function OfferForm({ initial, products, onClose, onSaved }) {
  const isNew = !initial.id;
  const [f, setF] = useState({ ...EMPTY, ...initial, startsAt: toLocalInput(initial.startsAt), endsAt: toLocalInput(initial.endsAt) });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const toggleIn = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((i) => i !== v) : [...x[k], v] }));

  // Live preview: what one sample product would cost.
  const sample = products.find((p) => f.scope === 'all' || (f.scope === 'category' ? f.categories.includes(p.category) : f.productIds.includes(p.id)));
  const preview = sample && Number(f.value) > 0
    ? Math.max(0, Math.round(f.type === 'flat' ? sample.price - Number(f.value) : sample.price * (1 - Number(f.value) / 100)))
    : null;

  async function save() {
    setSaving(true);
    setErrors({});
    setError('');
    const body = {
      ...f,
      value: Number(f.value),
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
    };
    delete body.id;
    delete body.status;
    delete body.createdAt;
    delete body.updatedAt;
    try {
      if (isNew) await api('/api/offers', { method: 'POST', body });
      else await api(`/api/offers/${initial.id}`, { method: 'PATCH', body });
      onSaved();
    } catch (err) {
      setErrors(err.details || {});
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={isNew ? 'New offer' : `Edit ${initial.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create offer' : 'Save offer'}</button>
        </>
      }
    >
      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="field">
        <label htmlFor="o-name">Offer name (shown to customers)</label>
        <input id="o-name" className="input" value={f.name} onChange={set('name')} placeholder="e.g. Diwali Glow" />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>
      <div className="field">
        <label htmlFor="o-desc">Short line for the banner (optional)</label>
        <input id="o-desc" className="input" value={f.description} onChange={set('description')} placeholder="e.g. 20% off all earrings this week" />
      </div>

      <div className="two-col">
        <div className="field">
          <label htmlFor="o-type">Discount type</label>
          <select id="o-type" className="select" value={f.type} onChange={set('type')}>
            <option value="percent">Percent off (%)</option>
            <option value="flat">Flat amount off (₹)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="o-val">{f.type === 'percent' ? 'Percent' : 'Amount (₹)'}</label>
          <input id="o-val" className="input" type="number" min="1" value={f.value} onChange={set('value')} />
          {errors.value && <span className="field-error">{errors.value}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="o-scope">Applies to</label>
        <select id="o-scope" className="select" value={f.scope} onChange={set('scope')}>
          <option value="all">Every product</option>
          <option value="category">Certain categories</option>
          <option value="products">Hand-picked products</option>
        </select>
      </div>

      {f.scope === 'category' && (
        <div className="field">
          <span className="label">Categories</span>
          <div className="check-grid">
            {CATEGORIES.map((c) => (
              <label key={c.slug} className="checkbox">
                <input type="checkbox" checked={f.categories.includes(c.slug)} onChange={() => toggleIn('categories', c.slug)} /> {c.name}
              </label>
            ))}
          </div>
          {errors.categories && <span className="field-error">{errors.categories}</span>}
        </div>
      )}

      {f.scope === 'products' && (
        <div className="field">
          <span className="label">Products</span>
          <div className="check-grid">
            {products.map((p) => (
              <label key={p.id} className="checkbox" style={{ fontSize: '0.88rem' }}>
                <input type="checkbox" checked={f.productIds.includes(p.id)} onChange={() => toggleIn('productIds', p.id)} /> {p.name}
              </label>
            ))}
          </div>
          {errors.productIds && <span className="field-error">{errors.productIds}</span>}
        </div>
      )}

      <div className="two-col">
        <div className="field">
          <label htmlFor="o-start">Starts (empty = now)</label>
          <input id="o-start" className="input" type="datetime-local" value={f.startsAt} onChange={set('startsAt')} />
        </div>
        <div className="field">
          <label htmlFor="o-end">Ends (empty = never)</label>
          <input id="o-end" className="input" type="datetime-local" value={f.endsAt} onChange={set('endsAt')} />
          {errors.endsAt && <span className="field-error">{errors.endsAt}</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
        <label className="checkbox"><input type="checkbox" checked={f.active} onChange={set('active')} /> Offer is switched on</label>
        <label className="checkbox"><input type="checkbox" checked={f.showInBanner} onChange={set('showInBanner')} /> Show in the top banner and homepage</label>
      </div>

      {preview !== null && (
        <div className="offer-note">
          Preview: <strong>{sample.name}</strong> goes from {formatINR(sample.price)} to <strong>{formatINR(preview)}</strong>
        </div>
      )}
    </Drawer>
  );
}

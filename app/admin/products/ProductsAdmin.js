'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api-client';
import { CATEGORIES, OCCASIONS, categoryName, formatINR } from '@/lib/catalog';
import ProductImage from '@/components/ProductImage';
import Drawer from '@/components/admin/Drawer';

const EMPTY = {
  name: '',
  category: 'rings',
  price: '',
  salePrice: '',
  description: '',
  material: '18k gold-plated brass, anti-tarnish coating',
  images: [],
  tags: [],
  stock: 10,
  featured: false,
  status: 'active',
};

export default function ProductsAdmin() {
  const params = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(null); // product object, or EMPTY for new
  const [notice, setNotice] = useState('');

  const load = useCallback(() => api('/api/products?all=1&sort=newest').then((d) => setProducts(d.products)), []);
  useEffect(() => {
    load();
  }, [load]);

  // Dashboard "+ Add product" links here with ?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing({ ...EMPTY });
      router.replace('/admin/products');
    }
  }, [params, router]);

  const shown = useMemo(
    () =>
      (products || [])
        .filter((p) => !cat || p.category === cat)
        .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())),
    [products, q, cat]
  );

  async function quickUpdate(p, changes) {
    const { product } = await api(`/api/products/${p.id}`, { method: 'PATCH', body: changes });
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, ...product } : x)));
    load(); // refresh pricing
  }

  async function remove(p) {
    if (!confirm(`Delete “${p.name}”? This can’t be undone.`)) return;
    await api(`/api/products/${p.id}`, { method: 'DELETE' });
    setProducts((list) => list.filter((x) => x.id !== p.id));
    flash(`Deleted ${p.name}`);
  }

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Products</h1>
          <p>{products ? `${products.length} pieces · ${products.filter((p) => p.status === 'draft').length} drafts` : 'Loading…'}</p>
        </div>
        <button className="btn" onClick={() => setEditing({ ...EMPTY })}>+ Add product</button>
      </div>

      {notice && <div className="form-success">{notice}</div>}

      <div className="toolbar">
        <input className="input" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Product</th>
              <th>Price</th>
              <th>Customer pays</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="thumb"><ProductImage product={p} sizes="52px" /></div>
                </td>
                <td>
                  <strong>{p.name}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: '0.82rem' }}>{categoryName(p.category)}</span>
                </td>
                <td>{formatINR(p.price)}</td>
                <td>
                  {formatINR(p.pricing.finalPrice)}
                  {p.pricing.offer && (
                    <>
                      <br />
                      <span className="muted" style={{ fontSize: '0.78rem' }}>{p.pricing.offer.name} · −{p.pricing.discountPercent}%</span>
                    </>
                  )}
                </td>
                <td>
                  <span className={p.stock <= 3 ? 'status cancelled' : ''}>{p.stock}</span>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={p.featured}
                    onChange={(e) => quickUpdate(p, { featured: e.target.checked })}
                    aria-label={`Feature ${p.name} on the homepage`}
                    style={{ accentColor: 'var(--maroon)', width: 18, height: 18 }}
                  />
                </td>
                <td>
                  <select className="select" value={p.status} onChange={(e) => quickUpdate(p, { status: e.target.value })} aria-label={`Status of ${p.name}`}>
                    <option value="active">Live</option>
                    <option value="draft">Draft</option>
                  </select>
                </td>
                <td>
                  <div className="row-actions">
                    {p.status === 'active' && (
                      <Link className="btn btn-ghost btn-sm" href={`/product/${p.slug}`} target="_blank">View</Link>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {products && shown.length === 0 && (
              <tr>
                <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 40 }}>No products match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(p, isNew) => {
            setEditing(null);
            flash(isNew ? `Added ${p.name}` : `Saved ${p.name}`);
            load();
          }}
        />
      )}
    </>
  );
}

function ProductForm({ initial, onClose, onSaved }) {
  const isNew = !initial.id;
  const [f, setF] = useState({
    ...EMPTY,
    ...initial,
    salePrice: initial.salePrice ?? '',
    tags: initial.tags || [],
    images: initial.images || [],
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const toggleTag = (tag) => setF((x) => ({ ...x, tags: x.tags.includes(tag) ? x.tags.filter((t) => t !== tag) : [...x.tags, tag] }));

  async function upload(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    setUploading(true);
    setError('');
    try {
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        const { url } = await api('/api/upload', { method: 'POST', body });
        setF((x) => ({ ...x, images: [...x.images, url] }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setErrors({});
    setError('');
    const body = {
      name: f.name,
      category: f.category,
      price: f.price,
      salePrice: f.salePrice === '' ? null : f.salePrice,
      description: f.description,
      material: f.material,
      images: f.images,
      tags: f.tags,
      stock: Number(f.stock),
      featured: f.featured,
      status: f.status,
    };
    try {
      const { product } = isNew
        ? await api('/api/products', { method: 'POST', body })
        : await api(`/api/products/${initial.id}`, { method: 'PATCH', body });
      onSaved(product, isNew);
    } catch (err) {
      setErrors(err.details || {});
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={isNew ? 'Add a product' : `Edit ${initial.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={save} disabled={saving || uploading}>{saving ? 'Saving…' : isNew ? 'Add product' : 'Save changes'}</button>
        </>
      }
    >
      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="field">
        <label htmlFor="p-name">Name</label>
        <input id="p-name" className="input" value={f.name} onChange={set('name')} placeholder="e.g. Petal Halo Ring" />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="two-col">
        <div className="field">
          <label htmlFor="p-cat">Category</label>
          <select id="p-cat" className="select" value={f.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="p-stock">Stock</label>
          <input id="p-stock" className="input" type="number" min="0" step="1" value={f.stock} onChange={set('stock')} />
          {errors.stock && <span className="field-error">{errors.stock}</span>}
        </div>
        <div className="field">
          <label htmlFor="p-price">Price (₹)</label>
          <input id="p-price" className="input" type="number" min="1" value={f.price} onChange={set('price')} />
          {errors.price && <span className="field-error">{errors.price}</span>}
        </div>
        <div className="field">
          <label htmlFor="p-sale">Sale price (₹, optional)</label>
          <input id="p-sale" className="input" type="number" min="1" value={f.salePrice} onChange={set('salePrice')} placeholder="Leave empty for none" />
          {errors.salePrice && <span className="field-error">{errors.salePrice}</span>}
        </div>
      </div>
      <p className="muted" style={{ fontSize: '0.82rem', marginTop: -6 }}>
        Tip: to discount many products at once, use <strong>Offers &amp; prices</strong> instead of a sale price.
      </p>

      <div className="field">
        <span className="label">Photos</span>
        <div className="image-list">
          {f.images.map((src, i) => (
            <div className="img" key={src}>
              <ProductImage product={f} src={src} sizes="86px" alt={`Photo ${i + 1}`} />
              <button type="button" aria-label="Remove photo" onClick={() => setF((x) => ({ ...x, images: x.images.filter((s) => s !== src) }))}>×</button>
            </div>
          ))}
          <label className="upload-tile">
            {uploading ? 'Uploading…' : '+ Add photos'}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={upload} disabled={uploading} />
          </label>
        </div>
        <span className="muted" style={{ fontSize: '0.8rem' }}>JPG, PNG or WebP, up to 4 MB. The first photo is the cover.</span>
      </div>

      <div className="field">
        <label htmlFor="p-desc">Description</label>
        <textarea id="p-desc" className="textarea" value={f.description} onChange={set('description')} />
      </div>
      <div className="field">
        <label htmlFor="p-mat">Material / details</label>
        <input id="p-mat" className="input" value={f.material} onChange={set('material')} />
      </div>

      <div className="field">
        <span className="label">Gift occasions</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {OCCASIONS.map((o) => (
            <label key={o.tag} className="checkbox">
              <input type="checkbox" checked={f.tags.includes(o.tag)} onChange={() => toggleTag(o.tag)} /> {o.name}
            </label>
          ))}
        </div>
      </div>

      <div className="two-col">
        <label className="checkbox">
          <input type="checkbox" checked={f.featured} onChange={set('featured')} /> Feature on homepage
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={f.status === 'active'} onChange={(e) => setF((x) => ({ ...x, status: e.target.checked ? 'active' : 'draft' }))} /> Live on store
        </label>
      </div>
    </Drawer>
  );
}

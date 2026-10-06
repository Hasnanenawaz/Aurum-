'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatINR } from '@/lib/catalog';

export default function AccountClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const [state, setState] = useState({ loading: true, user: null, orders: [] });
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/auth/me');
    const d = await r.json();
    setState({ loading: false, user: d.user, orders: d.orders || [] });
    return d.user;
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError('');
    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErrors(data.details || {});
      setError(data.error);
      return;
    }
    // Admins go straight to the dashboard (or wherever they were heading).
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
    if (safeNext && (data.user.role === 'admin' || !safeNext.startsWith('/admin'))) {
      router.push(safeNext);
      router.refresh();
      return;
    }
    if (data.user.role === 'admin') {
      router.push('/admin');
      router.refresh();
      return;
    }
    await load();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setState({ loading: false, user: null, orders: [] });
    router.refresh();
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (state.loading) return <p className="empty">Loading…</p>;

  if (state.user) {
    const { user, orders } = state;
    return (
      <div className="auth-card" style={{ maxWidth: 720 }}>
        <p className="eyebrow">Your account</p>
        <h1 style={{ fontSize: '2.6rem' }}>
          Hello, <span className="script">{user.name.split(' ')[0]}</span>
        </h1>
        <p className="muted" style={{ marginTop: 0 }}>{user.email}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '20px 0 32px' }}>
          {user.role === 'admin' && <Link className="btn" href="/admin">Open admin panel</Link>}
          <Link className="btn btn-ghost" href="/shop">Shop</Link>
          <button className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
        <h2 style={{ fontSize: '1.7rem' }}>Your orders</h2>
        {orders.length === 0 ? (
          <p className="muted">No orders yet. Your first smile is waiting.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="summary-row" style={{ borderBottom: '1px solid var(--line)', padding: '14px 0', color: 'var(--ink)' }}>
              <span>
                <strong>#{o.number}</strong> · {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                <br />
                <span className="muted" style={{ fontSize: '0.88rem' }}>{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</span>
              </span>
              <span style={{ textAlign: 'right' }}>
                {formatINR(o.total)}
                <br />
                <span className="chip" style={{ marginTop: 4 }}>{o.status}</span>
              </span>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>Sign in</button>
        <button role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>Create account</button>
      </div>
      {next?.startsWith('/admin') && <div className="form-error">Please sign in with an admin account to continue.</div>}
      {error && <div className="form-error" role="alert">{error}</div>}
      <form onSubmit={submit} noValidate>
        {mode === 'register' && (
          <>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" className="input" value={form.name} onChange={set('name')} autoComplete="name" />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" className="input" value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={form.password}
            onChange={set('password')}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <button className="btn btn-block" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

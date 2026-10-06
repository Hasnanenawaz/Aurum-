'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, fmtDate } from '@/lib/api-client';
import { formatINR } from '@/lib/catalog';

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/stats').then(setS).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="form-error">{error}</div>;
  if (!s) return <p className="muted">Loading dashboard…</p>;

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Good to see you</h1>
          <p>Here&rsquo;s how Aurum is doing this month.</p>
        </div>
        <Link href="/admin/products?new=1" className="btn">+ Add product</Link>
      </div>

      <div className="stat-grid">
        <div className="stat"><span className="label">Revenue this month</span><b>{formatINR(s.revenueThisMonth)}</b><small>excluding cancelled orders</small></div>
        <div className="stat"><span className="label">Orders this month</span><b>{s.ordersThisMonth}</b><small>{s.newOrders} waiting for you</small></div>
        <div className="stat"><span className="label">Products live</span><b>{s.products}</b><small>{s.drafts} in draft</small></div>
        <div className="stat"><span className="label">Customers</span><b>{s.customers}</b><small>with accounts</small></div>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2>Latest orders</h2>
            <Link href="/admin/orders" className="link-arrow">All orders</Link>
          </div>
          {s.recentOrders.length === 0 ? (
            <p className="muted">No orders yet — they&rsquo;ll appear here the moment a customer checks out.</p>
          ) : (
            <table className="table">
              <tbody>
                {s.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.number}</strong><br /><span className="muted">{o.customer}</span></td>
                    <td>{fmtDate(o.createdAt)}</td>
                    <td>{formatINR(o.total)}</td>
                    <td><span className={`status ${o.status}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div>
          <section className="panel">
            <h2>Live offers</h2>
            {s.liveOffers.length === 0 ? (
              <p className="muted">No offers running. <Link href="/admin/offers" style={{ textDecoration: 'underline' }}>Start one</Link></p>
            ) : (
              s.liveOffers.map((o) => (
                <p key={o.id} style={{ margin: '0 0 10px' }}>
                  <strong>{o.name}</strong> — {o.type === 'percent' ? `${o.value}%` : formatINR(o.value)} off
                  <br />
                  <span className="muted" style={{ fontSize: '0.85rem' }}>{o.endsAt ? `Ends ${fmtDate(o.endsAt)}` : 'No end date'}</span>
                </p>
              ))
            )}
          </section>
          <section className="panel">
            <h2>Running low</h2>
            {s.lowStock.length === 0 ? (
              <p className="muted">Everything is well stocked.</p>
            ) : (
              s.lowStock.map((p) => (
                <p key={p.id} style={{ margin: '0 0 8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name}</span>
                  <span className="status cancelled">{p.stock} left</span>
                </p>
              ))
            )}
          </section>
        </div>
      </div>
    </>
  );
}

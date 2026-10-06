'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '@/lib/api-client';
import { ORDER_STATUSES, formatINR } from '@/lib/catalog';
import Drawer from '@/components/admin/Drawer';

export default function OrdersAdmin() {
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(null);

  const load = useCallback(() => api(`/api/orders${status ? `?status=${status}` : ''}`).then((d) => setOrders(d.orders)), [status]);
  useEffect(() => {
    load();
  }, [load]);

  async function setOrderStatus(o, next) {
    if (next === 'cancelled' && !confirm(`Cancel order #${o.number}? Its stock goes back on the shelf.`)) return;
    const { order } = await api(`/api/orders/${o.id}`, { method: 'PATCH', body: { status: next } });
    setOrders((list) => list.map((x) => (x.id === o.id ? order : x)));
    if (open?.id === o.id) setOpen(order);
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Orders</h1>
          <p>Orders arrive here at checkout and on your WhatsApp. Move them along as you pack and ship.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="pill-row">
          <button className={`pill${!status ? ' active' : ''}`} onClick={() => setStatus('')}>All</button>
          {ORDER_STATUSES.map((s) => (
            <button key={s} className={`pill${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o) => (
              <tr key={o.id}>
                <td><strong>#{o.number}</strong><br /><span className="muted" style={{ fontSize: '0.82rem' }}>{fmtDate(o.createdAt, true)}</span></td>
                <td>{o.customer.name}<br /><span className="muted" style={{ fontSize: '0.82rem' }}>{o.customer.phone}</span></td>
                <td style={{ maxWidth: 260 }}>{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</td>
                <td>{formatINR(o.total)}</td>
                <td>
                  <select className="select" value={o.status} onChange={(e) => setOrderStatus(o, e.target.value)} aria-label={`Status of order ${o.number}`}>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </td>
                <td><div className="row-actions"><button className="btn btn-ghost btn-sm" onClick={() => setOpen(o)}>Details</button></div></td>
              </tr>
            ))}
            {orders && orders.length === 0 && (
              <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 40 }}>No orders here yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Drawer title={`Order #${open.number}`} onClose={() => setOpen(null)}>
          <p><span className={`status ${open.status}`}>{open.status}</span> · <span className="muted">{fmtDate(open.createdAt, true)}</span></p>
          <h3>Customer</h3>
          <p style={{ marginTop: 0 }}>
            {open.customer.name}<br />
            <a href={`https://wa.me/${open.customer.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>{open.customer.phone}</a>
            {open.customer.email && <><br />{open.customer.email}</>}
          </p>
          <h3>Deliver to</h3>
          <p style={{ marginTop: 0, whiteSpace: 'pre-line' }}>{open.customer.address}</p>
          {open.customer.giftNote && (
            <>
              <h3>Write on the gift tag</h3>
              <p className="offer-note" style={{ fontStyle: 'italic' }}>&ldquo;{open.customer.giftNote}&rdquo;</p>
            </>
          )}
          <h3>Items</h3>
          {open.items.map((i) => (
            <div key={i.productId} className="summary-row" style={{ color: 'var(--ink)' }}>
              <span>{i.name} × {i.qty}{i.offerName && <span className="muted"> · {i.offerName}</span>}</span>
              <span>{formatINR(i.unitPrice * i.qty)}</span>
            </div>
          ))}
          {open.discount > 0 && <div className="summary-row"><span>Savings</span><span>−{formatINR(open.discount)}</span></div>}
          <div className="summary-row total"><span>Total</span><span>{formatINR(open.total)}</span></div>
        </Drawer>
      )}
    </>
  );
}

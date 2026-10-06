'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, fmtDate } from '@/lib/api-client';
import { formatINR } from '@/lib/catalog';

export default function UsersAdmin() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (role) p.set('role', role);
    return api(`/api/users?${p}`).then((d) => setUsers(d.users));
  }, [q, role]);

  useEffect(() => {
    const t = setTimeout(load, 250); // small debounce while typing
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => {
    api('/api/auth/me').then((d) => setMe(d.user));
  }, []);

  async function update(u, changes, confirmText) {
    if (confirmText && !confirm(confirmText)) return;
    setError('');
    try {
      await api(`/api/users/${u.id}`, { method: 'PATCH', body: changes });
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function remove(u) {
    if (!confirm(`Delete ${u.name}'s account? Their past orders are kept.`)) return;
    setError('');
    try {
      await api(`/api/users/${u.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Users</h1>
          <p>Customers sign up from the store. Make a trusted teammate an admin here.</p>
        </div>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="toolbar">
        <input className="input" placeholder="Search by name, email or phone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">Everyone</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Joined</th>
              <th>Last sign-in</th>
              <th>Orders</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(users || []).map((u) => {
              const isMe = me?.id === u.id;
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong> {isMe && <span className="chip">You</span>}
                    <br />
                    <span className="muted" style={{ fontSize: '0.82rem' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</span>
                  </td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>{fmtDate(u.lastLoginAt)}</td>
                  <td>
                    {u.orderCount}
                    {u.totalSpent > 0 && <span className="muted"> · {formatINR(u.totalSpent)}</span>}
                  </td>
                  <td>
                    <select
                      className="select"
                      value={u.role}
                      aria-label={`Role for ${u.name}`}
                      onChange={(e) =>
                        update(
                          u,
                          { role: e.target.value },
                          e.target.value === 'admin' ? `Give ${u.name} full admin access?` : `Remove admin access from ${u.name}?`
                        )
                      }
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td><span className={`status ${u.active ? 'active' : 'paused'}`}>{u.active ? 'Active' : 'Paused'}</span></td>
                  <td>
                    <div className="row-actions">
                      {!isMe && (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => update(u, { active: !u.active })}>
                            {u.active ? 'Pause' : 'Unpause'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {users && users.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 40 }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

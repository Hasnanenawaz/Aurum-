'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/offers', label: 'Offers & prices' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
];

export default function AdminSidebar({ userName }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/account');
    router.refresh();
  }

  return (
    <aside className="admin-side">
      <div className="admin-brand">
        <Image src="/brand/aurum-badge.png" alt="" width={44} height={42} />
        <div>
          <strong>AURUM</strong>
          <span>Admin</span>
        </div>
      </div>
      <nav className="admin-nav" aria-label="Admin">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="admin-side-foot">
        <span className="hide-mobile">Signed in as {userName}</span>
        <Link href="/" target="_blank">View store ↗</Link>
        <button onClick={logout}>Sign out</button>
      </div>
    </aside>
  );
}

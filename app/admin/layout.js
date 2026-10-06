import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminSidebar from './AdminSidebar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  // middleware.js already checked the cookie; this re-checks the live database
  // so a demoted or paused admin is locked out immediately.
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/account?next=/admin');

  return (
    <div className="admin">
      <AdminSidebar userName={user.name} />
      <main className="admin-main">{children}</main>
    </div>
  );
}

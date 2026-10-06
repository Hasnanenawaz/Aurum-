import { Suspense } from 'react';
import AccountClient from './AccountClient';

export const metadata = { title: 'Your account', robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="container">
      <Suspense>
        <AccountClient />
      </Suspense>
    </div>
  );
}

import { Suspense } from 'react';
import ProductsAdmin from './ProductsAdmin';

export default function Page() {
  return (
    <Suspense>
      <ProductsAdmin />
    </Suspense>
  );
}

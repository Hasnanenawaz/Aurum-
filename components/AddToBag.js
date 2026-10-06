'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { addToBag } from '@/lib/bag';

export default function AddToBag({ productId, stock }) {
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState(false);
  const max = Math.min(stock, 10);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (stock <= 0) {
    return (
      <div className="buy-row">
        <button className="btn btn-block" disabled>Sold out</button>
      </div>
    );
  }

  return (
    <>
      <div className="buy-row">
        <div className="qty" aria-label="Quantity">
          <button type="button" aria-label="One less" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span aria-live="polite">{qty}</span>
          <button type="button" aria-label="One more" onClick={() => setQty((q) => Math.min(max, q + 1))}>+</button>
        </div>
        <button
          className="btn"
          onClick={() => {
            addToBag(productId, qty);
            setToast(true);
          }}
        >
          Add to bag
        </button>
      </div>
      <p className={`stock-note${stock <= 3 ? ' low' : ''}`}>
        {stock <= 3 ? `Only ${stock} left — gift-boxed and ready to ship` : 'In stock · gift-boxed and ready to ship'}
      </p>
      {toast && (
        <div className="toast" role="status">
          Added to your bag <Link href="/bag">View bag</Link>
        </div>
      )}
    </>
  );
}

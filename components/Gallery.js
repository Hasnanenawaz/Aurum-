'use client';
import { useState } from 'react';
import ProductImage from './ProductImage';

export default function Gallery({ product }) {
  const images = product.images?.length ? product.images : [null];
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="gallery-main" style={{ position: 'relative' }}>
        <ProductImage product={product} src={images[active]} priority sizes="(max-width: 860px) 100vw, 55vw" />
      </div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((src, i) => (
            <button key={src} aria-label={`Show photo ${i + 1}`} aria-pressed={i === active} onClick={() => setActive(i)} style={{ position: 'relative' }}>
              <ProductImage product={product} src={src} sizes="76px" alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

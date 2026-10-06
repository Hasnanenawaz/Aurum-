import Image from 'next/image';
import { placeholderFor } from '@/lib/catalog';

// Shows the product's first photo, or its category illustration if none yet.
export default function ProductImage({ product, src, sizes = '(max-width: 680px) 50vw, 25vw', priority = false, alt }) {
  const url = src || product.images?.[0] || placeholderFor(product.category);
  return (
    <Image
      src={url}
      alt={alt ?? product.name}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={url.endsWith('.svg')}
      style={{ objectFit: 'cover' }}
    />
  );
}

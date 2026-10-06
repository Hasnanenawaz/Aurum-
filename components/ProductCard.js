import Link from 'next/link';
import { categoryName } from '@/lib/catalog';
import ProductImage from './ProductImage';
import Price from './Price';

export default function ProductCard({ product, priority }) {
  const { pricing } = product;
  const soldOut = product.stock <= 0;
  return (
    <Link href={`/product/${product.slug}`} className="product-card">
      <div className="product-media">
        <ProductImage product={product} priority={priority} />
        {soldOut ? (
          <span className="chip chip-muted">Sold out</span>
        ) : pricing.offer ? (
          <span className="chip chip-dark">{pricing.offer.name}</span>
        ) : product.featured ? (
          <span className="chip">Loved</span>
        ) : null}
      </div>
      <div className="product-info">
        <span className="cat">{categoryName(product.category)}</span>
        <h3>{product.name}</h3>
        <Price pricing={pricing} />
      </div>
    </Link>
  );
}

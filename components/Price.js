import { formatINR } from '@/lib/catalog';

export default function Price({ pricing, large = false }) {
  const { price, finalPrice, discountPercent } = pricing;
  const onOffer = finalPrice < price;
  return (
    <div className={`price${large ? ' price-lg' : ''}`}>
      <span className="now">{formatINR(finalPrice)}</span>
      {onOffer && (
        <>
          <span className="was">
            <span className="sr-only">Was </span>
            {formatINR(price)}
          </span>
          <span className="save">{discountPercent}% off</span>
        </>
      )}
    </div>
  );
}

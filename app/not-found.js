import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container empty" style={{ minHeight: '70vh', display: 'grid', placeContent: 'center' }}>
      <p className="eyebrow">404</p>
      <h1 style={{ fontSize: '3rem' }}>This piece has wandered off</h1>
      <p>It may have sold out or moved. Let&rsquo;s find you another smile.</p>
      <p style={{ marginTop: 24 }}>
        <Link href="/shop" className="btn">Back to the shop</Link>
      </p>
    </main>
  );
}

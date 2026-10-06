import BagClient from './BagClient';

export const metadata = { title: 'Your bag', robots: { index: false } };

export default function BagPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">Almost there</p>
          <h1 style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>Your bag</h1>
        </div>
      </section>
      <div className="container">
        <BagClient />
      </div>
    </>
  );
}

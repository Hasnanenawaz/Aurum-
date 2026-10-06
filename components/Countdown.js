'use client';
import { useEffect, useState } from 'react';

function parts(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60) };
}

// Live countdown to an offer's end date (renders nothing until mounted, to avoid hydration mismatch).
export default function Countdown({ endsAt }) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    const tick = () => setLeft(parts(new Date(endsAt) - Date.now()));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [endsAt]);
  if (!left) return <div className="countdown" aria-hidden="true" style={{ minHeight: 62 }} />;
  return (
    <div className="countdown" role="timer" aria-label={`Offer ends in ${left.days} days ${left.hours} hours`}>
      <div><b>{left.days}</b><span>days</span></div>
      <div><b>{left.hours}</b><span>hrs</span></div>
      <div><b>{left.mins}</b><span>mins</span></div>
    </div>
  );
}

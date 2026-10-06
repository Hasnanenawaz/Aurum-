'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="checkbox" style={{ gap: 12 }}>
      <span className="label">Sort</span>
      <select
        className="select"
        style={{ width: 'auto', minHeight: 42 }}
        value={params.get('sort') || ''}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set('sort', e.target.value);
          else next.delete('sort');
          router.push(`${pathname}?${next}`);
        }}
      >
        <option value="">Recommended</option>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </label>
  );
}

'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CATEGORIES } from '@/lib/catalog';
import { bagCount, getBag, onBagChange } from '@/lib/bag';
import { BagIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';

export default function Header() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setCount(bagCount(getBag()));
    return onBagChange((items) => setCount(bagCount(items)));
  }, []);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname, params]);

  const activeCat = pathname === '/shop' ? params.get('category') : null;

  function onSearch(e) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q')?.toString().trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
  }

  return (
    <header className="site-header">
      <div className="container header-row">
        <div className="header-left">
          <button
            className="icon-btn menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <button
            className="icon-btn"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
          >
            <SearchIcon />
          </button>
        </div>

        <Link href="/" className="wordmark" aria-label="Aurum — home">
          <span className="wordmark-main">AURUM</span>
          <span className="wordmark-sub">gives smile</span>
        </Link>

        <div className="header-right">
          <Link href="/account" className="icon-btn" aria-label="Your account">
            <UserIcon />
          </Link>
          <Link href="/bag" className="icon-btn" aria-label={`Your bag, ${count} item${count === 1 ? '' : 's'}`}>
            <BagIcon />
            {count > 0 && <span className="bag-count">{count}</span>}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="search-panel">
          <div className="container">
            <form role="search" onSubmit={onSearch}>
              <input className="input" name="q" placeholder="Search rings, pendants, gift sets…" autoFocus aria-label="Search the collection" />
              <button className="btn" type="submit">Search</button>
            </form>
          </div>
        </div>
      )}

      <nav id="main-nav" className={`main-nav${menuOpen ? ' open' : ''}`} aria-label="Collections">
        <ul>
          <li>
            <Link href="/shop" aria-current={pathname === '/shop' && !activeCat ? 'page' : undefined}>
              Shop all
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/shop?category=${c.slug}`} aria-current={activeCat === c.slug ? 'page' : undefined}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

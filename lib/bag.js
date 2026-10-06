'use client';
// The shopping bag lives in the browser (localStorage) as [{ id, qty }].
// Prices are never stored here — the bag page asks the server for live prices.

const KEY = 'aurum_bag_v1';
const EVENT = 'aurum:bag';

export function getBag() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => i && i.id && i.qty > 0) : [];
  } catch {
    return [];
  }
}

function save(items) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode — bag just won't persist */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: items }));
}

export function addToBag(id, qty = 1) {
  const items = getBag();
  const line = items.find((i) => i.id === id);
  if (line) line.qty = Math.min(20, line.qty + qty);
  else items.push({ id, qty });
  save(items);
}

export function setQty(id, qty) {
  save(getBag().map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0));
}

export function removeFromBag(id) {
  save(getBag().filter((i) => i.id !== id));
}

export function clearBag() {
  save([]);
}

export function bagCount(items = getBag()) {
  return items.reduce((n, i) => n + i.qty, 0);
}

/** Subscribe to bag changes (this tab and other tabs). Returns an unsubscribe fn. */
export function onBagChange(fn) {
  const local = () => fn(getBag());
  const storage = (e) => e.key === KEY && fn(getBag());
  window.addEventListener(EVENT, local);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener('storage', storage);
  };
}

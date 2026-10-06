// Shared catalogue constants — safe to import from client or server.

export const CATEGORIES = [
  { slug: 'rings', name: 'Rings', blurb: 'Stackable bands and solitaires' },
  { slug: 'necklaces', name: 'Necklaces', blurb: 'Pendants and fine chains' },
  { slug: 'earrings', name: 'Earrings', blurb: 'Studs, hoops and drops' },
  { slug: 'bracelets', name: 'Bracelets', blurb: 'Cuffs, chains and charms' },
  { slug: 'gift-sets', name: 'Gift Sets', blurb: 'Boxed and ready to give' },
];

export const OCCASIONS = [
  { tag: 'birthday', name: 'Birthday', line: 'A little gold for another year' },
  { tag: 'anniversary', name: 'Anniversary', line: 'For the one who stayed' },
  { tag: 'just-because', name: 'Just because', line: 'No reason needed' },
  { tag: 'self-gift', name: 'For yourself', line: 'You earned this one' },
];

export const ORDER_STATUSES = ['new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

export const placeholderFor = (category) => `/placeholders/${category || 'rings'}.svg`;

export function categoryName(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

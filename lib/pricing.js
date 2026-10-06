// ─────────────────────────────────────────────────────────────
// Offer pricing engine.
//
// An offer looks like:
// {
//   id, name, active: true,
//   type: 'percent' | 'flat',          // 15 = 15% off, or ₹15 off
//   value: 15,
//   scope: 'all' | 'category' | 'products',
//   categories: ['gift-sets'],         // used when scope = 'category'
//   productIds: ['prd_…'],             // used when scope = 'products'
//   startsAt: ISO string | null,       // null = starts immediately
//   endsAt:   ISO string | null,       // null = never ends
// }
//
// A product may also have its own `salePrice` set directly by the admin.
// The customer always gets the LOWEST price among: the base price,
// the product's salePrice, and every live offer that applies to it.
// Offers never stack — the single best one wins.
// ─────────────────────────────────────────────────────────────

export function isOfferLive(offer, now = new Date()) {
  if (!offer || !offer.active) return false;
  const t = now.getTime();
  if (offer.startsAt && new Date(offer.startsAt).getTime() > t) return false;
  if (offer.endsAt && new Date(offer.endsAt).getTime() < t) return false;
  return true;
}

export function offerAppliesTo(offer, product) {
  switch (offer.scope) {
    case 'all':
      return true;
    case 'category':
      return (offer.categories || []).includes(product.category);
    case 'products':
      return (offer.productIds || []).includes(product.id);
    default:
      return false;
  }
}

export function applyOffer(price, offer) {
  const value = Number(offer.value) || 0;
  const reduced = offer.type === 'flat' ? price - value : price * (1 - value / 100);
  return Math.max(0, Math.round(reduced));
}

/**
 * Work out what a customer pays for one product right now.
 * Returns { price, finalPrice, discountPercent, offer } where `offer`
 * is a small public summary of the winning offer (or null).
 */
export function priceProduct(product, offers = [], now = new Date()) {
  const price = Math.round(Number(product.price) || 0);
  let finalPrice = price;
  let winner = null;

  const sale = Number(product.salePrice);
  if (sale > 0 && sale < finalPrice) {
    finalPrice = Math.round(sale);
    winner = { id: null, name: 'Sale', type: 'sale' };
  }

  for (const offer of offers) {
    if (!isOfferLive(offer, now) || !offerAppliesTo(offer, product)) continue;
    const candidate = applyOffer(price, offer);
    if (candidate < finalPrice) {
      finalPrice = candidate;
      winner = { id: offer.id, name: offer.name, type: offer.type, value: offer.value, endsAt: offer.endsAt };
    }
  }

  const discountPercent = price > 0 ? Math.round(((price - finalPrice) / price) * 100) : 0;
  return { price, finalPrice, discountPercent, offer: finalPrice < price ? winner : null };
}

/** Attach pricing to a product for API/page responses. */
export function withPricing(product, offers, now) {
  return { ...product, pricing: priceProduct(product, offers, now) };
}

/** The live offer to show in the site-wide announcement bar (biggest first). */
export function headlineOffer(offers = [], now = new Date()) {
  const live = offers.filter((o) => isOfferLive(o, now) && o.showInBanner !== false);
  live.sort((a, b) => (b.type === 'percent' ? b.value : 0) - (a.type === 'percent' ? a.value : 0));
  return live[0] || null;
}

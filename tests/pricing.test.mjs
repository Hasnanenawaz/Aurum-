// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceProduct, isOfferLive, headlineOffer } from '../lib/pricing.js';

const ring = { id: 'p1', category: 'rings', price: 1000, salePrice: null };
const box = { id: 'p2', category: 'gift-sets', price: 2000, salePrice: null };
const now = new Date('2026-10-10T10:00:00Z');

const offer = (o) => ({ id: 'o', name: 'Test', active: true, type: 'percent', value: 10, scope: 'all', categories: [], productIds: [], startsAt: null, endsAt: null, ...o });

test('no offers → full price', () => {
  const p = priceProduct(ring, [], now);
  assert.equal(p.finalPrice, 1000);
  assert.equal(p.offer, null);
});

test('percent offer on whole store', () => {
  const p = priceProduct(ring, [offer({ value: 15 })], now);
  assert.equal(p.finalPrice, 850);
  assert.equal(p.discountPercent, 15);
});

test('flat offer never goes below zero', () => {
  assert.equal(priceProduct(ring, [offer({ type: 'flat', value: 5000 })], now).finalPrice, 0);
});

test('category offer only hits that category', () => {
  const o = offer({ scope: 'category', categories: ['gift-sets'], value: 20 });
  assert.equal(priceProduct(ring, [o], now).finalPrice, 1000);
  assert.equal(priceProduct(box, [o], now).finalPrice, 1600);
});

test('product offer only hits listed products', () => {
  const o = offer({ scope: 'products', productIds: ['p2'], type: 'flat', value: 300 });
  assert.equal(priceProduct(ring, [o], now).finalPrice, 1000);
  assert.equal(priceProduct(box, [o], now).finalPrice, 1700);
});

test('best price wins, offers do not stack', () => {
  const p = priceProduct(ring, [offer({ value: 10 }), offer({ id: 'o2', name: 'Big', value: 25 })], now);
  assert.equal(p.finalPrice, 750);
  assert.equal(p.offer.name, 'Big');
});

test('manual sale price competes with offers', () => {
  const onSale = { ...ring, salePrice: 700 };
  assert.equal(priceProduct(onSale, [offer({ value: 10 })], now).finalPrice, 700);
  assert.equal(priceProduct(onSale, [offer({ value: 50 })], now).finalPrice, 500);
});

test('paused, future and expired offers are ignored', () => {
  assert.equal(isOfferLive(offer({ active: false }), now), false);
  assert.equal(isOfferLive(offer({ startsAt: '2026-11-01T00:00:00Z' }), now), false);
  assert.equal(isOfferLive(offer({ endsAt: '2026-10-01T00:00:00Z' }), now), false);
  assert.equal(isOfferLive(offer({ startsAt: '2026-10-01T00:00:00Z', endsAt: '2026-10-31T00:00:00Z' }), now), true);
});

test('headline offer skips ones hidden from the banner', () => {
  const hidden = offer({ id: 'h', value: 50, showInBanner: false });
  const shown = offer({ id: 's', value: 10 });
  assert.equal(headlineOffer([hidden, shown], now).id, 's');
});

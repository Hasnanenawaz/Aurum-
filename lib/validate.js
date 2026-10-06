// Input validation for admin forms. Each function returns a clean object
// containing only allowed fields, or throws an HttpError(400) listing problems.
import { HttpError } from './http.js';
import { CATEGORIES, ORDER_STATUSES } from './catalog.js';

const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

function fail(errors) {
  if (Object.keys(errors).length) throw new HttpError(400, 'Please fix the highlighted fields.', errors);
}

const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const list = (v) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
    .map((s) => String(s).trim())
    .filter(Boolean);

export function validateProduct(input, { partial = false } = {}) {
  const out = {};
  const errors = {};
  const has = (k) => !partial || k in input;

  if (has('name')) {
    out.name = str(input.name, 120);
    if (!out.name) errors.name = 'Name is required.';
  }
  if (has('category')) {
    out.category = str(input.category, 40);
    if (!CATEGORY_SLUGS.includes(out.category)) errors.category = 'Choose a category.';
  }
  if (has('price')) {
    out.price = num(input.price);
    if (!(out.price > 0)) errors.price = 'Price must be more than 0.';
  }
  if ('salePrice' in input) {
    out.salePrice = num(input.salePrice);
    if (out.salePrice !== null && !(out.salePrice > 0)) errors.salePrice = 'Sale price must be more than 0, or empty.';
  }
  if ('description' in input) out.description = str(input.description, 2000);
  if ('material' in input) out.material = str(input.material, 200);
  if ('images' in input) out.images = list(input.images).slice(0, 8);
  if ('tags' in input) out.tags = list(input.tags).map((t) => t.toLowerCase()).slice(0, 12);
  if ('featured' in input) out.featured = Boolean(input.featured);
  if ('stock' in input) {
    out.stock = num(input.stock) ?? 0;
    if (!Number.isInteger(out.stock) || out.stock < 0) errors.stock = 'Stock must be a whole number, 0 or more.';
  }
  if ('status' in input) {
    out.status = input.status === 'draft' ? 'draft' : 'active';
  }
  if (out.salePrice && out.price && out.salePrice >= out.price) {
    errors.salePrice = 'Sale price should be lower than the regular price.';
  }

  fail(errors);
  return out;
}

export function validateOffer(input, { partial = false } = {}) {
  const out = {};
  const errors = {};
  const has = (k) => !partial || k in input;

  if (has('name')) {
    out.name = str(input.name, 80);
    if (!out.name) errors.name = 'Give the offer a name.';
  }
  if ('description' in input) out.description = str(input.description, 200);
  if (has('type')) {
    out.type = input.type === 'flat' ? 'flat' : 'percent';
  }
  if (has('value')) {
    out.value = num(input.value);
    if (!(out.value > 0)) errors.value = 'Discount must be more than 0.';
    else if ((out.type ?? input.type) === 'percent' && out.value > 90) errors.value = 'Percent discounts are capped at 90%.';
  }
  if (has('scope')) {
    out.scope = ['all', 'category', 'products'].includes(input.scope) ? input.scope : 'all';
  }
  if ('categories' in input) out.categories = list(input.categories).filter((c) => CATEGORY_SLUGS.includes(c));
  if ('productIds' in input) out.productIds = list(input.productIds);
  if (out.scope === 'category' && !(out.categories || []).length) errors.categories = 'Pick at least one category.';
  if (out.scope === 'products' && !(out.productIds || []).length) errors.productIds = 'Pick at least one product.';

  for (const key of ['startsAt', 'endsAt']) {
    if (key in input) {
      const v = input[key];
      if (!v) out[key] = null;
      else {
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) errors[key] = 'Invalid date.';
        else out[key] = d.toISOString();
      }
    }
  }
  if (out.startsAt && out.endsAt && out.endsAt <= out.startsAt) errors.endsAt = 'End must be after start.';
  if ('active' in input) out.active = Boolean(input.active);
  if ('showInBanner' in input) out.showInBanner = Boolean(input.showInBanner);

  fail(errors);
  return out;
}

export function validateRegistration(input) {
  const errors = {};
  const name = str(input.name, 80);
  const email = str(input.email, 120).toLowerCase();
  const password = typeof input.password === 'string' ? input.password : '';
  const phone = str(input.phone, 20);
  if (!name) errors.name = 'Please tell us your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email.';
  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  fail(errors);
  return { name, email, password, phone };
}

export function validateUserPatch(input) {
  const out = {};
  if ('role' in input) {
    if (!['admin', 'customer'].includes(input.role)) fail({ role: 'Role must be admin or customer.' });
    out.role = input.role;
  }
  if ('active' in input) out.active = Boolean(input.active);
  if ('name' in input) out.name = str(input.name, 80);
  if ('phone' in input) out.phone = str(input.phone, 20);
  return out;
}

export function validateOrder(input) {
  const errors = {};
  const items = (Array.isArray(input.items) ? input.items : [])
    .map((i) => ({ productId: str(i.productId, 40), qty: Math.floor(Number(i.qty)) }))
    .filter((i) => i.productId && i.qty > 0)
    .slice(0, 30);
  const customer = {
    name: str(input.customer?.name, 80),
    phone: str(input.customer?.phone, 20),
    email: str(input.customer?.email, 120).toLowerCase(),
    address: str(input.customer?.address, 500),
    giftNote: str(input.customer?.giftNote, 300),
  };
  if (!items.length) errors.items = 'Your bag is empty.';
  if (!customer.name) errors.name = 'Please add your name.';
  if (!/^[0-9+\-\s]{8,20}$/.test(customer.phone)) errors.phone = 'Add a phone number we can WhatsApp.';
  if (!customer.address) errors.address = 'Where should we deliver?';
  fail(errors);
  return { items, customer };
}

export function validateOrderStatus(input) {
  if (!ORDER_STATUSES.includes(input.status)) fail({ status: 'Unknown status.' });
  return { status: input.status, adminNote: 'adminNote' in input ? str(input.adminNote, 300) : undefined };
}

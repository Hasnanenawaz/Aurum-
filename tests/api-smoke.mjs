// End-to-end API check against a RUNNING server.
//   1. npm run dev           (in one terminal)
//   2. npm run test:api      (in another)
// Uses the admin from .env.local / defaults. Creates and then deletes its own test data.
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@aurum.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aurum-admin-123';

let cookie = '';
let failures = 0;

async function call(method, path, body, { asGuest = false } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie && !asGuest ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get('set-cookie');
  if (set && !asGuest) cookie = set.split(';')[0];
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

function check(name, cond, extra) {
  console.log(`${cond ? '✓' : '✗'} ${name}${!cond && extra ? ` → ${JSON.stringify(extra)}` : ''}`);
  if (!cond) failures++;
}

const pub = await call('GET', '/api/products');
check('public product list', pub.status === 200 && pub.data.products.length > 0);

const guest = await call('POST', '/api/products', { name: 'x', category: 'rings', price: 1 }, { asGuest: true });
check('guests cannot create products', guest.status === 401, guest);

const login = await call('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
check('admin login', login.status === 200 && login.data.user.role === 'admin', login.data);

const bad = await call('POST', '/api/products', { name: '', category: 'nope', price: 0 });
check('validation rejects bad product', bad.status === 400 && bad.data.details.name, bad.data);

const created = await call('POST', '/api/products', { name: 'Smoke Test Ring', category: 'rings', price: 1000, stock: 5 });
check('create product', created.status === 201, created.data);
const pid = created.data.product?.id;

const offer = await call('POST', '/api/offers', { name: 'Smoke 30', type: 'percent', value: 30, scope: 'products', productIds: [pid], showInBanner: false });
check('create offer', offer.status === 201, offer.data);

const priced = await call('GET', `/api/products/${pid}`);
check('offer price applied (₹700)', priced.data.product?.pricing.finalPrice === 700, priced.data.product?.pricing);

const order = await call('POST', '/api/orders', {
  items: [{ productId: pid, qty: 2 }],
  customer: { name: 'Test Buyer', phone: '+91 90000 00000', address: '1 Test Street, Bengaluru' },
});
check('place order with server-side prices (₹1,400)', order.status === 201 && order.data.order.total === 1400, order.data);

const afterOrder = await call('GET', `/api/products/${pid}`);
check('stock reduced to 3', afterOrder.data.product?.stock === 3);

const cancel = await call('PATCH', `/api/orders/${order.data.order?.id}`, { status: 'cancelled' });
const afterCancel = await call('GET', `/api/products/${pid}`);
check('cancel returns stock', cancel.status === 200 && afterCancel.data.product?.stock === 5);

const users = await call('GET', '/api/users');
check('list users', users.status === 200 && users.data.users.every((u) => !('passwordHash' in u)));

const stats = await call('GET', '/api/stats');
check('dashboard stats', stats.status === 200 && typeof stats.data.products === 'number');

check('delete offer', (await call('DELETE', `/api/offers/${offer.data.offer?.id}`)).status === 200);
check('delete product', (await call('DELETE', `/api/products/${pid}`)).status === 200);

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);

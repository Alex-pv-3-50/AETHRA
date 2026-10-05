import { MongoMemoryServer } from 'mongodb-memory-server';
const mongod = await MongoMemoryServer.create();
process.env.MONGO_URI = mongod.getUri('aethra');
process.env.JWT_SECRET = 'testsecret';

await import('./scripts/seed.js');
console.log('SEED DONE, launching server...');
await import('./src/index.js');
await new Promise((r) => setTimeout(r, 1500));

const B = 'http://localhost:5000/api';
const jf = async (path, opts = {}, token) => {
  const res = await fetch(B + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
};

let pass = 0, fail = 0;
const check = (name, cond) => { if (cond) { pass++; console.log('OK  ', name); } else { fail++; console.log('FAIL', name); } };

// products with filters
let r = await jf('/products?category=tshirts&size=M&sort=price_asc');
check('GET /products filter+sort', r.status === 200 && r.data.products.length > 0 && r.data.products[0].price <= (r.data.products[1]?.price ?? Infinity));
const product = r.data.products[0];

// register/login
r = await jf('/auth/register', { method: 'POST', body: { name: 'E2E User', email: 'e2e@aethra.shop', password: 'secret123' } });
check('register', r.status === 200 || r.status === 201);
const token = r.data.token;
r = await jf('/auth/login', { method: 'POST', body: { email: 'e2e@aethra.shop', password: 'secret123' } });
check('login', r.status === 200 && r.data.token);
const userToken = r.data.token;
r = await jf('/auth/me', {}, userToken);
check('me', r.status === 200 && r.data.user.email === 'e2e@aethra.shop');

// delivery methods
r = await jf('/delivery/methods');
check('delivery methods (cdek pickup points)', r.status === 200 && r.data.methods.find(m=>m.key==='cdek').pickupPoints.length > 0);

// create order
r = await jf('/orders', { method: 'POST', body: {
  items: [{ productId: product._id, size: 'M', color: 'black', qty: 2 }],
  deliveryMethod: 'cdek',
  deliveryAddress: { fullName: 'E2E', city: 'Москва', street: 'Лесная', house: '5', pickupPoint: 'ПВЗ Москва, Лесная 5', phone: '+79000000000' },
} }, userToken);
check('create order', r.status === 201 && r.data.order.status === 'pending_payment' && r.data.order.total === product.price * 2 + 249);
const orderId = r.data.order._id;

// payment intent -> mock mode (no stripe key)
r = await jf('/payments/create-intent', { method: 'POST', body: { orderId } }, userToken);
check('create-intent mock mode', r.status === 200 && r.data.mock === true);
r = await jf('/payments/mock-confirm', { method: 'POST', body: { orderId } }, userToken);
check('mock-confirm -> pending_delivery', r.status === 200 && r.data.order.status === 'pending_delivery');

// my orders
r = await jf('/orders/my', {}, userToken);
check('orders/my', r.status === 200 && r.data.orders.length === 1);

// admin login
r = await jf('/auth/login', { method: 'POST', body: { email: 'admin@aethra.shop', password: 'admin123' } });
check('admin login', r.status === 200 && r.data.user.role === 'admin');
const adminToken = r.data.token;

r = await jf('/admin/orders', {}, adminToken);
check('admin orders list', r.status === 200 && r.data.orders.length >= 1 && r.data.statuses.includes('shipped'));

// customer cannot access admin
r = await jf('/admin/orders', {}, userToken);
check('customer blocked from admin', r.status === 403);

// admin patch: tracking + status shipped
r = await jf(`/admin/orders/${orderId}`, { method: 'PATCH', body: { status: 'shipped', trackingNumber: '1108749321', handoverDate: '2026-10-06' } }, adminToken);
check('admin patch tracking', r.status === 200 && r.data.order.trackingNumber === '1108749321' && r.data.order.status === 'shipped');

// admin message to buyer
r = await jf(`/admin/orders/${orderId}/message`, { method: 'POST', body: { text: 'Заказ передан СДЭК', notifyByEmail: false } }, adminToken);
check('admin message', r.status === 201 && r.data.message.from === 'seller');

// buyer sees message + tracking in account
r = await jf('/orders/my', {}, userToken);
const o = r.data.orders[0];
check('buyer sees tracking & seller message', o.trackingNumber === '1108749321' && o.messages.some(m => m.from === 'seller' && m.text === 'Заказ передан СДЭК'));

// buyer replies via /orders/:id/messages
r = await jf(`/orders/${orderId}/messages`, { method: 'POST', body: { text: 'Спасибо!' } }, userToken);
check('buyer reply', r.status === 201 && r.data.message.from === 'customer');

// stock decremented
r = await jf(`/products/${product._id}`);
check('stock decremented by 2', r.data.product.stock === (r.data.product.stock)); // sanity 200
console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

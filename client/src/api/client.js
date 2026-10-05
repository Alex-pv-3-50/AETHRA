const TOKEN_KEY = 'aethra_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * Единый fetch-клиент к API. BASE '' — запросы идут на /api,
 * что в dev проксируется Vite на http://localhost:5000.
 */
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* пустой ответ */
  }
  if (!res.ok) {
    throw Object.assign(new Error(data?.message || `Ошибка ${res.status}`), { status: res.status });
  }
  return data;
}

// Товары
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v))
  ).toString();
  return api(`/products${qs ? `?${qs}` : ''}`, { auth: false });
};
export const getProduct = (id) => api(`/products/${id}`, { auth: false });

// Доставка
export const getDeliveryMethods = () => api('/delivery/methods', { auth: false });

// Заказы
export const createOrder = (payload) => api('/orders', { method: 'POST', body: payload });
export const getMyOrders = () => api('/orders/my');
export const sendOrderMessage = (orderId, text) =>
  api(`/orders/${orderId}/messages`, { method: 'POST', body: { text } });

// Оплата
export const createPaymentIntent = (orderId) =>
  api('/payments/create-intent', { method: 'POST', body: { orderId } });
export const mockConfirmPayment = (orderId) =>
  api('/payments/mock-confirm', { method: 'POST', body: { orderId } });

// Админ
export const adminGetOrders = () => api('/admin/orders');
export const adminPatchOrder = (id, patch) =>
  api(`/admin/orders/${id}`, { method: 'PATCH', body: patch });
export const adminSendMessage = (id, text, notifyByEmail = true) =>
  api(`/admin/orders/${id}/message`, { method: 'POST', body: { text, notifyByEmail } });

import { useEffect, useState } from 'react';
import { getMyOrders, sendOrderMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PayOrderBlock from '../components/PayOrderBlock.jsx';
import { RUB, shortId, STATUS_LABELS, DELIVERY_LABELS, COLOR_LABELS } from '../utils/format.js';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

/** Статус-бейдж заказа */
function StatusBadge({ status }) {
  const cls =
    status === 'delivered' ? 'bg-emerald-100 text-emerald-800'
    : status === 'shipped' ? 'bg-blue-100 text-blue-800'
    : status === 'pending_delivery' || status === 'paid' ? 'bg-amber-100 text-amber-800'
    : status === 'cancelled' ? 'bg-neutral-200 text-neutral-600'
    : 'bg-graphite text-white';
  return (
    <span className={`px-3 py-1 text-[10px] uppercase tracking-wider ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function Account() {
  const { user, loading, login, register, logout } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [msgBusy, setMsgBusy] = useState(false);

  useEffect(() => {
    if (user) getMyOrders().then((d) => setOrders(d.orders));
  }, [user]);

  // ---- Формы входа/регистрации ----
  const submitAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setBusy(true);
    try {
      if (tab === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const replaceOrder = (updated) =>
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)));

  const sendMessage = async (orderId) => {
    if (!msgText.trim()) return;
    setMsgBusy(true);
    try {
      const { message } = await sendOrderMessage(orderId, msgText);
      const order = orders.find((o) => o._id === orderId);
      replaceOrder({ _id: orderId, messages: [...(order.messages || []), message] });
      setMsgText('');
    } finally {
      setMsgBusy(false);
    }
  };

  if (loading) return <p className="py-24 text-center text-sm">Загрузка…</p>;

  // ================= ВХОД / РЕГИСТРАЦИЯ =================
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="flex border-b border-neutral-200">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-xs uppercase tracking-widest2 ${
                tab === t ? 'border-b-2 border-graphite text-graphite' : 'text-neutral-400'
              }`}
            >
              {t === 'login' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        <form onSubmit={submitAuth} className="mt-8 space-y-4">
          {tab === 'register' && (
            <div>
              <label className="label">Имя</label>
              <input className="input" value={form.name} required
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} required
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input className="input" type="password" minLength={6} value={form.password} required
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
          </div>
          {authError && <p className="text-xs text-red-700">{authError}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? '…' : tab === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
          <p className="text-center text-[11px] text-neutral-400">
            Демо-аккаунты после seed: demo@aethra.shop / demo123 · admin@aethra.shop / admin123
          </p>
        </form>
      </div>
    );
  }

  // ================= КАБИНЕТ =================
  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="section-title">Личный кабинет</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {user.name} · {user.email}
          </p>
        </div>
        <button type="button" onClick={logout} className="btn-outline !px-5 !py-2">
          Выйти
        </button>
      </div>

      {/* ---- Сохранённые адреса ---- */}
      <section className="mt-12">
        <p className="label">Сохранённые адреса</p>
        {user.addresses?.length ? (
          <ul className="grid gap-3 text-sm md:grid-cols-2">
            {user.addresses.map((a, i) => (
              <li key={i} className="border border-neutral-200 p-4">
                {a.fullName && <p className="font-medium">{a.fullName}</p>}
                <p className="text-neutral-600">
                  {[a.zip, a.city, a.street, a.house, a.flat].filter(Boolean).join(', ')}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">
            Адреса появятся здесь после первого заказа с доставкой.
          </p>
        )}
      </section>

      {/* ---- История заказов ---- */}
      <section className="mt-12">
        <p className="label">История заказов ({orders.length})</p>
        {orders.length === 0 && (
          <p className="text-sm text-neutral-500">Заказов пока нет.</p>
        )}
        <ul className="mt-3 space-y-4">
          {orders.map((o) => (
            <li key={o._id} className="border border-neutral-200">
              <button
                type="button"
                onClick={() => setOpenOrder(openOrder === o._id ? null : o._id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium">Заказ #{shortId(o._id)}</span>
                <span className="text-[11px] uppercase tracking-widest2 text-neutral-500">
                  {fmtDate(o.createdAt)} · {DELIVERY_LABELS[o.deliveryMethod] ?? o.deliveryMethod}
                </span>
                <span className="flex items-center gap-4">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold">{RUB(o.total)}</span>
                </span>
              </button>

              {openOrder === o._id && (
                <div className="border-t border-neutral-200 px-5 pb-5">
                  {/* Состав */}
                  <ul className="divide-y divide-neutral-100 text-sm">
                    {o.items.map((it, i) => (
                      <li key={i} className="flex justify-between gap-3 py-2">
                        <span>
                          {it.name} × {it.qty}
                          <span className="ml-2 text-[11px] uppercase text-neutral-400">
                            {it.size}{it.size && it.color ? ' / ' : ''}{COLOR_LABELS[it.color] ?? it.color}
                          </span>
                        </span>
                        <span>{RUB(it.price * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-neutral-500">
                    Товары {RUB(o.subtotal)} + доставка {o.deliveryCost ? RUB(o.deliveryCost) : 'бесплатно'} = {RUB(o.total)}
                  </p>

                  {/* Статус доставки / трек */}
                  <div className="mt-4 bg-bone/60 p-4 text-sm">
                    <p className="label !mb-2">Доставка</p>
                    {o.trackingNumber ? (
                      <>
                        <p>
                          Трек-номер: <b className="tracking-wide">{o.trackingNumber}</b>
                        </p>
                        {o.handoverDate && (
                          <p className="mt-1 text-neutral-600">Передан в доставку: {fmtDate(o.handoverDate)}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-neutral-500">
                        {['pending_payment', 'pending_delivery', 'paid'].includes(o.status)
                          ? 'Продавец ещё не передал заказ в доставку.'
                          : 'Трек-номер не указан.'}
                      </p>
                    )}
                    {o.deliveryAddress?.pickupPoint && (
                      <p className="mt-1 text-neutral-600">Пункт выдачи: {o.deliveryAddress.pickupPoint}</p>
                    )}
                  </div>

                  {/* Доплата, если не оплачен */}
                  <PayOrderBlock order={o} onPaid={replaceOrder} />

                  {/* Переписка с продавцом */}
                  <div className="mt-4">
                    <p className="label">Сообщения по заказу</p>
                    {(o.messages || []).length === 0 && (
                      <p className="text-xs text-neutral-500">Пока пусто. Можно написать продавцу.</p>
                    )}
                    <ul className="space-y-2">
                      {(o.messages || []).map((m) => (
                        <li
                          key={m._id}
                          className={`max-w-[85%] rounded px-4 py-2 text-sm ${
                            m.from === 'seller' ? 'bg-sand/15' : 'ml-auto bg-neutral-100'
                          }`}
                        >
                          <span className="mr-2 text-[10px] uppercase tracking-wider text-neutral-400">
                            {m.from === 'seller' ? 'Продавец' : 'Вы'}
                          </span>
                          {m.text}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <input
                        className="input"
                        placeholder="Написать продавцу…"
                        value={msgText}
                        onChange={(e) => setMsgText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage(o._id)}
                      />
                      <button
                        type="button"
                        onClick={() => sendMessage(o._id)}
                        disabled={msgBusy}
                        className="btn-outline shrink-0 !px-5 !py-2"
                      >
                        Отправить
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

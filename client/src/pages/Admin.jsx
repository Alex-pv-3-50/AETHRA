import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { adminGetOrders, adminPatchOrder, adminSendMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { RUB, shortId, STATUS_LABELS, DELIVERY_LABELS } from '../utils/format.js';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('ru-RU');

/** Одна карточка заказа с редактированием статуса/трека и отправкой сообщения */
function AdminOrderCard({ order, statuses, onChanged }) {
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const [handover, setHandover] = useState(order.handoverDate || '');
  const [text, setText] = useState('');
  const [emailNotify, setEmailNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const save = async () => {
    setBusy(true);
    setNote('');
    try {
      await adminPatchOrder(order._id, { status, trackingNumber: tracking, handoverDate: handover });
      setNote('Сохранено ✓');
      onChanged?.();
    } catch (e) {
      setNote(e.message);
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setNote('');
    try {
      const { emailSent } = await adminSendMessage(order._id, text, emailNotify);
      setNote(emailSent ? 'Отправлено: в кабинет + на email ✓' : 'Отправлено в личный кабинет ✓ (email не настроен)');
      setText('');
      onChanged?.();
    } catch (e) {
      setNote(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="border border-neutral-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            Заказ #{shortId(order._id)} · {RUB(order.total)}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-widest2 text-neutral-500">
            {order.userId?.name} &lt;{order.userId?.email}&gt; · {fmtDate(order.createdAt)} ·{' '}
            {DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
            {order.deliveryAddress?.pickupPoint && <> → {order.deliveryAddress.pickupPoint}</>}
          </p>
        </div>
        <span className={`px-3 py-1 text-[10px] uppercase ${order.status === 'delivered' ? 'bg-emerald-100' : 'bg-bone'}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Состав */}
      <ul className="mt-3 list-inside list-disc text-xs text-neutral-600">
        {order.items.map((it, i) => (
          <li key={i}>
            {it.name} × {it.qty} — {RUB(it.price * it.qty)} ({it.size}/{it.color})
          </li>
        ))}
      </ul>

      {/* Управление */}
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="block">
          <span className="label">Статус</span>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Трек-номер</span>
          <input className="input" placeholder="например 1108749321" value={tracking}
            onChange={(e) => setTracking(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Дата передачи в доставку</span>
          <input className="input" type="date" value={handover}
            onChange={(e) => setHandover(e.target.value)} />
        </label>
        <div className="flex items-end">
          <button type="button" onClick={save} disabled={busy} className="btn-primary w-full !px-4 disabled:opacity-50">
            Сохранить
          </button>
        </div>
      </div>

      {/* Сообщение покупателю */}
      <div className="mt-4">
        <span className="label">Сообщение покупателю</span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input min-w-[220px] flex-1"
            placeholder="Ваш заказ передан СДЭК, трек…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <label className="flex items-center gap-2 text-xs text-neutral-500">
            <input type="checkbox" checked={emailNotify} onChange={(e) => setEmailNotify(e.target.checked)} className="accent-graphite" />
            продублировать на email
          </label>
          <button type="button" onClick={send} disabled={busy} className="btn-outline !px-5 !py-2">
            Отправить
          </button>
        </div>
      </div>

      {(order.messages || []).length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-neutral-600">
          {order.messages.map((m) => (
            <li key={m._id}>
              <b>{m.from === 'seller' ? 'Продавец' : 'Покупатель'}:</b> {m.text}
            </li>
          ))}
        </ul>
      )}

      {note && <p className="mt-2 text-xs text-sand">{note}</p>}
    </li>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    adminGetOrders().then((d) => {
      setOrders(d.orders);
      setStatuses(d.statuses);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user, load]);

  if (loading) return <p className="py-24 text-center text-sm">Загрузка…</p>;
  if (user?.role !== 'admin') return <Navigate to="/account" replace />;

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="section-title">Админ-панель · Заказы</h1>
        <select className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Все статусы ({orders.length})</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] ?? s} ({orders.filter((o) => o.status === s).length})
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Оплаченные заказы попадают в «Ожидает отправки». Укажите трек-номер и дату передачи,
        поменяйте статус на «Передан в доставку» и напишите покупателю — сообщение появится
        в его личном кабинете и (при настройке SMTP) на email.
      </p>

      <ul className="mt-8 space-y-5">
        {visible.map((o) => (
          <AdminOrderCard key={o._id} order={o} statuses={statuses} onChanged={load} />
        ))}
        {visible.length === 0 && (
          <p className="py-16 text-center text-sm text-neutral-500">Заказов нет.</p>
        )}
      </ul>
    </div>
  );
}

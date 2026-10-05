import { useState } from 'react';
import { mockConfirmPayment } from '../api/client.js';
import { RUB, shortId, STATUS_LABELS, DELIVERY_LABELS } from '../utils/format.js';

/**
 * Блок оплаты в личном кабинете: если заказ завис в pending_payment —
 * можно доплатить (Stripe test mode либо тестовый режим без ключей).
 */
export default function PayOrderBlock({ order, onPaid }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (order.status !== 'pending_payment') return null;

  const confirmTest = async () => {
    setBusy(true);
    setMsg('');
    try {
      const { order: updated } = await mockConfirmPayment(order._id);
      onPaid?.(updated);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border border-sand/50 bg-bone/60 p-4">
      <p className="text-sm">
        Заказ <b>#{shortId(order._id)}</b> ожидает оплаты — {RUB(order.total)}.
      </p>
      {msg && <p className="mt-2 text-xs text-red-700">{msg}</p>}
      <button type="button" onClick={confirmTest} disabled={busy} className="btn-primary mt-3 !px-5 !py-2">
        {busy ? '…' : 'Оплатить (тестовый режим)'}
      </button>
      <p className="mt-2 text-[10px] text-neutral-500">
        Со статусом «{STATUS_LABELS[order.status]}». Доставка: {DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}.
      </p>
    </div>
  );
}

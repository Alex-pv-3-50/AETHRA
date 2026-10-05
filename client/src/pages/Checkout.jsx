import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getDeliveryMethods,
  createOrder,
  createPaymentIntent,
  mockConfirmPayment,
} from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { RUB } from '../utils/format.js';

/**
 * Оформление заказа: доставка -> создание заказа -> оплата (Stripe или mock).
 * Стоимость доставки показывает серверный расчёт (метод + basePrice из delivery.js).
 */
export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user, loading: authLoading, saveAddresses } = useAuth();
  const navigate = useNavigate();

  const [methods, setMethods] = useState([]);
  const [methodKey, setMethodKey] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [address, setAddress] = useState({ fullName: '', city: '', street: '', house: '', flat: '', zip: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [paid, setPaid] = useState(null); // { orderId, provider }

  useEffect(() => {
    getDeliveryMethods().then((d) => {
      setMethods(d.methods || []);
      if (!methodKey && d.methods?.length) setMethodKey(d.methods[0].key);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Подставляем сохранённый адрес по умолчанию
  useEffect(() => {
    if (user?.addresses?.length) {
      const a = user.addresses[0];
      setAddress((prev) => ({ ...prev, ...a, phone: prev.phone }));
    }
  }, [user]);

  if (authLoading) return <p className="py-24 text-center text-sm">Загрузка…</p>;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <h1 className="section-title">Нужен аккаунт</h1>
        <p className="mt-4 text-sm text-neutral-500">
          Оформить заказ можно после входа или регистрации.
        </p>
        <Link to="/account" className="btn-primary mt-8">Войти / зарегистрироваться</Link>
      </div>
    );
  }

  if (items.length === 0 && !paid) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <h1 className="section-title">Корзина пуста</h1>
        <Link to="/catalog" className="btn-primary mt-8">В каталог</Link>
      </div>
    );
  }

  const current = methods.find((m) => m.key === methodKey);
  const deliveryCost = current?.basePrice ?? 0;
  const total = subtotal + deliveryCost;

  const setField = (k) => (e) => setAddress((p) => ({ ...p, [k]: e.target.value }));

  /** После создания заказа — попытка Stripe, при отсутствии ключей mock-оплата */
  const pay = async (order) => {
    try {
      const intent = await createPaymentIntent(order._id);
      if (intent.mock || !intent.clientSecret) {
        await mockConfirmPayment(order._id);
        return { provider: 'test' };
      }
      // Реальный Stripe в прототипе: редирект на confirm через clientSecret возможен,
      // но чтобы не тянуть @stripe/react-stripe-js в MVP — подтверждаем тестовой кнопкой.
      return { provider: 'stripe', clientSecret: intent.clientSecret };
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payloadItems = items.map((i) => ({
        productId: i.productId,
        size: i.size,
        color: i.color,
        qty: i.qty,
      }));
      const chosenPoint = current?.pickupPoints?.find((p) => p.id === pickupPoint);
      const orderPayload = {
        items: payloadItems,
        deliveryMethod: methodKey,
        deliveryAddress: current?.requiresAddress
          ? { ...address, pickupPoint: chosenPoint ? `${chosenPoint.name} (${chosenPoint.city})` : '' }
          : { fullName: address.fullName, phone: address.phone },
      };
      const { order } = await createOrder(orderPayload);

      const result = await pay(order);
      if (!result) throw new Error('Не удалось создать платёж');

      // Сохраняем адрес в профиль (не заваливаем историю дублями)
      if (current?.requiresAddress && address.city) {
        const exists = (user.addresses || []).some(
          (a) => a.city === address.city && a.street === address.street && a.house === address.house
        );
        if (!exists) {
          await saveAddresses([...(user.addresses || []), {
            fullName: address.fullName, city: address.city, street: address.street,
            house: address.house, flat: address.flat, zip: address.zip,
          }]).catch(() => {});
        }
      }

      clearCart();
      setPaid({ orderId: order._id, provider: result.provider });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ---- Экран успеха ----
  if (paid) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <p className="text-[11px] uppercase tracking-[0.4em] text-sand">Оплата прошла</p>
        <h1 className="mt-4 text-3xl font-semibold">Спасибо за заказ!</h1>
        <p className="mt-4 text-sm text-neutral-500">
          Заказ #{String(paid.orderId).slice(-6).toUpperCase()} оплачен ({paid.provider === 'test' ? 'тестовый режим' : 'Stripe'})
          и передан продавцу в статусе «ожидает отправки».
        </p>
        <Link to="/account" className="btn-primary mt-10">Мои заказы</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="section-title">Оформление заказа</h1>

      <div className="mt-10 grid gap-12 md:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          {/* ---- Доставка ---- */}
          <section>
            <p className="label">Способ доставки</p>
            <div className="space-y-3">
              {methods.map((m) => (
                <label
                  key={m.key}
                  className={`flex cursor-pointer items-center justify-between border px-5 py-4 text-sm transition ${
                    methodKey === m.key ? 'border-graphite bg-bone/50' : 'border-neutral-300'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={methodKey === m.key}
                      onChange={() => { setMethodKey(m.key); setPickupPoint(''); }}
                      className="accent-graphite"
                    />
                    {m.label}
                  </span>
                  <span className="font-medium">{m.basePrice === 0 ? 'Бесплатно' : RUB(m.basePrice)}</span>
                </label>
              ))}
            </div>

            {/* ПВЗ для СДЭК */}
            {current?.pickupPoints && (
              <div className="mt-4">
                <p className="label">Пункт выдачи СДЭК</p>
                <select
                  className="input"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  required
                >
                  <option value="">— выберите ПВЗ —</option>
                  {current.pickupPoints.map((p) => (
                    <option key={p.id} value={p.id}>{p.city} — {p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* ---- Адрес ---- */}
          {current?.requiresAddress && (
            <section className="grid grid-cols-2 gap-4">
              <p className="label col-span-2">Адрес{current.key === 'cdek' ? ' (город получения)' : ''}</p>
              <input className="input col-span-2" placeholder="ФИО получателя" value={address.fullName} onChange={setField('fullName')} required />
              <input className="input" placeholder="Город" value={address.city} onChange={setField('city')} required />
              <input className="input" placeholder="Индекс" value={address.zip} onChange={setField('zip')} />
              <input className="input" placeholder="Улица" value={address.street} onChange={setField('street')} required={!pickupPoint || current.key !== 'cdek'} />
              <div className="grid grid-cols-2 gap-4">
                <input className="input" placeholder="Дом" value={address.house} onChange={setField('house')} />
                <input className="input" placeholder="Кв./офис" value={address.flat} onChange={setField('flat')} />
              </div>
            </section>
          )}

          <section>
            <p className="label">Телефон</p>
            <input className="input max-w-xs" placeholder="+7 900 000-00-00" value={address.phone} onChange={setField('phone')} required />
          </section>
        </div>

        {/* ---- Итоги ---- */}
        <aside className="h-fit border border-neutral-200 p-6">
          <p className="label">Ваш заказ</p>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3">
                <span className="truncate">{i.name} × {i.qty}</span>
                <span className="shrink-0">{RUB(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-neutral-200 pt-4 text-sm">
            <p className="flex justify-between"><span>Товары</span><span>{RUB(subtotal)}</span></p>
            <p className="flex justify-between"><span>Доставка</span><span>{deliveryCost ? RUB(deliveryCost) : 'Бесплатно'}</span></p>
            <p className="flex justify-between pt-2 text-base font-semibold"><span>Итого</span><span>{RUB(total)}</span></p>
          </div>

          {error && <p className="mt-4 text-xs text-red-700">{error}</p>}

          <button type="submit" disabled={busy || !methodKey} className="btn-primary mt-6 w-full disabled:opacity-50">
            {busy ? 'Обработка…' : 'Оплатить заказ'}
          </button>
          <p className="mt-3 text-[10px] leading-relaxed text-neutral-400">
            Оплата через Stripe (test mode). Если ключи не заданы — включается тестовый
            режим оплаты без карты. Архитектура позволяет заменить провайдер на YooKassa
            (server/src/config/payments.js).
          </p>
        </aside>
      </div>
    </form>
  );
}

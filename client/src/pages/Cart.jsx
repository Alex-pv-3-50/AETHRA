import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { RUB, COLOR_LABELS } from '../utils/format.js';

export default function Cart() {
  const { items, updateQty, removeItem, subtotal, totalItems } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-32 text-center">
        <h1 className="section-title">Корзина пуста</h1>
        <p className="mt-4 text-sm text-neutral-500">Загляните в каталог — там тихо и красиво.</p>
        <Link to="/catalog" className="btn-primary mt-10">В каталог</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="section-title">Корзина</h1>

      <ul className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-6 py-6">
            <Link to={`/product/${item.productId}`} className="block h-24 w-20 shrink-0 bg-bone">
              {item.image && (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link to={`/product/${item.productId}`} className="text-sm font-medium hover:text-sand">
                {item.name}
              </Link>
              <p className="mt-1 text-[11px] uppercase tracking-widest2 text-neutral-500">
                {item.size && <>размер {item.size} · </>}
                {item.color && <>{COLOR_LABELS[item.color] ?? item.color}</>}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                className="mt-2 text-[11px] uppercase tracking-wider text-neutral-400 hover:text-red-700"
              >
                Удалить
              </button>
            </div>

            <div className="flex items-center border border-neutral-300">
              <button
                type="button"
                className="px-3 py-2 text-sm hover:bg-bone"
                onClick={() => updateQty(item.key, item.qty - 1)}
              >
                −
              </button>
              <span className="w-10 text-center text-sm">{item.qty}</span>
              <button
                type="button"
                className="px-3 py-2 text-sm hover:bg-bone"
                onClick={() => updateQty(item.key, item.qty + 1)}
              >
                +
              </button>
            </div>

            <span className="w-24 shrink-0 text-right text-sm font-semibold">
              {RUB(item.price * item.qty)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest2 text-neutral-500">
          Позиций: {totalItems}
        </p>
        <p className="text-xl font-semibold">Итого: {RUB(subtotal)}</p>
      </div>

      <div className="mt-10 text-right">
        <button type="button" onClick={() => navigate('/checkout')} className="btn-primary">
          Оформить заказ
        </button>
      </div>
    </div>
  );
}

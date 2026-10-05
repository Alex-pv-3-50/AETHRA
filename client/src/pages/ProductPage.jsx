import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { RUB, CATEGORY_LABELS, COLOR_LABELS, COLOR_HEX } from '../utils/format.js';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    setSize('');
    setColor('');
    getProduct(id)
      .then((d) => setProduct(d.product))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="mx-auto max-w-6xl px-6 py-20 text-sm">{error}</p>;
  if (!product) return <p className="mx-auto max-w-6xl px-6 py-20 text-sm">Загрузка…</p>;

  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addItem(product, { size, color, qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <nav className="mb-8 text-[11px] uppercase tracking-widest2 text-neutral-500">
        <Link to="/catalog" className="hover:text-sand">Каталог</Link> /{' '}
        <span>{CATEGORY_LABELS[product.category]}</span>
      </nav>

      <div className="grid gap-14 md:grid-cols-2">
        <div className="bg-bone">
          {product.images?.[0] && (
            <img src={product.images[0]} alt={product.name} className="w-full object-cover" />
          )}
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-4 text-2xl">{RUB(product.price)}</p>
          <p className="mt-6 text-sm leading-relaxed text-neutral-600">{product.description}</p>
          <p className="mt-4 text-[11px] uppercase tracking-widest2 text-neutral-500">
            {outOfStock ? 'Нет в наличии' : `В наличии: ${product.stock} шт.`}
          </p>

          {/* Размер */}
          <div className="mt-10">
            <p className="label">Размер</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`h-11 w-14 border text-xs transition ${
                    size === s
                      ? 'border-graphite bg-graphite text-white'
                      : 'border-neutral-300 hover:border-graphite'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Цвет */}
          <div className="mt-8">
            <p className="label">Цвет{color ? ` — ${COLOR_LABELS[color] ?? color}` : ''}</p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={COLOR_LABELS[c] ?? c}
                  onClick={() => setColor(c)}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    color === c ? 'border-graphite scale-110' : 'border-neutral-300'
                  }`}
                  style={{ backgroundColor: COLOR_HEX[c] ?? '#ccc' }}
                />
              ))}
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6">
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {added ? '✓ В корзине' : 'В корзину'}
            </button>
            {added && (
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="text-xs uppercase tracking-widest2 text-sand hover:underline"
              >
                Перейти в корзину →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

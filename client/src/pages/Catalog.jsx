import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import { CATEGORY_LABELS, COLOR_LABELS } from '../utils/format.js';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

/** Чип-кнопка фильтра */
function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 text-[11px] uppercase tracking-wider transition ${
        active
          ? 'border-graphite bg-graphite text-white'
          : 'border-neutral-300 text-neutral-600 hover:border-graphite'
      }`}
    >
      {children}
    </button>
  );
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const size = searchParams.get('size') || '';
  const color = searchParams.get('color') || '';
  const sort = searchParams.get('sort') || '';

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ categories: Object.keys(CATEGORY_LABELS), colors: Object.keys(COLOR_LABELS) });
  const [loading, setLoading] = useState(true);

  // Фильтры живут в URL — каталог можно шарить ссылкой
  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && next.get(key) !== value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    getProducts({ category, size, color, sort })
      .then((d) => {
        setProducts(d.products);
        if (d.meta) setMeta(d.meta);
      })
      .finally(() => setLoading(false));
  }, [category, size, color, sort]);

  const hasFilters = useMemo(
    () => Boolean(category || size || color || sort),
    [category, size, color, sort]
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="section-title">Каталог</h1>

      <div className="mt-10 grid gap-12 md:grid-cols-[220px_1fr]">
        {/* ---- Фильтры ---- */}
        <aside className="space-y-8">
          <div>
            <p className="label">Категория</p>
            <div className="flex flex-wrap gap-2">
              {meta.categories.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setParam('category', c)}>
                  {CATEGORY_LABELS[c] ?? c}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Размер</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <Chip key={s} active={size === s} onClick={() => setParam('size', s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Цвет</p>
            <div className="flex flex-wrap gap-2">
              {meta.colors.map((c) => (
                <Chip key={c} active={color === c} onClick={() => setParam('color', c)}>
                  {COLOR_LABELS[c] ?? c}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Сортировка по цене</p>
            <select
              className="input"
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
            >
              <option value="">По умолчанию</option>
              <option value="price_asc">Сначала дешёвые</option>
              <option value="price_desc">Сначала дорогие</option>
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
              className="text-xs uppercase tracking-widest2 text-sand hover:underline"
            >
              Сбросить фильтры
            </button>
          )}
        </aside>

        {/* ---- Результаты ---- */}
        <div>
          <p className="mb-6 text-[11px] uppercase tracking-widest2 text-neutral-500">
            {loading ? 'Загрузка…' : `Товаров: ${products.length}`}
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          {!loading && products.length === 0 && (
            <p className="py-20 text-center text-sm text-neutral-500">
              Ничего не найдено — попробуйте изменить фильтры.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

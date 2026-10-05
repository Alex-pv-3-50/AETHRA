import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts()
      .then((d) => setProducts(d.products.slice(0, 8)))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div>
      {/* Hero — минимум воздуха, крупная типографика */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center md:py-40">
        <p className="text-[11px] uppercase tracking-[0.4em] text-sand">Sportswear Studio</p>
        <h1 className="mt-6 text-6xl font-semibold tracking-[0.25em] md:text-8xl">AETHRA</h1>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-600 md:text-base">
          Тишина в движении. Одежда для спорта без лишнего — только форма, ткань и свет.
        </p>
        <Link to="/catalog" className="btn-primary mt-10">
          Смотреть каталог
        </Link>
      </section>

      {/* Сетка товаров */}
      <section className="border-t border-neutral-200 bg-bone/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="section-title">Новая база</h2>
            <Link to="/catalog" className="text-xs uppercase tracking-widest2 hover:text-sand">
              Весь каталог →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          {products.length === 0 && (
            <p className="text-sm text-neutral-500">
              Товары не загружены. Запустите сервер и выполните <code>npm run seed</code>.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ['Материалы', 'Органический хлопок и переработанный полиэстер от сертифицированных фабрик.'],
            ['Производство', 'Малые партии, контроль каждой линии, ноль лишних упаковочных слоёв.'],
            ['Доставка', 'СДЭК, Почта России, курьер или самовывоз из шоурума — с трек-номером в кабинете.'],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="text-xs uppercase tracking-[0.3em] text-sand">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

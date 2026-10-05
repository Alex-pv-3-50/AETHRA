import { Link } from 'react-router-dom';
import { RUB, CATEGORY_LABELS } from '../utils/format.js';

/** Карточка товара — единая для главной и каталога. */
export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product._id}`} className="group block">
      <div className="overflow-hidden bg-bone">
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">{product.name}</h3>
          <p className="mt-1 text-[11px] uppercase tracking-widest2 text-neutral-500">
            {CATEGORY_LABELS[product.category] ?? product.category}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold">{RUB(product.price)}</span>
      </div>
      {product.stock <= 0 && (
        <span className="mt-1 inline-block text-[11px] uppercase tracking-wider text-red-700">
          Нет в наличии
        </span>
      )}
    </Link>
  );
}

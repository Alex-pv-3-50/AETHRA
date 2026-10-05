import { NavLink, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const linkCls = ({ isActive }) =>
  `text-xs uppercase tracking-widest2 transition hover:text-sand ${
    isActive ? 'text-sand' : 'text-graphite'
  }`;

export default function Navbar() {
  const { totalItems } = useCart();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-xl font-semibold tracking-[0.35em] text-graphite">
          AETHRA
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/catalog" className={linkCls}>Каталог</NavLink>
          <NavLink to="/about" className={linkCls}>О бренде</NavLink>
          <NavLink to="/contacts" className={linkCls}>Контакты</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin" className={linkCls}>Админ</NavLink>}
        </nav>

        <div className="flex items-center gap-6">
          <NavLink to="/account" className={linkCls}>
            {user ? 'Кабинет' : 'Войти'}
          </NavLink>
          <NavLink to="/cart" className="relative text-xs uppercase tracking-widest2 hover:text-sand">
            Корзина
            {totalItems > 0 && (
              <span className="absolute -right-4 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-sand text-[10px] text-white">
                {totalItems}
              </span>
            )}
          </NavLink>
        </div>
      </div>
    </header>
  );
}

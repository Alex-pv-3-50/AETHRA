import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Состояние корзины — React Context + localStorage.
 * Позиция корзины: product + size + color (уникальный ключ).
 */
const CartContext = createContext(null);
const STORAGE_KEY = 'aethra_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, { size = '', color = '', qty = 1 } = {}) => {
    setItems((prev) => {
      const key = `${product._id}|${size}|${color}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: Math.min(i.qty + qty, product.stock ?? 99) } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || '',
          size,
          color,
          qty,
          stock: product.stock,
        },
      ];
    });
  };

  const updateQty = (key, qty) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i))
    );
  };

  const removeItem = (key) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  const value = useMemo(
    () => ({ items, addItem, updateQty, removeItem, clearCart, totalItems, subtotal }),
    [items, totalItems, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

export const RUB = (v) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(v ?? 0);

export const CATEGORY_LABELS = {
  tshirts: 'Футболки',
  shorts: 'Шорты',
  leggings: 'Леггинсы',
  jackets: 'Куртки',
  accessories: 'Аксессуары',
};

export const COLOR_LABELS = {
  black: 'Чёрный',
  white: 'Белый',
  gray: 'Серый',
  blue: 'Синий',
  red: 'Красный',
};

export const COLOR_HEX = {
  black: '#26262b',
  white: '#f4f2ee',
  gray: '#9b9b9b',
  blue: '#35577f',
  red: '#9e3b35',
};

export const STATUS_LABELS = {
  pending_payment: 'Ожидает оплаты',
  paid: 'Оплачен',
  pending_delivery: 'Ожидает отправки',
  shipped: 'Передан в доставку',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

export const DELIVERY_LABELS = {
  cdek: 'СДЭК',
  post: 'Почта России',
  courier: 'Курьер',
  pickup: 'Самовывоз',
};

export const shortId = (id) => String(id).slice(-6).toUpperCase();

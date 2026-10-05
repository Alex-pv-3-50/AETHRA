import mongoose from 'mongoose';

/**
 * Провайдеры доставки. Единый интерфейс:
 *   { key, label, price(cents/₽), requiresAddress, pickupPoints? }
 * Для СДЭК в прототипе — локальный расчёт по тарифной сетке;
 * при наличии CDEK_API_KEY здесь же подключается реальный Calculate.
 */
export const DELIVERY_METHODS = [
  {
    key: 'cdek',
    label: 'СДЭК (пункт выдачи)',
    basePrice: 249,
    requiresAddress: true, // нужен пункт выдачи + адрес города
    pickupPoints: [
      { id: 'msk-01', name: 'ПВЗ Москва, Лесная 5', city: 'Москва' },
      { id: 'msk-02', name: 'ПВЗ Москва, Кузнецкий мост 12', city: 'Москва' },
      { id: 'spb-01', name: 'ПВЗ Санкт-Петербург, Невский 88', city: 'Санкт-Петербург' },
      { id: 'ekb-01', name: 'ПВЗ Екатеринбург, Малышева 71', city: 'Екатеринбург' },
    ],
  },
  { key: 'post', label: 'Почта России', basePrice: 320, requiresAddress: true },
  { key: 'courier', label: 'Курьерская доставка', basePrice: 490, requiresAddress: true },
  { key: 'pickup', label: 'Самовывоз (шоурум Aethra)', basePrice: 0, requiresAddress: false },
];

export function findDeliveryMethod(key) {
  return DELIVERY_METHODS.find((m) => m.key === key);
}

/** Расчёт стоимости доставки. Базовая реализация без внешних API. */
export async function calcDeliveryCost(methodKey, _payload = {}) {
  const method = findDeliveryMethod(methodKey);
  if (!method) return null;
  return { key: method.key, label: method.label, cost: method.basePrice };
}

const MessageSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    from: { type: String, enum: ['seller', 'customer'], required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', MessageSchema);

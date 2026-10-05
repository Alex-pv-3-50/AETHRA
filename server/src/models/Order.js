import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'pending_payment',   // создан, ждёт оплаты
  'paid',              // оплачен (webhook / confirm)
  'pending_delivery',  // ожидает передачи в доставку (продавец видит в админке)
  'shipped',           // передан в доставку, есть трек-номер
  'delivered',         // доставлен
  'cancelled',         // отменён
];

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,       // снапшот на момент заказа
    price: Number,      // снапшот цены
    size: String,
    color: String,
    qty: { type: Number, required: true, min: 1 },
    image: String,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryCost: { type: Number, default: 0 },
    total: { type: Number, required: true },
    deliveryMethod: { type: String, required: true }, // cdek | post | courier | pickup
    deliveryAddress: {
      fullName: String,
      city: String,
      street: String,
      house: String,
      flat: String,
      zip: String,
      pickupPoint: String, // для СДЭК — выбранный ПВЗ
      phone: String,
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment' },
    trackingNumber: { type: String, default: '' },
    handoverDate: { type: String, default: '' }, // дата передачи в доставку (указывает продавец)
    paymentId: { type: String, default: '' },
    paymentProvider: { type: String, default: 'stripe' },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  },
  { timestamps: true }
);

OrderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;

export const Order = mongoose.model('Order', OrderSchema);

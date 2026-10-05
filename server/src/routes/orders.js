import { Router } from 'express';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Message } from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { findDeliveryMethod, calcDeliveryCost } from '../config/delivery.js';

const router = Router();

/**
 * POST /api/orders — создание заказа из корзины.
 * Тело: { items: [{productId, size, color, qty}], deliveryMethod, deliveryAddress }
 * Итоговая сумма считается на сервере по ценам из БД (анти-подделка цены).
 */
router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { items, deliveryMethod, deliveryAddress } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Корзина пуста' });
    }
    const method = findDeliveryMethod(deliveryMethod);
    if (!method) return res.status(400).json({ message: 'Неизвестный способ доставки' });
    if (method.requiresAddress && !deliveryAddress?.city) {
      return res.status(400).json({ message: 'Укажите адрес доставки' });
    }

    const orderItems = [];
    let subtotal = 0;
    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) return res.status(400).json({ message: `Товар ${it.productId} не найден` });
      const qty = Math.max(1, Number(it.qty) || 1);
      if (product.stock < qty) {
        return res.status(409).json({ message: `Недостаточно на складе: ${product.name}` });
      }
      subtotal += product.price * qty;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        size: it.size || '',
        color: it.color || '',
        qty,
        image: product.images?.[0] || '',
      });
    }

    const delivery = await calcDeliveryCost(method.key, { deliveryAddress });
    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      subtotal,
      deliveryCost: delivery?.cost ?? 0,
      total: subtotal + (delivery?.cost ?? 0),
      deliveryMethod: method.key,
      deliveryAddress: deliveryAddress || {},
      status: 'pending_payment',
    });

    // Списание остатков
    for (const it of orderItems) {
      await Product.updateOne({ _id: it.product }, { $inc: { stock: -it.qty } });
    }

    res.status(201).json({ order });
  })
);

/** GET /api/orders/my — заказы текущего покупателя (с сообщениями) */
router.get(
  '/my',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('messages');
    res.json({ orders });
  })
);

/** GET /api/orders/:id — один заказ (только свой или админ) */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('messages');
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    if (String(order.userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    res.json({ order });
  })
);

/**
 * POST /api/orders/:id/messages — переписка по заказу.
 * Покупатель может писать в свои заказы, продавец — в любые (роль admin).
 */
router.post(
  '/:id/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { text } = req.body || {};
    if (!text?.trim()) return res.status(400).json({ message: 'Пустое сообщение' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    const isOwner = String(order.userId) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    const message = await Message.create({
      orderId: order._id,
      from: req.user.role === 'admin' ? 'seller' : 'customer',
      text: text.trim(),
    });
    order.messages.push(message._id);
    await order.save();
    res.status(201).json({ message });
  })
);

export default router;

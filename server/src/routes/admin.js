import { Router } from 'express';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { sendEmail } from '../utils/mailer.js';

const router = Router();
router.use(requireAuth, requireAdmin);

/** GET /api/admin/orders — все заказы (последние 200) */
router.get(
  '/orders',
  asyncHandler(async (_req, res) => {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('userId', 'name email')
      .populate('messages');
    res.json({ orders, statuses: ORDER_STATUSES });
  })
);

/**
 * PATCH /api/admin/orders/:id — смена статуса, трек-номер, дата передачи.
 * Тело: { status?, trackingNumber?, handoverDate? }
 */
router.patch(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const { status, trackingNumber, handoverDate } = req.body || {};
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });

    if (status && ORDER_STATUSES.includes(status)) order.status = status;
    if (typeof trackingNumber === 'string') order.trackingNumber = trackingNumber.trim();
    if (typeof handoverDate === 'string') order.handoverDate = handoverDate;
    await order.save();
    res.json({ order });
  })
);

/**
 * POST /api/admin/orders/:id/message — сообщение покупателю:
 * уведомление в личный кабинет (запись Message) + письмо на email.
 * Тело: { text, notifyByEmail?: boolean }
 */
router.post(
  '/orders/:id/message',
  asyncHandler(async (req, res) => {
    const { text, notifyByEmail = true } = req.body || {};
    if (!text?.trim()) return res.status(400).json({ message: 'Пустое сообщение' });
    const order = await Order.findById(req.params.id).populate('userId', 'email name');
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });

    const message = await Message.create({ orderId: order._id, from: 'seller', text: text.trim() });
    order.messages.push(message._id);
    await order.save();

    let emailSent = false;
    if (notifyByEmail && order.userId?.email) {
      const r = await sendEmail({
        to: order.userId.email,
        subject: `Aethra: сообщение по заказу #${String(order._id).slice(-6)}`,
        text: `${order.userId.name}, здравствуйте!\n\n${text}\n\nКоманда Aethra`,
      });
      emailSent = Boolean(r.sent);
    }
    res.status(201).json({ message, emailSent });
  })
);

/** GET /api/admin/users — список покупателей (для контекста в админке) */
router.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await User.find({ role: 'customer' })
      .select('name email createdAt')
      .sort('-createdAt');
    res.json({ users });
  })
);

export default router;

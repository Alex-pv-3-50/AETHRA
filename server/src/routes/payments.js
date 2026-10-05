import { Router } from 'express';
import { Order } from '../models/Order.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getPaymentProvider } from '../config/payments.js';
import { env } from '../config/env.js';

const router = Router();

/** Помечает заказ оплаченным: pending_payment -> paid -> pending_delivery */
export async function markOrderPaid(orderId, paymentId) {
  return Order.findByIdAndUpdate(
    orderId,
    { status: 'pending_delivery', paymentId: paymentId || '', paidAt: new Date() },
    { new: true }
  );
}

/**
 * POST /api/payments/create-intent — Stripe PaymentIntent для заказа.
 * Если STRIPE_SECRET_KEY не задан (прототип без ключей) — возвращает
 * mock-режим, чтобы клиент мог провести «тестовую» оплату локально.
 */
router.post(
  '/create-intent',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderId } = req.body || {};
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    if (order.status !== 'pending_payment') {
      return res.status(409).json({ message: `Заказ уже в статусе ${order.status}` });
    }

    const provider = getPaymentProvider('stripe');
    if (!provider.available()) {
      // Mock-режим для локального запуска без ключей Stripe
      return res.json({
        mock: true,
        provider: 'stripe-mock',
        clientSecret: null,
        publishableKey: null,
        amount: order.total,
      });
    }
    const intent = await provider.createIntent(order);
    res.json({ ...intent, publishableKey: null /* отдаётся на клиенте через VITE key */ });
  })
);

/**
 * POST /api/payments/mock-confirm — имитация успешной оплаты (только когда
 * Stripe не настроен). В проде используется webhook ниже.
 */
router.post(
  '/mock-confirm',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { orderId } = req.body || {};
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    if (getPaymentProvider('stripe').available()) {
      return res.status(400).json({ message: 'Stripe настроен — используйте реальную оплату' });
    }
    const updated = await markOrderPaid(order._id, 'mock_payment');
    res.json({ order: updated });
  })
);

/**
 * GET /api/payments/status/:orderId — проверка статуса (fallback без вебхуков).
 */
router.get(
  '/status/:orderId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    res.json({ status: order.status });
  })
);

/**
 * POST /api/payments/webhook — подтверждение оплаты от Stripe.
 * Регистрируется raw-body-подписью на уровне app (см. index.js).
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const provider = getPaymentProvider('stripe');
    if (!provider.available() || !env.stripeWebhookSecret) {
      return res.status(503).json({ message: 'Stripe webhook не настроен' });
    }
    const signature = req.headers['stripe-signature'];
    let event;
    try {
      event = provider.client.webhooks.constructEvent(
        req.rawBody,
        signature,
        env.stripeWebhookSecret
      );
    } catch (err) {
      return res.status(400).json({ message: `Неверная подпись: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const orderId = intent.metadata?.orderId;
      if (orderId) await markOrderPaid(orderId, intent.id);
    }
    res.json({ received: true });
  })
);

export default router;

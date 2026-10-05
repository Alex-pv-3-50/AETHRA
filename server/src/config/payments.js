/**
 * Платёжный провайдер — тонкая прослойка между бизнес-логикой и Stripe.
 *
 * Архитектура: все операции оплаты идут через интерфейс PaymentProvider
 * { name, available, createIntent(order), confirmByIdentifiers(paymentId) }.
 *
 * Чтобы позже подключить YooKassa:
 * 1. Реализуй класс YooKassaProvider с теми же методами
 *    (Intents API: POST /payments, подтверждение через payment_id).
 * 2. Зарегистрируй его в getPaymentProvider() ниже или добавь
 *    переменной окружения PAYMENT_PROVIDER=yookassa выбор провайдера.
 * Ничего в роутах/моделях менять не нужно.
 */
import Stripe from 'stripe';
import { env } from '../config/env.js';

class StripeProvider {
  name = 'stripe';

  constructor() {
    this.client = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;
  }

  available() {
    return Boolean(this.client);
  }

  /** Создаёт PaymentIntent на сумму заказа (в копейках/центах). */
  async createIntent(order) {
    if (!this.client) throw new Error('Stripe не настроен (STRIPE_SECRET_KEY)');
    const intent = await this.client.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'rub',
      metadata: { orderId: String(order._id) },
      automatic_payment_methods: { enabled: true },
    });
    return { provider: this.name, clientSecret: intent.client_secret, paymentId: intent.id };
  }

  /** Проверка статуса платежа (используется как fallback без вебхуков). */
  async confirmByIdentifiers(paymentId) {
    if (!this.client) return null;
    const intent = await this.client.paymentIntents.retrieve(paymentId);
    return { status: intent.status, paid: intent.status === 'succeeded' };
  }
}

const providers = { stripe: new StripeProvider() };

export function getPaymentProvider(name = 'stripe') {
  return providers[name] || providers.stripe;
}

export { Stripe };

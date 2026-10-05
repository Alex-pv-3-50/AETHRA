import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import { DELIVERY_METHODS } from './config/delivery.js';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: false }));

// Webhook Stripe требует raw body — монтируем ДО json-parser
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  }
);

app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'aethra-api' }));

/** Справочник способов доставки для формы checkout */
app.get('/api/delivery/methods', (_req, res) => {
  res.json({
    methods: DELIVERY_METHODS.map((m) => ({
      key: m.key,
      label: m.label,
      basePrice: m.basePrice,
      requiresAddress: m.requiresAddress,
      pickupPoints: m.pickupPoints || [],
    })),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Единый обработчик ошибок
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message);
  const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
  res.status(status).json({ message: err.message || 'Внутренняя ошибка сервера' });
});

connectDB()
  .then(() => {
    app.listen(env.port, () =>
      console.log(`[server] Aethra API запущен: http://localhost:${env.port}`)
    );
  })
  .catch((err) => {
    console.error('[db] Не удалось подключиться к MongoDB:', err.message);
    console.error('     Проверьте, что MongoDB запущена и MONGO_URI верный (см. server/.env).');
    process.exit(1);
  });

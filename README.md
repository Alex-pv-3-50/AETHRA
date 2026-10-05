# Aethra — минималистичный интернет-магазин спортивной одежды

Рабочий прототип: **React + Vite + Tailwind** (клиент) · **Node.js + Express + MongoDB/Mongoose** (сервер) ·
**JWT + bcrypt** (авторизация) · **Stripe test mode** с архитектурой, позволяющей заменить на YooKassa
(весь провайдер платежей изолирован в `server/src/config/payments.js`).

## Структура проекта

```
aethra/
├── client/                     # React + Vite + Tailwind (порт 5173)
│   └── src/
│       ├── api/client.js       # fetch-слой ко всем /api/*
│       ├── context/            # CartContext (корзина), AuthContext (сессия JWT)
│       ├── components/         # Navbar, ProductCard, PayOrderBlock
│       ├── pages/              # Home, Catalog, ProductPage, Cart, Checkout,
│       │                       # Account (ЛК), Admin (панель продавца), About, Contacts
│       └── utils/format.js     # ₽-формат, лейблы категорий/цветов/статусов
├── server/                     # Express API (порт 5000)
│   ├── scripts/
│   │   ├── seed.js             # наполнение БД (11 товаров, админ, демо-покупатель)
│   │   └── e2e-memory-test.mjs # smoke-тест всего флоу на in-memory Mongo
│   └── src/
│       ├── index.js            # приложение, raw-body для stripe webhook
│       ├── config/             # env, db, payments (Stripe|YooKassa-интерфейс), delivery (СДЭК/Почта/Курьер/Самовывоз)
│       ├── models/             # User, Product, Order, Message
│       ├── middleware/         # auth (requireAuth/requireAdmin), asyncHandler
│       ├── routes/             # auth, products, orders, payments, admin
│       └── utils/mailer.js     # nodemailer (без SMTP — лог в консоль)
└── README.md
```

## Запуск локально

Требуется: Node.js ≥ 18 и MongoDB (локально или MongoDB Atlas).

```bash
# Терминал 1 — сервер
cd server
cp .env.example .env        # при необходимости поправьте MONGO_URI / ключи
npm install
npm run seed                # товары + аккаунты
npm run dev                 # http://localhost:5000

# Терминал 2 — клиент
cd client
cp .env.example .env        # можно оставить пустым — включится тестовый режим оплаты
npm install
npm run dev                 # http://localhost:5173 (Vite проксирует /api → :5000)
```

### Тестовые аккаунты (после `npm run seed`)

| Роль       | Email             | Пароль   |
|------------|-------------------|----------|
| Покупатель | demo@aethra.shop  | demo123  |
| Продавец   | admin@aethra.shop | admin123 |

## Оплата

* **Со Stripe-ключами** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` в `server/.env`,
  `VITE_STRIPE_PUBLISHABLE_KEY` в `client/.env`) — создаётся PaymentIntent, подтверждение
  приходит на `POST /api/payments/webhook` (проверка raw-body-подписи).
* **Без ключей** — автоматически включается тестовый режим: кнопка «Оплатить» вызывает
  `POST /api/payments/mock-confirm`, заказ переходит в `pending_delivery`. Прототип работает
  целиком без доступа к интернету и платёжным аккаунтам.
* Замена на **YooKassa**: реализуйте тот же интерфейс (`available()`, `createIntent()`) в новом
  классе в `server/src/config/payments.js` и поменяйте строку регистрации провайдера —
  остальной код не меняется.

## Доставка и связь продавца с покупателем

1. Покупатель оформляет заказ: **СДЭК (с выбором ПВЗ)** / Почта России / Курьер / Самовывоз
   (`GET /api/delivery/methods`; расчёт стоимости — `server/src/config/delivery.js`, для боевого
   СДЭК предусмотрен `CDEK_API_KEY`).
2. После оплаты заказ получает статус **`pending_delivery`** и виден продавцу в `/admin`.
3. Продавец может указать **трек-номер СДЭК и дату передачи в доставку**, сменить статус и
   **написать покупателю** (`POST /api/admin/orders/:id/message`) — сообщение попадает
   в личный кабинет и дублируется на email (nodemailer; без SMTP пишет в консоль).
4. Покупатель видит трек, дату и переписку в `/account`, может ответить продавцу
   (`POST /api/orders/:id/messages`).

Статусы заказа: `pending_payment → pending_delivery → shipped → delivered` (+ `cancelled`).

## API (основное)

| Метод | Путь | Назначение |
|---|---|---|
| POST  | `/api/auth/register`, `/api/auth/login` | регистрация/вход, выдача JWT |
| GET   | `/api/auth/me` | текущий пользователь |
| PATCH | `/api/auth/addresses` | сохранённые адреса |
| GET   | `/api/products?category=&size=&color=&sort=price_asc\|price_desc` | каталог с фильтрами |
| GET   | `/api/products/:id` | карточка товара |
| POST  | `/api/orders` | создание заказа (цены считаются на сервере) |
| GET   | `/api/orders/my` | история заказов покупателя |
| POST  | `/api/orders/:id/messages` | сообщение покупателя продавцу |
| POST  | `/api/payments/create-intent` | Stripe PaymentIntent (или mock-режим) |
| POST  | `/api/payments/mock-confirm` | тестовая оплата без ключей |
| POST  | `/api/payments/webhook` | подтверждение оплаты от Stripe |
| GET   | `/api/admin/orders` | все заказы (роль admin) |
| PATCH | `/api/admin/orders/:id` | статус / трек-номер / дата передачи |
| POST  | `/api/admin/orders/:id/message` | сообщение покупателю (кабинет + email) |

Корзина живёт на клиенте (`CartContext` + localStorage); итог заказа пересчитывается
на сервере по ценам из БД (защита от подмены цены).

## Smoke-тест бэкенда (опционально)

```bash
cd server
npm i -D mongodb-memory-server
node scripts/e2e-memory-test.mjs   # 17 проверок: auth → filters → order → pay → admin → tracking
```

## Переменные окружения (`server/.env.example`)

```
MONGO_URI=mongodb://127.0.0.1:27017/aethra
PORT=5000
JWT_SECRET=change-me
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CDEK_API_KEY=
# SMTP_* — опционально, для реальных писем (без них письма логируются в консоль)
```

import 'dotenv/config';

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aethra',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

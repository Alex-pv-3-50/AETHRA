import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../src/models/Product.js';
import { User } from '../src/models/User.js';
import { buildProducts } from './productsData.js';

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aethra';
  await mongoose.connect(uri);
  console.log('[seed] подключено к', uri);

  await Product.deleteMany({});
  await Product.insertMany(buildProducts());
  console.log('[seed] товары загружены:', await Product.countDocuments());

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@aethra.shop';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Aethra Admin',
      email: adminEmail,
      passwordHash: await User.hashPassword(adminPassword),
      role: 'admin',
    });
    console.log(`[seed] создан админ: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('[seed] админ уже существует:', adminEmail);
  }

  // Демо-покупатель для быстрых тестов
  const demoEmail = 'demo@aethra.shop';
  if (!(await User.findOne({ email: demoEmail }))) {
    await User.create({
      name: 'Demo Customer',
      email: demoEmail,
      passwordHash: await User.hashPassword('demo123'),
      addresses: [{ label: 'Дом', city: 'Москва', street: 'Тверская', house: '12', flat: '45', zip: '125009' }],
    });
    console.log(`[seed] демо-покупатель: ${demoEmail} / demo123`);
  }

  await mongoose.disconnect();
  console.log('[seed] готово');
}

run().catch((e) => {
  console.error('[seed] ошибка:', e.message);
  process.exit(1);
});

import { Router } from 'express';
import { User } from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

/** POST /api/auth/register */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Заполните имя, email и пароль' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не короче 6 символов' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: 'Email уже зарегистрирован' });

    const user = await User.create({
      name,
      email,
      passwordHash: await User.hashPassword(password),
    });
    res.status(201).json({ token: signToken(user), user });
  })
);

/** POST /api/auth/login */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user || !(await user.comparePassword(password || ''))) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    res.json({ token: signToken(user), user });
  })
);

/** GET /api/auth/me */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

/** PATCH /api/auth/addresses — добавить/обновить сохранённый адрес */
router.patch(
  '/addresses',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { addresses } = req.body || {};
    if (!Array.isArray(addresses)) {
      return res.status(400).json({ message: 'Ожидается массив addresses' });
    }
    req.user.addresses = addresses;
    await req.user.save();
    res.json({ user: req.user });
  })
);

export default router;

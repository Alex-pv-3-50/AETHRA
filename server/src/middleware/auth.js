import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export function signToken(user) {
  return jwt.sign({ id: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: '7d',
  });
}

/** Требует авторизации: Bearer-токен -> req.user */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Требуется авторизация' });
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Пользователь не найден' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
}

/** Только для администраторов (использовать после requireAuth). */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }
  next();
}

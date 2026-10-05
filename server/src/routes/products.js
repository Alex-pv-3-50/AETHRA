import { Router } from 'express';
import { Product, CATEGORIES, SIZES, COLORS } from '../models/Product.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

/**
 * GET /api/products?category=&size=&color=&sort=price_asc|price_desc&q=
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, size, color, sort, q } = req.query;
    const filter = {};
    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (size && SIZES.includes(size)) filter.sizes = size;
    if (color && COLORS.includes(color)) filter.colors = color;
    if (q) filter.$text = { $search: String(q) };

    let query = Product.find(filter);
    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const products = await query;
    res.json({ products, meta: { categories: CATEGORIES, sizes: SIZES, colors: COLORS } });
  })
);

/** GET /api/products/:id */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    res.json({ product });
  })
);

export default router;

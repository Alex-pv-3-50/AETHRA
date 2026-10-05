import mongoose from 'mongoose';

export const CATEGORIES = ['tshirts', 'shorts', 'leggings', 'jackets', 'accessories'];
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const COLORS = ['black', 'white', 'gray', 'blue', 'red'];

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 }, // в рублях
    category: { type: String, enum: CATEGORIES, required: true },
    sizes: [{ type: String, enum: SIZES }],
    colors: [{ type: String, enum: COLORS }],
    images: [{ type: String }], // URL или data-URI (SVG-плейсхолдеры в прототипе)
    stock: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model('Product', ProductSchema);

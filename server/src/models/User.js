import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Дом' },
    fullName: String,
    city: String,
    street: String,
    house: String,
    flat: String,
    zip: String,
  },
  { _id: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

/** В JSON не отдаём хеш пароля. */
UserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = mongoose.model('User', UserSchema);

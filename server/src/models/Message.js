import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    from: { type: String, enum: ['seller', 'customer'], required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', MessageSchema);

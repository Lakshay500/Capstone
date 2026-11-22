const mongoose = require('mongoose');

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: {
      fullName: { type: String, required: [true, 'fullName is required'], trim: true },
      line1: { type: String, required: [true, 'line1 is required'], trim: true },
      city: { type: String, required: [true, 'city is required'], trim: true },
      postalCode: { type: String, required: [true, 'postalCode is required'], trim: true },
      phone: { type: String, trim: true },
    },
    payment: {
      method: { type: String, default: 'SIMULATED' },
      status: { type: String, default: 'simulated_paid' },
    },
    status: { type: String, enum: STATUSES, default: 'pending' },
    statusHistory: [{ _id: false, status: String, at: { type: Date, default: Date.now }, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
module.exports.STATUSES = STATUSES;

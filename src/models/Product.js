const mongoose = require('mongoose');

const int = { validator: Number.isInteger, message: '{PATH} must be a whole number' };

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    price: { type: Number, required: [true, 'Price is required'], min: [0.01, 'Price must be greater than 0'] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], validate: int, default: 0 },
    lowStockThreshold: { type: Number, min: 0, validate: int, default: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ seller: 1, stock: 1 });

module.exports = mongoose.model('Product', productSchema);

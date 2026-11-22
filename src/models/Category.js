const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], unique: true, trim: true, minlength: 2, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Category', categorySchema);

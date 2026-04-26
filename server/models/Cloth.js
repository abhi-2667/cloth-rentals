const mongoose = require('mongoose');

const clothSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  occasion: { type: String, enum: ['wedding', 'party', 'casual'], default: 'casual' },
  gender: { type: String, enum: ['women', 'men', 'unisex'], default: 'unisex' },
  size: { type: String, required: true },
  pricePerDay: { type: Number, required: true },
  availability: { type: Boolean, default: true },
  imageUrl: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Cloth', clothSchema);

const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  sizes: [{ type: String, enum: ["S", "M", "L", "XL"] }],
  materials: [{ type: String, enum: ["Papier mat", "Papier brillant", "Alu-Dibond", "Toile"] }],
  imageUrl: { type: String, required: true }, // URL de l'image du produit
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", ProductSchema);
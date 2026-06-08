const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      size: { type: String },
      material: { type: String },
      quantity: { type: Number, default: 1 },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["En attente", "Payé", "Expédié", "Livré", "Annulé"],
    default: "En attente",
  },
  paymentMethod: { type: String, default: "MonCash" },
  paymentReference: { type: String }, // Référence de paiement MonCash
  downloadLink: { type: String }, // Lien de téléchargement pour les produits numériques
  downloadExpiresAt: { type: Date }, // Date d'expiration du lien
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("order", OrderSchema);
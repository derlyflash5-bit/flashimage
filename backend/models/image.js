const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ["Portrait", "Paysage", "Événementiel", "Art", "Autre"],
    required: true,
  },
  url: { type: String, required: true }, // URL de l'image sur Cloudinary
  thumbnailUrl: { type: String, required: true }, // URL de la miniature
  watermarkUrl: { type: String }, // URL de l'image avec filigrane
  isFeatured: { type: Boolean, default: false }, // Pour les images en avant
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("image", ImageSchema);
const express = require("express");
const router = express.Router();

// Middleware pour désactiver le clic droit (à utiliser avec le frontend)
router.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https://res.cloudinary.com; script-src 'self' 'unsafe-inline'");
  next();
});

// Middleware pour servir les images avec filigrane (si nécessaire)
const serveWatermarkedImage = (req, res, next) => {
  // Logique pour vérifier si l'utilisateur a le droit de voir l'image sans filigrane
  // Par exemple, si l'utilisateur a payé pour le produit
  const hasAccess = req.user && req.user.role === "admin"; // Exemple simple
  if (!hasAccess) {
    // Rediriger vers l'image avec filigrane
    const imageUrl = req.originalUrl.replace("/images/", "/images/watermark/");
    return res.redirect(imageUrl);
  }
  next();
};

module.exports = { serveWatermarkedImage };
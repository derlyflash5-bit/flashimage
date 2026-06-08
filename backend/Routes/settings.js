const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middlewares/auth");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration de Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Mettre à jour le logo du site (Admin uniquement)
router.post("/logo", protect, admin, upload.single("logo"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Aucun fichier téléversé" });

    // Télécharger le logo sur Cloudinary
    const result = await cloudinary.uploader.upload(file.buffer, {
      folder: "flashimage/settings",
      public_id: "logo",
      transformation: [
        { width: 300, height: 300, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    // Sauvegarder l'URL du logo dans les variables d'environnement (ou dans la base de données)
    // Ici, on suppose que vous utilisez une base de données pour stocker les paramètres
    // Exemple: await Setting.findOneAndUpdate({ key: "logo" }, { value: result.secure_url }, { upsert: true });

    res.json({ logoUrl: result.secure_url, message: "Logo mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du logo", error });
  }
});

// Récupérer le logo du site
router.get("/logo", async (req, res) => {
  try {
    // Récupérer l'URL du logo depuis la base de données ou les variables d'environnement
    // Exemple: const setting = await Setting.findOne({ key: "logo" });
    const logoUrl = process.env.LOGO_URL || "https://canva.link/53pkp1lsu8o8olk";
    res.json({ logoUrl });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du logo", error });
  }
});

module.exports = router;
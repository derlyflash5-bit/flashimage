const express = require("express");
const router = express.Router();
const Image = require("../models/image");  // ✅ Chemin vers models/
const { protect, admin } = require("../middlewares/auth");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration de Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ajouter une image (Admin uniquement)
router.post("/", protect, admin, upload.single("image"), async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Aucun fichier téléversé" });

    // Télécharger l'image sur Cloudinary
    const result = await cloudinary.uploader.upload(file.buffer, {
      folder: "flashimage",
      transformation: [
        { width: 2000, height: 2000, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    // Créer une miniature
    const thumbnailResult = await cloudinary.uploader.upload(file.buffer, {
      folder: "flashimage/thumbnails",
      transformation: [
        { width: 300, height: 300, crop: "fill" },
        { quality: "auto:good" },
      ],
    });

    // Créer une version avec filigrane
    const watermarkResult = await cloudinary.uploader.upload(file.buffer, {
      folder: "flashimage/watermark",
      transformation: [
        { width: 2000, height: 2000, crop: "limit" },
        { overlay: "flashimage_watermark", gravity: "southeast", x: 10, y: 10, opacity: 50 },
        { quality: "auto:good" },
      ],
    });

    // Sauvegarder dans la base de données
    const image = new Image({
      title,
      description,
      category,
      url: result.secure_url,
      thumbnailUrl: thumbnailResult.secure_url,
      watermarkUrl: watermarkResult.secure_url,
    });

    await image.save();
    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de l'image", error: error.message });
  }
});

// Récupérer toutes les images
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = category ? { category } : {};

    const images = await Image.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Image.countDocuments(query);
    res.json({ images, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des images", error: error.message });
  }
});

// Supprimer une image (Admin uniquement)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);
    if (!image) return res.status(404).json({ message: "Image non trouvée" });

    // Supprimer l'image de Cloudinary
    const publicId = image.url.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`flashimage/${publicId}`);
    await cloudinary.uploader.destroy(`flashimage/thumbnails/${publicId}`);
    await cloudinary.uploader.destroy(`flashimage/watermark/${publicId}`);

    res.json({ message: "Image supprimée avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'image", error: error.message });
  }
});

module.exports = router;
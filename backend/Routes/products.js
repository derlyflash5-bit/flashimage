const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const { protect, admin } = require("../middlewares/auth");

// Ajouter un produit (Admin uniquement)
router.post("/", protect, admin, async (req, res) => {
  try {
    const { title, description, category, price, sizes, materials, imageUrl, stock } = req.body;

    const product = new Product({
      title,
      description,
      category,
      price,
      sizes,
      materials,
      imageUrl,
      stock,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout du produit", error });
  }
});

// Récupérer tous les produits (avec pagination et filtres)
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = category ? { category } : {};

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);
    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des produits", error });
  }
});

// Récupérer un produit par ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du produit", error });
  }
});

// Mettre à jour un produit (Admin uniquement)
router.put("/:id", protect, admin, async (req, res) => {
  try {
    const { title, description, category, price, sizes, materials, imageUrl, stock } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { title, description, category, price, sizes, materials, imageUrl, stock },
      { new: true }
    );

    if (!product) return res.status(404).json({ message: "Produit non trouvé" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du produit", error });
  }
});

// Supprimer un produit (Admin uniquement)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Produit non trouvé" });
    res.json({ message: "Produit supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du produit", error });
  }
});

module.exports = router;
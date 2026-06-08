const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/product");
const { protect, admin } = require("../middlewares/auth");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Configuration de Nodemailer (pour l'envoi d'emails)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Créer une commande
router.post("/", protect, async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, paymentReference } = req.body;

    // Vérifier que les produits existent et que le stock est suffisant
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(400).json({ message: `Produit ${item.product} non trouvé` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Stock insuffisant pour ${product.title}` });
      }
    }

    // Créer la commande
    const order = new Order({
      user: req.user._id,
      items,
      totalAmount,
      paymentMethod,
      paymentReference,
      status: paymentMethod === "MonCash" ? "Payé" : "En attente",
    });

    // Générer un lien de téléchargement unique (pour les produits numériques)
    if (paymentMethod === "MonCash") {
      const downloadToken = crypto.randomBytes(32).toString("hex");
      order.downloadLink = `${process.env.FRONTEND_URL}/download?token=${downloadToken}`;
      order.downloadExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    }

    await order.save();

    // Mettre à jour le stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Envoyer un email de confirmation
    if (order.status === "Payé") {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: req.user.email,
        subject: "Confirmation de votre commande chez Flashimage",
        html: `
          <p>Bonjour ${req.user.name},</p>
          <p>Votre commande #${order._id} a été confirmée.</p>
          <p>Montant total: ${totalAmount} HTG</p>
          ${order.downloadLink ? `<p>Téléchargez vos fichiers ici: <a href="${order.downloadLink}">${order.downloadLink}</a> (lien valable 24h)</p>` : ""}
          <p>Merci pour votre achat !</p>
        `,
      };
      await transporter.sendMail(mailOptions);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de la commande", error });
  }
});

// Récupérer les commandes de l'utilisateur
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des commandes", error });
  }
});

// Récupérer toutes les commandes (Admin uniquement)
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find().populate("user").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des commandes", error });
  }
});

// Mettre à jour le statut d'une commande (Admin uniquement)
router.put("/:id/status", protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Commande non trouvée" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du statut", error });
  }
});

module.exports = router;
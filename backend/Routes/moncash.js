const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/order");
const { protect } = require("../middlewares/auth");

// Configuration de l'API MonCash (à adapter selon la documentation officielle)
const MONCASH_API_URL = "https://api.moncash.example.com"; // Remplacer par l'URL réelle
const MONCASH_API_KEY = process.env.MONCASH_API_KEY;
const MONCASH_MERCHANT_ID = process.env.MONCASH_MERCHANT_ID;

// Initiation d'un paiement MonCash
router.post("/create-payment", protect, async (req, res) => {
  try {
    const { amount, phoneNumber, orderId } = req.body;

    // Vérifier que la commande existe
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Commande non trouvée" });

    // Appeler l'API MonCash pour initier le paiement
    const response = await axios.post(
      `${MONCASH_API_URL}/payments`,
      {
        merchantId: MONCASH_MERCHANT_ID,
        amount,
        phoneNumber,
        reference: `FLASHIMAGE-${orderId}`,
        callbackUrl: `${process.env.BACKEND_URL}/moncash/callback`,
      },
      {
        headers: {
          "Authorization": `Bearer ${MONCASH_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Mettre à jour la commande avec la référence de paiement
    order.paymentReference = response.data.paymentReference;
    await order.save();

    res.json({
      paymentReference: response.data.paymentReference,
      qrCode: response.data.qrCode, // Si MonCash fournit un QR code
      message: "Paiement initié. Veuillez confirmer sur votre téléphone.",
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'initiation du paiement", error: error.message });
  }
});

// Callback de MonCash (pour confirmer le paiement)
router.post("/callback", async (req, res) => {
  try {
    const { paymentReference, status, transactionId } = req.body;

    // Vérifier la validité de la requête (à adapter selon MonCash)
    if (status === "SUCCESS") {
      // Trouver la commande associée
      const order = await Order.findOne({ paymentReference });
      if (order) {
        // Mettre à jour le statut de la commande
        order.status = "Payé";
        order.transactionId = transactionId;

        // Générer un lien de téléchargement (si applicable)
        const crypto = require("crypto");
        const downloadToken = crypto.randomBytes(32).toString("hex");
        order.downloadLink = `${process.env.FRONTEND_URL}/download?token=${downloadToken}`;
        order.downloadExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        await order.save();

        // Envoyer un email de confirmation (optionnel)
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        const user = await User.findById(order.user);
        if (user) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Paiement confirmé - Votre commande chez Flashimage",
            html: `
              <p>Bonjour ${user.name},</p>
              <p>Votre paiement pour la commande #${order._id} a été confirmé.</p>
              <p>Montant: ${order.totalAmount} HTG</p>
              ${order.downloadLink ? `<p>Téléchargez vos fichiers ici: <a href="${order.downloadLink}">${order.downloadLink}</a> (lien valable 24h)</p>` : ""}
              <p>Merci pour votre achat !</p>
            `,
          };
          await transporter.sendMail(mailOptions);
        }
      }
    }

    res.status(200).json({ message: "Callback reçu" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du traitement du callback", error });
  }
});

module.exports = router;
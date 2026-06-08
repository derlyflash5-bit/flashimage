const express = require("express");
const router = express.Router();
const Flutterwave = require("flutterwave-node-v3");
const Order = require("../models/order");
const { protect } = require("../middlewares/auth");

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY
);

// Initiation d'un paiement
router.post("/create-payment", protect, async (req, res) => {
  try {
    const { amount, email, phoneNumber, orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Commande non trouvée" });

    const payload = {
      tx_ref: `FLASHIMAGE-${orderId}`,
      amount: amount,
      currency: "HTG",
      redirect_url: `${process.env.FRONTEND_URL}/checkout/success?orderId=${orderId}`,
      payment_options: "mobilemoney,card",
      customer: { email, phonenumber: phoneNumber },
      customizations: {
        title: "Flashimage - Paiement",
        description: `Paiement pour la commande #${orderId}`,
        logo: process.env.LOGO_URL,
      },
    };

    const response = await flw.Payment.create(payload);
    res.json({ paymentUrl: response.data.link });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'initiation du paiement", error: error.message });
  }
});

// Vérifier le statut d'un paiement
router.get("/verify-payment/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    const response = await flw.Transaction.verify({ id: transactionId });
    if (response.data.status === "successful") {
      const order = await Order.findOne({ paymentReference: transactionId });
      if (order) {
        order.status = "Payé";
        order.paymentReference = transactionId;
        await order.save();
      }
      res.json({ status: "success" });
    } else {
      res.json({ status: "failed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la vérification du paiement", error: error.message });
  }
});

module.exports = router;
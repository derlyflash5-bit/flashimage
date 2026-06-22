require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Importer les routes
const authRoutes = require("./Routes/auth");
const imageRoutes = require("./Routes/image");
const productRoutes = require("./Routes/products");
const orderRoutes = require("./Routes/orders");
const testimonialRoutes = require("./Routes/testimonials");
const contactRoutes = require("./Routes/contact");
const moncashRoutes = require("./Routes/moncash");
const settingsRoutes = require("./Routes/settings");
// const flutterwaveRoutes = require("./Routes/flutterwave");
const { protect, admin } = require("./middlewares/auth");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connecté à MongoDB Atlas"))
  .catch((err) => console.error("❌ Erreur de connexion à MongoDB:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/images", protect, imageRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", protect, orderRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/contact", contactRoutes);
// app.use("/api/flutterwave", flutterwaveRoutes);
app.use("/api/settings", protect, admin, settingsRoutes);

// Route pour le téléchargement des fichiers
app.get("/api/download", protect, async (req, res) => {
  try {
    const { token } = req.query;
    const Order = require("./models/Order");
    const order = await Order.findOne({ downloadLink: { $regex: token } });

    if (!order || order.downloadExpiresAt < new Date()) {
      return res.status(403).json({ message: "Lien de téléchargement invalide ou expiré" });
    }

    res.json({ message: "Téléchargement autorisé", orderId: order._id });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du téléchargement", error: error.message });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur backend démarré sur http://localhost:${PORT}`);
});
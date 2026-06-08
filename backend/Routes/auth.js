const express = require("express");
const router = express.Router();
const User = require("../models/user");  // ✅ Chemin vers models/ (en minuscules)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { protect, admin } = require("../middlewares/auth");

// Inscription
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "Cet email est déjà utilisé" });

    // Créer un nouvel utilisateur (admin par défaut si premier utilisateur)
    const isFirstUser = (await User.countDocuments()) === 0;
    const user = new User({ name, email, password, role: isFirstUser ? "admin" : "user" });
    await user.save();

    // Générer un token JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription", error: error.message });
  }
});

// Connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

    // Générer un token JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion", error: error.message });
  }
});

// Récupérer le profil de l'utilisateur
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération du profil", error: error.message });
  }
});

module.exports = router;
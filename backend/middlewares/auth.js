const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Middleware pour protéger les routes
const protect = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Accès refusé. Aucun token fourni." });

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

// Middleware pour vérifier le rôle admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé. Réservé aux administrateurs." });
  }
};

module.exports = { protect, admin };
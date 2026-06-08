const express = require("express");
const router = express.Router();
const Testimonial = require("../models/testimonial");
const { protect, admin } = require("../middlewares/auth");

// Ajouter un témoignage
router.post("/", async (req, res) => {
  try {
    const { name, email, message, rating } = req.body;

    const testimonial = new Testimonial({
      name,
      email,
      message,
      rating,
    });

    await testimonial.save();
    res.status(201).json({ message: "Témoignage soumis avec succès ! Il sera publié après modération." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout du témoignage", error });
  }
});

// Récupérer tous les témoignages approuvés
router.get("/", async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des témoignages", error });
  }
});

// Approuver un témoignage (Admin uniquement)
router.put("/:id/approve", protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!testimonial) return res.status(404).json({ message: "Témoignage non trouvé" });
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'approbation du témoignage", error });
  }
});

// Supprimer un témoignage (Admin uniquement)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ message: "Témoignage non trouvé" });
    res.json({ message: "Témoignage supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression du témoignage", error });
  }
});

module.exports = router;
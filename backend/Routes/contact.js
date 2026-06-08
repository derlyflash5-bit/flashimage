const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { protect } = require("../middlewares/auth");

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Envoyer un message via le formulaire de contact
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Nouveau message de ${name} - ${subject}`,
      html: `
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Votre message a été envoyé avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'envoi du message", error });
  }
});

module.exports = router;
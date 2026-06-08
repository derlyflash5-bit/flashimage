const mongoose = require("mongoose");

const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  isApproved: { type: Boolean, default: false }, // Pour modération
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("testimonial", TestimonialSchema);
const express = require("express");
const { 
  getTestimonials, 
  getTestimonialStats 
} = require("../../controllers/shop/testimonials-controller");

const router = express.Router();

router.get("/get", getTestimonials);
router.get("/stats", getTestimonialStats);

module.exports = router; 
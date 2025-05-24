const express = require("express");
const { getStats } = require("../../controllers/shop/stats-controller");

const router = express.Router();

router.get("/get", getStats);

module.exports = router; 
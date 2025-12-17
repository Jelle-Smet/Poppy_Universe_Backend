const express = require('express');
const router = express.Router();
const moonsController = require('../Controllers/Moons_Controller');
const { protect } = require('../middleware/Auth');

// ---------------- MOON ENCYCLOPEDIA ----------------
router.get('/encyclopedia', protect, moonsController.getMoonEncyclopedia);

// ---------------- MOON DETAIL ----------------
router.get('/:id', protect, moonsController.getMoonById);

module.exports = router;

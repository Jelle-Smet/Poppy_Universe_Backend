const express = require('express');
const router = express.Router();
const engineController = require('../Controllers/Engine_Controller');
const { protect } = require('../Middleware/Auth'); // 1. Import your auth middleware

// 🌌 This one stays public (no protect needed)
router.get('/pool', protect, engineController.getCelestialPool); 

// 👤 This one NEEDS protect to populate req.userId
router.post('/user', protect, engineController.getUserConfig); 

// ML Data Probes
router.get('/l2', protect, engineController.getLayer2Data);
router.get('/l3', protect, engineController.getLayer3Data);
router.get('/l4', protect, engineController.getLayer4Data);

module.exports = router;
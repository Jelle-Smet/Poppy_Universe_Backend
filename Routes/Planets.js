// routes/planets.js
const express = require('express');
const router = express.Router();
const planetsController = require('../Controllers/Planets_Controller');

router.get('/', planetsController.getAllPlanets);

module.exports = router;

// routes/foros.js
const express = require('express');
const router = express.Router();
const forosController = require('../controllers/forosController');

// Rutas
router.get('/foros', forosController.obtenerForos);
router.get('/foros/:id', forosController.obtenerForoPorId);
router.post('/foros', forosController.crearForo);

module.exports = router;

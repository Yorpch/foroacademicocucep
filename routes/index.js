// routes/index.js
const express = require('express');
const router = express.Router();
const forosRoutes = require('./foros');
const authRouter = require('./auth');

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ mensaje: "La API funciona correctamente" });
});

// Rutas principales
router.use('/', forosRoutes);
router.use('/auth', authRouter);

module.exports = router;

const express = require('express');
const router = express.Router();

const forosRoutes = require('./foros');
const authRouter = require('./auth');
const usuariosRouter = require('./usuarios');
const categoriasRouter = require('./categorias');

// Rutas principales
router.get('/test', (req, res) => res.json({ mensaje: "API funcionando" }));

router.use('/foros', forosRoutes);
router.use('/auth', authRouter);
router.use('/usuarios', usuariosRouter);
router.use('/categorias', categoriasRouter);

module.exports = router;

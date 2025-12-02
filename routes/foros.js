// routes/foros.js
const express = require('express');
const router = express.Router();
const forosController = require('../controllers/forosController');
const { verificarToken, adminOProfesor } = require('../middlewares/authMiddleware');

// ===============================
//     RUTAS DE CATEGORÍAS
// ===============================

// Obtener todas las categorías
router.get('/categorias', forosController.obtenerCategorias);

// Obtener categoría específica con sus foros
router.get('/categoria/:id', forosController.obtenerCategoriaConForos);

// ===============================
//     RUTAS DE FOROS
// ===============================

// Obtener foro por ID (individual)
router.get('/foro/:id', forosController.obtenerForoPorId);

// Crear foro (solo admin / profesor)
router.post('/foro', verificarToken, adminOProfesor, forosController.crearForo);

// ===============================
//     RUTAS DE PUBLICACIONES (MENSAJES)
// ===============================

// Obtener publicaciones de un foro (requiere autenticación)
router.get('/foro/:id/mensajes', verificarToken, forosController.obtenerMensajes);

// Crear publicación en un foro (requiere autenticación)
router.post('/foro/:id/mensaje', verificarToken, forosController.crearMensaje);

// ===============================
//     RUTAS DE DEBUG/DIAGNÓSTICO
// ===============================

// Diagnóstico completo de base de datos
router.get('/diagnostico', forosController.diagnosticoDB);

// Verificar estructura de la base de datos
router.get('/debug/estructura', forosController.verificarEstructuraDB);

// ===============================
//     RUTAS ALTERNATIVAS (compatibilidad)
// ===============================

// Ruta alternativa para obtener foro
router.get('/:id', forosController.obtenerForoPorId);

module.exports = router;
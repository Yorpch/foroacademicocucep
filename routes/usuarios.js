const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware');

// Obtener profesores pendientes (solo admin)
router.get('/profesores/pendientes', verificarToken, soloAdmin, usuarioController.obtenerProfesoresPendientes);

// Obtener usuarios por tipo (solo admin)
router.get('/tipo/:tipo', verificarToken, soloAdmin, usuarioController.obtenerUsuariosPorTipo);

// Obtener todos los usuarios (solo admin)
router.get('/', verificarToken, soloAdmin, usuarioController.obtenerUsuarios);

// Obtener un usuario por ID (admin o el mismo usuario)
router.get('/:id', verificarToken, usuarioController.obtenerUsuarioPorId);

// Crear un nuevo usuario (solo admin)
router.post('/', verificarToken, soloAdmin, usuarioController.crearUsuario);

// Actualizar contraseña (propietario o admin)
router.put('/:id/password', verificarToken, usuarioController.actualizarPassword);

// Actualizar un usuario (admin o dueño)
router.put('/:id', verificarToken, usuarioController.actualizarUsuario);

// Eliminar usuario (solo admin)
router.delete('/:id', verificarToken, soloAdmin, usuarioController.eliminarUsuario);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const registerController = require('../controllers/registerController');

// Ruta POST para login (la original)
router.post('/login', authController.login);

// ⚠️ RUTA TEMPORAL SOLO PARA DESARROLLO
router.post('/update-password', registerController.actualizarPassword);

// Ruta GET temporal de prueba
router.get('/test-login', (req, res) => {
  res.json({ 
    mensaje: "Endpoint de autenticación funcionando",
    instrucciones: "Para hacer login, envía una petición POST a /api/auth/login con:",
    ejemplo_body: {
      correo: "usuario@ejemplo.com",
      contrasena: "tu_contraseña"
    },
    nota: "Esta ruta GET es solo para pruebas. El login real usa POST."
  });
});

module.exports = router;
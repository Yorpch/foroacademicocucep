const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware para verificar que el usuario envía un token válido
 */
exports.verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1]; // Formato: "Bearer token"

    if (!token) {
        return res.status(401).json({ mensaje: 'Token inválido o ausente' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Guardamos datos del usuario del token
        next();
    } catch (error) {
        console.error('Error de validación de token:', error.message);
        return res.status(403).json({ mensaje: 'Token inválido o expirado' });
    }
};

/**
 * Middleware para permitir solo a ADMIN
 */
exports.soloAdmin = (req, res, next) => {
    if (req.user.rol !== 1) { // si rol_id = 1 => administrador
        return res.status(403).json({ mensaje: 'Acceso denegado: solo administradores' });
    }
    next();
};

/**
 * Middleware para permitir admins y profesores
 */
exports.adminOProfesor = (req, res, next) => {
    if (req.user.rol === 1 || req.user.rol === 2) { 
        return next();
    }
    return res.status(403).json({ mensaje: 'Acceso denegado: se requiere rol profesor o admin' });
};

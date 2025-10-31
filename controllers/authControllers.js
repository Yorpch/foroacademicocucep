const pool = require('../config/bd');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Login de usuario
exports.login = async (req, res) => {
  console.log('🔵 Inicio de login');
  console.log('📦 Body recibido:', req.body);
  
  const { correo, contrasena } = req.body;

  // Validar que lleguen los datos
  if (!correo || !contrasena) {
    console.log('❌ Faltan datos en la petición');
    return res.status(400).json({ mensaje: 'Correo y contraseña son requeridos' });
  }

  try {
    console.log('🔍 Buscando usuario con email:', correo);
    
    const result = await pool.query(
      'SELECT id, nombre, apellido_paterno, email, password_hash, tipo_usuario, rol_id, estado_cuenta FROM usuario WHERE email = $1',
      [correo]
    );

    console.log('📊 Resultados encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];
    console.log('👤 Usuario encontrado:', {
      id: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo_usuario,
      estado: usuario.estado_cuenta
    });

    // Verificar que la cuenta esté activa
    if (usuario.estado_cuenta !== 'activo') {
      console.log('⚠️ Cuenta no está activa:', usuario.estado_cuenta);
      return res.status(403).json({ mensaje: 'Cuenta inactiva o suspendida' });
    }

    console.log('🔐 Verificando contraseña...');
    console.log('Hash en BD:', usuario.password_hash);
    console.log('Contraseña recibida:', contrasena);
    
    const passwordValida = await bcrypt.compare(contrasena, usuario.password_hash);
    console.log('✅ Contraseña válida:', passwordValida);
    
    if (!passwordValida) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    console.log('🎫 Generando token JWT...');
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        tipo_usuario: usuario.tipo_usuario,
        rol: usuario.rol_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    console.log('✅ Login exitoso');
    res.json({ 
      mensaje: 'Login exitoso', 
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido_paterno,
        email: usuario.email,
        tipo: usuario.tipo_usuario
      }
    });
    
  } catch (error) {
    console.error('💥 ERROR COMPLETO:', error);
    console.error('💥 Stack trace:', error.stack);
    console.error('💥 Mensaje:', error.message);
    res.status(500).json({ 
      mensaje: 'Error interno del servidor', 
      error: error.message,
      detalle: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
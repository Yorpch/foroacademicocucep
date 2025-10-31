const pool = require('../config/bd');
const bcrypt = require('bcryptjs');

// Endpoint temporal para crear/actualizar contraseñas
exports.actualizarPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: 'Email y password son requeridos' });
  }

  try {
    // Generar hash
    const hash = bcrypt.hashSync(password, 10);
    console.log(`Hash generado para ${email}:`, hash);

    // Actualizar en la base de datos
    const result = await pool.query(
      'UPDATE usuario SET password_hash = $1 WHERE email = $2 RETURNING email',
      [hash, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({ 
      mensaje: 'Contraseña actualizada exitosamente',
      email: result.rows[0].email,
      hash_generado: hash
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ mensaje: 'Error al actualizar contraseña' });
  }
};
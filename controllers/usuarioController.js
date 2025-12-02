const pool = require('../config/bd');
const bcrypt = require('bcryptjs');

exports.obtenerUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, nombre, apellido_paterno, apellido_materno, email, 
        tipo_usuario, matricula, cedula_profesional, telefono,
        estado_validacion, estado_cuenta, avatar_url,
        fecha_creacion, ultima_conexion
      FROM usuario 
      ORDER BY fecha_creacion DESC
    `);

    res.json({
      mensaje: 'Usuarios obtenidos exitosamente',
      total: result.rows.length,
      usuarios: result.rows
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
  }
};

exports.obtenerUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        id, nombre, apellido_paterno, apellido_materno, email, 
        tipo_usuario, matricula, cedula_profesional, telefono,
        estado_validacion, estado_cuenta, avatar_url, rol_id,
        fecha_creacion, fecha_actualizacion, ultima_conexion
      FROM usuario 
      WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json({
      mensaje: 'Usuario encontrado',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuario', error: error.message });
  }
};

exports.crearUsuario = async (req, res) => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    email,
    password,
    tipo_usuario,
    matricula,
    cedula_profesional,
    telefono
  } = req.body;

  if (!nombre || !apellido_paterno || !email || !password || !tipo_usuario) {
    return res.status(400).json({ 
      mensaje: 'Faltan campos obligatorios: nombre, apellido_paterno, email, password, tipo_usuario' 
    });
  }

  if (!email.endsWith('@cucep.edu.mx')) {
    return res.status(400).json({ 
      mensaje: 'El email debe ser del dominio @cucep.edu.mx' 
    });
  }

  if (tipo_usuario === 'estudiante' && !matricula) {
    return res.status(400).json({ 
      mensaje: 'Los estudiantes deben proporcionar una matrícula' 
    });
  }

  if (tipo_usuario === 'profesor' && !cedula_profesional) {
    return res.status(400).json({ 
      mensaje: 'Los profesores deben proporcionar una cédula profesional' 
    });
  }

  try {
    const emailExiste = await pool.query(
      'SELECT id FROM usuario WHERE email = $1',
      [email]
    );

    if (emailExiste.rows.length > 0) {
      return res.status(409).json({ mensaje: 'El email ya está registrado' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = await pool.query(`
      INSERT INTO usuario (
        nombre, apellido_paterno, apellido_materno, email, password_hash,
        tipo_usuario, matricula, cedula_profesional, telefono
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, nombre, apellido_paterno, email, tipo_usuario, estado_validacion
    `, [
      nombre, 
      apellido_paterno, 
      apellido_materno || null, 
      email, 
      passwordHash,
      tipo_usuario, 
      matricula || null, 
      cedula_profesional || null, 
      telefono || null
    ]);

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ 
        mensaje: 'El email, matrícula o cédula ya están registrados' 
      });
    }
    
    res.status(500).json({ 
      mensaje: 'Error al crear usuario', 
      error: error.message 
    });
  }
};

exports.actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    telefono,
    avatar_url,
    estado_cuenta
  } = req.body;

  try {
    const usuarioExiste = await pool.query(
      'SELECT id FROM usuario WHERE id = $1',
      [id]
    );

    if (usuarioExiste.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const campos = [];
    const valores = [];
    let contador = 1;

    if (nombre !== undefined) {
      campos.push(`nombre = $${contador}`);
      valores.push(nombre);
      contador++;
    }
    if (apellido_paterno !== undefined) {
      campos.push(`apellido_paterno = $${contador}`);
      valores.push(apellido_paterno);
      contador++;
    }
    if (apellido_materno !== undefined) {
      campos.push(`apellido_materno = $${contador}`);
      valores.push(apellido_materno);
      contador++;
    }
    if (telefono !== undefined) {
      campos.push(`telefono = $${contador}`);
      valores.push(telefono);
      contador++;
    }
    if (avatar_url !== undefined) {
      campos.push(`avatar_url = $${contador}`);
      valores.push(avatar_url);
      contador++;
    }
    if (estado_cuenta !== undefined) {
      campos.push(`estado_cuenta = $${contador}`);
      valores.push(estado_cuenta);
      contador++;
    }

    if (campos.length === 0) {
      return res.status(400).json({ mensaje: 'No se proporcionaron campos para actualizar' });
    }

    valores.push(id);

    const query = `
      UPDATE usuario 
      SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $${contador}
      RETURNING id, nombre, apellido_paterno, apellido_materno, email, tipo_usuario, estado_cuenta
    `;

    const result = await pool.query(query, valores);

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error al actualizar usuario', 
      error: error.message 
    });
  }
};

exports.actualizarPassword = async (req, res) => {
  const { id } = req.params;
  const { password_actual, password_nuevo } = req.body;

  if (!password_actual || !password_nuevo) {
    return res.status(400).json({ 
      mensaje: 'Se requiere la contraseña actual y la nueva contraseña' 
    });
  }

  if (password_nuevo.length < 6) {
    return res.status(400).json({ 
      mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' 
    });
  }

  try {
    const result = await pool.query(
      'SELECT id, password_hash FROM usuario WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];

    const passwordValida = bcrypt.compareSync(password_actual, usuario.password_hash);
    
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    const nuevoHash = bcrypt.hashSync(password_nuevo, 10);

    await pool.query(
      'UPDATE usuario SET password_hash = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
      [nuevoHash, id]
    );

    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ 
      mensaje: 'Error al actualizar contraseña', 
      error: error.message 
    });
  }
};

exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const usuarioExiste = await pool.query(
      'SELECT id, email, tipo_usuario FROM usuario WHERE id = $1',
      [id]
    );

    if (usuarioExiste.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = usuarioExiste.rows[0];

    if (usuario.email === 'admin@cucep.edu.mx') {
      return res.status(403).json({ 
        mensaje: 'No se puede eliminar el administrador principal del sistema' 
      });
    }

    await pool.query(
      `UPDATE usuario 
       SET estado_cuenta = 'inactivo', fecha_actualizacion = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );

    res.json({ 
      mensaje: 'Usuario desactivado exitosamente',
      nota: 'El usuario fue desactivado pero no eliminado permanentemente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      mensaje: 'Error al eliminar usuario', 
      error: error.message 
    });
  }
};

exports.obtenerUsuariosPorTipo = async (req, res) => {
  const { tipo } = req.params;

  const tiposValidos = ['estudiante', 'profesor', 'administrador'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ 
      mensaje: 'Tipo de usuario inválido. Debe ser: estudiante, profesor o administrador' 
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        id, nombre, apellido_paterno, apellido_materno, email, 
        tipo_usuario, matricula, cedula_profesional, estado_validacion,
        estado_cuenta, fecha_creacion
      FROM usuario 
      WHERE tipo_usuario = $1
      ORDER BY fecha_creacion DESC
    `, [tipo]);

    res.json({
      mensaje: `Usuarios de tipo ${tipo} obtenidos exitosamente`,
      total: result.rows.length,
      usuarios: result.rows
    });
  } catch (error) {
    console.error('Error al obtener usuarios por tipo:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios', error: error.message });
  }
};

exports.obtenerProfesoresPendientes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM v_profesor_pendiente
    `);

    res.json({
      mensaje: 'Profesores pendientes obtenidos exitosamente',
      total: result.rows.length,
      profesores: result.rows
    });
  } catch (error) {
    console.error('Error al obtener profesores pendientes:', error);
    res.status(500).json({ mensaje: 'Error al obtener profesores pendientes', error: error.message });
  }
};
// controllers/forosController.js
const db = require('../config/bd');

// ===================================================
//      OBTENER TODAS LAS CATEGORÍAS CON FOROS
// ===================================================
exports.obtenerCategorias = async (req, res) => {
  try {
    const categorias = await db.query(`
      SELECT c.id, c.nombre, c.descripcion, c.slug
      FROM categoria c
      WHERE c.activa = TRUE
      ORDER BY c.orden ASC;
    `);

    res.json(categorias.rows);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ mensaje: "Error al obtener categorías" });
  }
};

// ===================================================
//          OBTENER UNA CATEGORÍA CON SUS FOROS
// ===================================================
exports.obtenerCategoriaConForos = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await db.query(
      `SELECT id, nombre, descripcion, slug
       FROM categoria
       WHERE id = $1`,
      [id]
    );

    if (categoria.rows.length === 0) {
      return res.status(404).json({ mensaje: "Categoría no encontrada" });
    }

    const foros = await db.query(
      `SELECT id, nombre, descripcion
       FROM foro
       WHERE categoria_id = $1
       ORDER BY orden ASC`,
      [id]
    );

    res.json({
      ...categoria.rows[0],
      foros: foros.rows
    });

  } catch (error) {
    console.error("Error al obtener categoría:", error);
    res.status(500).json({ mensaje: "Error al obtener categoría" });
  }
};

// ===================================================
//          OBTENER UN FORO INDIVIDUAL POR ID
// ===================================================
exports.obtenerForoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const foro = await db.query(
      `SELECT id, nombre, descripcion, categoria_id
       FROM foro
       WHERE id = $1`,
      [id]
    );

    if (foro.rows.length === 0) {
      return res.status(404).json({ mensaje: "Foro no encontrado" });
    }

    res.json(foro.rows[0]);

  } catch (error) {
    console.error("Error al obtener foro:", error);
    res.status(500).json({ mensaje: "Error al obtener foro" });
  }
};

// ===================================================
//                CREAR NUEVO FORO
// ===================================================
exports.crearForo = async (req, res) => {
  try {
    const { categoria_id, nombre, descripcion, slug, creado_por } = req.body;

    const nuevo = await db.query(
      `INSERT INTO foro (categoria_id, nombre, descripcion, slug, creado_por)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [categoria_id, nombre, descripcion, slug, creado_por]
    );

    res.json(nuevo.rows[0]);

  } catch (error) {
    console.error("Error al crear foro:", error);
    res.status(500).json({ mensaje: "Error al crear foro" });
  }
};

// ===================================================
//             OBTENER PUBLICACIONES DEL FORO (MENSAJES) - ACTUALIZADO
// ===================================================
exports.obtenerMensajes = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Obteniendo publicaciones para foro ID:', id);

    let publicaciones = [];

    // INTENTO 1: Buscar en publicacion
    try {
      const result = await db.query(
        `SELECT 
          p.id, 
          p.contenido as mensaje, 
          p.fecha_creacion as fecha_envio,
          p.fue_editada as fue_editado, 
          p.fecha_edicion,
          p.numero_publicacion,
          p.es_primera_publicacion,
          p.hilo_id,
          u.id as usuario_id, 
          u.nombre, 
          u.apellido_paterno, 
          u.email,
          u.rol_id,
          u.tipo_usuario
         FROM publicacion p
         JOIN usuario u ON u.id = p.autor_id
         WHERE p.hilo_id = $1
         ORDER BY p.numero_publicacion ASC`,
        [id]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Encontradas ${result.rows.length} publicaciones en 'publicacion'`);
        return res.json(result.rows);
      }

      console.log('⚠️ No hay publicaciones en tabla "publicacion", buscando en "foro_mensajes"...');
    } catch (error1) {
      console.log('❌ Error con publicacion:', error1.message);
    }

    // INTENTO 2: Buscar en foro_mensajes
    try {
      const result = await db.query(
        `SELECT 
          f.id, 
          f.mensaje, 
          f.fecha_creacion as fecha_envio,
          false as fue_editado, 
          null as fecha_edicion,
          1 as numero_publicacion,
          true as es_primera_publicacion,
          f.foro_id as hilo_id,
          u.id as usuario_id, 
          u.nombre, 
          u.apellido_paterno, 
          u.email,
          u.rol_id,
          u.tipo_usuario
         FROM foro_mensajes f
         JOIN usuario u ON u.id = f.usuario_id
         WHERE f.foro_id = $1
         ORDER BY f.fecha_creacion ASC`,
        [id]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Encontrados ${result.rows.length} mensajes en 'foro_mensajes'`);
        return res.json(result.rows);
      }

      console.log('⚠️ No hay mensajes en "foro_mensajes"');
    } catch (error2) {
      console.log('❌ Error con foro_mensajes:', error2.message);
    }

    // INTENTO 3: Buscar en mensaje_chat
    try {
      const result = await db.query(
        `SELECT 
          m.id, 
          m.mensaje, 
          m.fecha_envio,
          m.fue_editado, 
          m.fecha_edicion,
          1 as numero_publicacion,
          true as es_primera_publicacion,
          m.canal_id as hilo_id,
          u.id as usuario_id, 
          u.nombre, 
          u.apellido_paterno, 
          u.email,
          u.rol_id,
          u.tipo_usuario
         FROM mensaje_chat m
         JOIN usuario u ON u.id = m.usuario_id
         WHERE m.canal_id = $1
         ORDER BY m.fecha_envio ASC`,
        [id]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Encontrados ${result.rows.length} mensajes en 'mensaje_chat'`);
        return res.json(result.rows);
      }

      console.log('⚠️ No hay mensajes en "mensaje_chat"');
    } catch (error3) {
      console.log('❌ Error con mensaje_chat:', error3.message);
    }

    // Si no encuentra en ninguna, devolver array vacío
    console.log('📭 No se encontraron mensajes en ninguna tabla');
    return res.json([]);

  } catch (error) {
    console.error("❌ Error al obtener publicaciones:", error);
    res.status(500).json({ 
      mensaje: "Error al obtener publicaciones", 
      error: error.message
    });
  }
};

// ===================================================
//          CREAR NUEVA PUBLICACIÓN - VERSIÓN DIAGNÓSTICA
// ===================================================
exports.crearMensaje = async (req, res) => {
  try {
    const { id } = req.params; // ID del foro
    const { mensaje } = req.body;
    
    console.log('🔍 INICIANDO PUBLICACIÓN - Diagnóstico completo');
    console.log('📌 Foro ID recibido:', id);
    console.log('📝 Mensaje recibido:', mensaje?.substring(0, 50) + '...');
    console.log('👤 Usuario autenticado:', req.user);
    
    // Validaciones básicas
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        mensaje: 'Usuario no autenticado',
        debug: { user: req.user }
      });
    }
    
    if (!mensaje || mensaje.trim() === '') {
      return res.status(400).json({ mensaje: 'El mensaje no puede estar vacío' });
    }
    
    const usuarioId = req.user.id;
    const mensajeLimpio = mensaje.trim();
    
    // ============================================
    // DIAGNÓSTICO: Verificar qué tablas existen
    // ============================================
    console.log('🔍 Verificando tablas disponibles...');
    
    let resultado;
    const intentos = [];
    
    // INTENTO 1: Usar tabla publicacion (si hilo_id = foro.id)
    try {
      console.log('🔄 Intento 1: Insertar en publicacion...');
      
      // Primero verificar si el foro existe como hilo
      const foroComoHilo = await db.query(
        'SELECT id FROM foro WHERE id = $1',
        [id]
      );
      
      if (foroComoHilo.rows.length === 0) {
        throw new Error(`Foro con ID ${id} no existe en tabla foro`);
      }
      
      // Obtener siguiente número de publicación
      const ultimaPub = await db.query(
        'SELECT COALESCE(MAX(numero_publicacion), 0) as max_num FROM publicacion WHERE hilo_id = $1',
        [id]
      );
      
      const siguienteNumero = (ultimaPub.rows[0]?.max_num || 0) + 1;
      const esPrimera = siguienteNumero === 1;
      
      console.log(`📊 Insertando publicación #${siguienteNumero} (primera: ${esPrimera})`);
      
      resultado = await db.query(
        `INSERT INTO publicacion (
          hilo_id, autor_id, contenido, contenido_html,
          es_primera_publicacion, numero_publicacion,
          fue_editada, fecha_creacion, ip_creacion
        ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), '0.0.0.0')
        RETURNING id, contenido, fecha_creacion, numero_publicacion, es_primera_publicacion`,
        [id, usuarioId, mensajeLimpio, mensajeLimpio, esPrimera, siguienteNumero]
      );
      
      intentos.push({ metodo: 'publicacion', exito: true, id: resultado.rows[0].id });
      console.log('✅ Éxito con tabla publicacion');
      
    } catch (error1) {
      console.log('❌ Error con publicacion:', error1.message);
      intentos.push({ metodo: 'publicacion', exito: false, error: error1.message });
    }
    
    // INTENTO 2: Crear tabla temporal si publicacion falló
    if (!resultado) {
      try {
        console.log('🔄 Intento 2: Crear tabla temporal foro_mensajes...');
        
        // Verificar si existe la tabla
        const tablaExiste = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'foro_mensajes'
          )
        `);
        
        if (!tablaExiste.rows[0].exists) {
          console.log('📝 Creando tabla foro_mensajes...');
          await db.query(`
            CREATE TABLE IF NOT EXISTS foro_mensajes (
              id SERIAL PRIMARY KEY,
              foro_id INTEGER NOT NULL,
              usuario_id INTEGER NOT NULL,
              mensaje TEXT NOT NULL,
              fecha_creacion TIMESTAMP DEFAULT NOW(),
              FOREIGN KEY (usuario_id) REFERENCES usuario(id)
            )
          `);
          console.log('✅ Tabla foro_mensajes creada');
        }
        
        // Insertar en la nueva tabla
        resultado = await db.query(
          `INSERT INTO foro_mensajes (foro_id, usuario_id, mensaje)
           VALUES ($1, $2, $3)
           RETURNING id, mensaje, fecha_creacion`,
          [id, usuarioId, mensajeLimpio]
        );
        
        intentos.push({ metodo: 'foro_mensajes', exito: true, id: resultado.rows[0].id });
        console.log('✅ Éxito con tabla foro_mensajes');
        
      } catch (error2) {
        console.log('❌ Error con foro_mensajes:', error2.message);
        intentos.push({ metodo: 'foro_mensajes', exito: false, error: error2.message });
      }
    }
    
    // INTENTO 3: Usar mensaje_chat (si canal_id puede ser foro.id)
    if (!resultado) {
      try {
        console.log('🔄 Intento 3: Usar mensaje_chat con canal_id = foro.id');
        
        resultado = await db.query(
          `INSERT INTO mensaje_chat (canal_id, usuario_id, mensaje, fecha_envio, fue_editado)
           VALUES ($1, $2, $3, NOW(), false)
           RETURNING id, mensaje, fecha_envio`,
          [id, usuarioId, mensajeLimpio]
        );
        
        intentos.push({ metodo: 'mensaje_chat', exito: true, id: resultado.rows[0].id });
        console.log('✅ Éxito con mensaje_chat');
        
      } catch (error3) {
        console.log('❌ Error con mensaje_chat:', error3.message);
        intentos.push({ metodo: 'mensaje_chat', exito: false, error: error3.message });
      }
    }
    
    // ============================================
    // RESULTADO FINAL
    // ============================================
    
    if (!resultado) {
      console.log('❌ Todos los intentos fallaron');
      return res.status(500).json({
        mensaje: 'No se pudo crear la publicación en ninguna tabla',
        intentos: intentos,
        diagnostico: {
          foro_id: id,
          usuario_id: usuarioId,
          tablas_intentadas: ['publicacion', 'foro_mensajes', 'mensaje_chat']
        },
        recomendacion: 'Ejecuta GET /api/foros/diagnostico para ver estructura de BD'
      });
    }
    
    // Éxito - Obtener datos completos con información del usuario
    console.log('✅ Publicación creada exitosamente');
    
    // Determinar de qué tabla viene el resultado
    const esDePublicacion = intentos.find(i => i.metodo === 'publicacion' && i.exito);
    const esDeForoMensajes = intentos.find(i => i.metodo === 'foro_mensajes' && i.exito);
    const esDeMensajeChat = intentos.find(i => i.metodo === 'mensaje_chat' && i.exito);
    
    let publicacionCompleta;
    
    if (esDePublicacion) {
      publicacionCompleta = await db.query(
        `SELECT p.id, p.contenido as mensaje, p.fecha_creacion as fecha_envio,
                p.fue_editada as fue_editado, p.fecha_edicion,
                p.numero_publicacion, p.es_primera_publicacion,
                u.id as usuario_id, u.nombre, u.apellido_paterno, u.email,
                u.rol_id, u.tipo_usuario
         FROM publicacion p
         JOIN usuario u ON u.id = p.autor_id
         WHERE p.id = $1`,
        [resultado.rows[0].id]
      );
    } else if (esDeForoMensajes) {
      publicacionCompleta = await db.query(
        `SELECT f.id, f.mensaje, f.fecha_creacion as fecha_envio,
                false as fue_editado, null as fecha_edicion,
                1 as numero_publicacion, true as es_primera_publicacion,
                u.id as usuario_id, u.nombre, u.apellido_paterno, u.email,
                u.rol_id, u.tipo_usuario
         FROM foro_mensajes f
         JOIN usuario u ON u.id = f.usuario_id
         WHERE f.id = $1`,
        [resultado.rows[0].id]
      );
    } else if (esDeMensajeChat) {
      publicacionCompleta = await db.query(
        `SELECT m.id, m.mensaje, m.fecha_envio,
                m.fue_editado, m.fecha_edicion,
                1 as numero_publicacion, true as es_primera_publicacion,
                u.id as usuario_id, u.nombre, u.apellido_paterno, u.email,
                u.rol_id, u.tipo_usuario
         FROM mensaje_chat m
         JOIN usuario u ON u.id = m.usuario_id
         WHERE m.id = $1`,
        [resultado.rows[0].id]
      );
    }
    
    const respuesta = {
      ...publicacionCompleta.rows[0],
      diagnostico: {
        tabla_usada: esDePublicacion ? 'publicacion' : 
                    esDeForoMensajes ? 'foro_mensajes' : 'mensaje_chat',
        intentos: intentos
      }
    };
    
    console.log('📤 Enviando respuesta:', respuesta);
    res.status(201).json(respuesta);
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO en crearMensaje:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      mensaje: 'Error crítico al crear mensaje',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      solicitud: {
        foro_id: req.params?.id,
        usuario: req.user,
        mensaje_length: req.body?.mensaje?.length
      }
    });
  }
};

// ===================================================
//          DIAGNÓSTICO DE BASE DE DATOS
// ===================================================
exports.diagnosticoDB = async (req, res) => {
  try {
    console.log('🔍 Haciendo diagnóstico de base de datos...');
    
    // 1. Verificar tablas relacionadas con foros/mensajes
    const tablas = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('foro', 'publicacion', 'mensaje_chat', 'canal', 'hilo', 'categoria', 'usuario', 'foro_mensajes')
      ORDER BY table_name
    `);
    
    // 2. Verificar estructura de cada tabla
    const estructuras = {};
    for (const tabla of tablas.rows) {
      const columnas = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tabla.table_name]);
      
      estructuras[tabla.table_name] = columnas.rows;
    }
    
    // 3. Verificar relaciones (claves foráneas)
    const relaciones = await db.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('publicacion', 'mensaje_chat', 'foro_mensajes', 'foro')
    `);
    
    // 4. Verificar datos de ejemplo
    const datosEjemplo = {};
    
    // Foros
    try {
      const foros = await db.query('SELECT id, nombre, categoria_id FROM foro LIMIT 5');
      datosEjemplo.foros = foros.rows;
    } catch (e) {
      datosEjemplo.foros = { error: e.message };
    }
    
    // Publicaciones
    try {
      const publicaciones = await db.query('SELECT id, hilo_id, autor_id, contenido FROM publicacion LIMIT 5');
      datosEjemplo.publicaciones = publicaciones.rows;
    } catch (e) {
      datosEjemplo.publicaciones = { error: e.message };
    }
    
    // Mensajes chat
    try {
      const mensajesChat = await db.query('SELECT id, canal_id, usuario_id, mensaje FROM mensaje_chat LIMIT 5');
      datosEjemplo.mensajes_chat = mensajesChat.rows;
    } catch (e) {
      datosEjemplo.mensajes_chat = { error: e.message };
    }
    
    // Foro mensajes (tabla temporal)
    try {
      const foroMensajes = await db.query('SELECT id, foro_id, usuario_id, mensaje FROM foro_mensajes LIMIT 5');
      datosEjemplo.foro_mensajes = foroMensajes.rows;
    } catch (e) {
      datosEjemplo.foro_mensajes = { error: e.message };
    }
    
    const resultado = {
      timestamp: new Date().toISOString(),
      tablas_existentes: tablas.rows.map(t => t.table_name),
      estructuras: estructuras,
      relaciones_foraneas: relaciones.rows,
      datos_ejemplo: datosEjemplo,
      recomendaciones: []
    };
    
    // Análisis automático
    if (estructuras.publicacion) {
      const tieneHiloId = estructuras.publicacion.some(col => col.column_name === 'hilo_id');
      const tieneAutorId = estructuras.publicacion.some(col => col.column_name === 'autor_id');
      
      if (tieneHiloId && tieneAutorId) {
        resultado.recomendaciones.push({
          tabla: 'publicacion',
          mensaje: '✅ Tabla publicacion tiene estructura adecuada para foros',
          uso_recomendado: 'Usar para publicaciones en foros (hilo_id → foro.id)',
          columnas_relevantes: estructuras.publicacion.filter(col => 
            ['hilo_id', 'autor_id', 'contenido', 'numero_publicacion'].includes(col.column_name)
          )
        });
      }
    }
    
    if (estructuras.mensaje_chat) {
      const tieneCanalId = estructuras.mensaje_chat.some(col => col.column_name === 'canal_id');
      const tieneUsuarioId = estructuras.mensaje_chat.some(col => col.column_name === 'usuario_id');
      
      if (tieneCanalId) {
        resultado.recomendaciones.push({
          tabla: 'mensaje_chat',
          mensaje: '⚠️ Tabla mensaje_chat requiere canal_id existente',
          uso_recomendado: 'Para chat en tiempo real, no para foros',
          advertencia: 'Puede fallar con error de clave foránea fk_mensaje_canal'
        });
      }
    }
    
    if (estructuras.foro_mensajes) {
      resultado.recomendaciones.push({
        tabla: 'foro_mensajes',
        mensaje: '📝 Tabla temporal creada por el sistema',
        uso_recomendado: 'Tabla de respaldo si otras fallan',
        origen: 'Creada automáticamente por crearMensaje()'
      });
    }
    
    // Verificar si hay foros existentes
    if (datosEjemplo.foros && !datosEjemplo.foros.error && datosEjemplo.foros.length > 0) {
      resultado.recomendaciones.push({
        mensaje: '📊 Foros existentes encontrados',
        foros: datosEjemplo.foros.map(f => ({ id: f.id, nombre: f.nombre })),
        instruccion: `Usar estos IDs para probar: ${datosEjemplo.foros.map(f => f.id).join(', ')}`
      });
    }
    
    console.log('✅ Diagnóstico completado');
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    res.status(500).json({ 
      mensaje: 'Error en diagnóstico', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ===================================================
//          FUNCIÓN PARA VERIFICAR ESTRUCTURA DB
// ===================================================
exports.verificarEstructuraDB = async (req, res) => {
  try {
    console.log('🔍 Verificando estructura de la base de datos...');
    
    // 1. Tablas existentes
    const tablas = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // 2. Estructura de foro
    const estructuraForo = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'foro'
      ORDER BY ordinal_position
    `);
    
    // 3. Estructura de publicacion
    const estructuraPublicacion = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'publicacion'
      ORDER BY ordinal_position
    `);
    
    // 4. Estructura de usuario
    const estructuraUsuario = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'usuario'
      ORDER BY ordinal_position
    `);
    
    // 5. Datos de ejemplo
    const forosEjemplo = await db.query(`SELECT id, nombre FROM foro LIMIT 5`);
    const usuariosEjemplo = await db.query(`SELECT id, nombre, email FROM usuario LIMIT 3`);
    const publicacionesEjemplo = await db.query(`
      SELECT p.id, p.hilo_id, p.autor_id, p.numero_publicacion, p.fecha_creacion
      FROM publicacion p 
      LIMIT 5
    `);

    const resultado = {
      tablas: tablas.rows.map(t => t.table_name),
      estructuras: {
        foro: estructuraForo.rows,
        publicacion: estructuraPublicacion.rows,
        usuario: estructuraUsuario.rows
      },
      datos_ejemplo: {
        foros: forosEjemplo.rows,
        usuarios: usuariosEjemplo.rows,
        publicaciones: publicacionesEjemplo.rows
      },
      relaciones: {
        publicacion_hilo_id: "→ referencia a foro.id o hilo.id",
        publicacion_autor_id: "→ referencia a usuario.id"
      }
    };
    
    console.log('✅ Verificación completada:', resultado);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
    res.status(500).json({ 
      mensaje: 'Error verificando estructura', 
      error: error.message,
      paso: "Revisa la conexión a la base de datos"
    });
  }
};
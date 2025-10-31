// Controlador de Foros
const foros = [
  { id: 1, titulo: "Foro de Programación", descripcion: "Discusión sobre código y buenas prácticas" },
  { id: 2, titulo: "Foro de Proyectos", descripcion: "Avances y retroalimentación de proyectos académicos" }
];

// Obtener todos los foros
exports.obtenerForos = (req, res) => {
  res.json(foros);
};

// Obtener foro por ID
exports.obtenerForoPorId = (req, res) => {
  const foro = foros.find(f => f.id === parseInt(req.params.id));
  if (!foro) return res.status(404).json({ mensaje: "Foro no encontrado" });
  res.json(foro);
};

// Crear un nuevo foro
exports.crearForo = (req, res) => {
  const { titulo, descripcion } = req.body;
  const nuevoForo = { id: foros.length + 1, titulo, descripcion };
  foros.push(nuevoForo);
  res.status(201).json(nuevoForo);
};

const express = require('express');
const app = express();
const rutas = require('./routes/index.js');

app.use(express.json());


app.use((req, res, next) => {
  console.log(` ${req.method} ${req.url}`);
  next();
});


app.get('/', (req, res) => {
  res.json({ 
    mensaje: "Servidor funcionando correctamente",
    endpoints: [
      "GET /api/test",
      "GET /api/foros",
      "POST /api/foros",
      "GET /api/foros/:id"
    ]
  });
});


app.use('/api', rutas);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:3000`);
  console.log('Endpoints disponibles:');
  console.log('  - http://localhost:3000/');
  console.log('  - http://localhost:3000/api/test');
  console.log('  - http://localhost:3000/api/foros');
});
const bcrypt = require('bcryptjs');

const usuarios = [
  { email: 'admin@cucep.edu.mx', password: 'admin123' },
  { email: 'juan.perez@cucep.edu.mx', password: 'admin123' },
  { email: 'maria.gonzalez@cucep.edu.mx', password: 'admin123' }
];

console.log('Generando hashes con bcryptjs...\n');

usuarios.forEach(usuario => {
  const hash = bcrypt.hashSync(usuario.password, 10);
  console.log(`-- ${usuario.email}`);
  console.log(`UPDATE usuario SET password_hash = '${hash}' WHERE email = '${usuario.email}';`);
  console.log('');
});

console.log('\n✅ Copia y ejecuta estos comandos en PostgreSQL');
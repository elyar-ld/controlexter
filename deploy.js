import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import readline from 'readline';

// Función para ejecutar comandos de consola
const run = (comando) => {
  console.log(`\n> ${comando}`);
  execSync(comando, { stdio: 'inherit' });
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('¿Estás seguro de que deseas desplegar a producción? Escribe "deploy" para confirmar: ', (answer) => {
  if (answer.trim().toLowerCase() !== 'deploy') {
    console.log('❌ Despliegue cancelado.');
    rl.close();
    process.exit(0);
  }

  rl.close();

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  try {
    console.log('Construyendo el proyecto...');
    run('npm run build');

  console.log('\nNavegando a la carpeta dist...');
  const distPath = path.resolve('dist');
  process.chdir(distPath);

  run('git init');
  run('git add -A');
  run('git commit -m "Deploy"');

  console.log('\nSubiendo a gh-pages...');
  
  // Si tienes el token en el .env (GITHUB_TOKEN=tu_token)
  if (GITHUB_TOKEN) {
    run(`git push -f https://${GITHUB_TOKEN}@github.com/extercontrol/control-exter.git master:gh-pages`);
  } else {
    // Si no hay token, asume que estás usando SSH o te autenticarás manualmente
    run('git push -f git@github.com:extercontrol/control-exter.git master:gh-pages');
  }

  console.log('\n¡Despliegue completado con éxito!');
  } catch (error) {
    console.error('\nOcurrió un error durante el despliegue:', error.message);
    process.exit(1);
  }
});

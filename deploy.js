import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// Función para ejecutar comandos de consola
const run = (comando) => {
  console.log(`\n> ${comando}`);
  execSync(comando, { stdio: 'inherit' });
};

// Cargar variables de entorno desde el archivo .env si existe
const envPath = path.resolve('.env');
if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

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

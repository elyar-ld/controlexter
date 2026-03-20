# Consumidor de apis de appscript de control-exter

Frontend para la creación de certificados usando apis de appscript y google docs

## Instalación

Run `npm install`

## Debugging

Después de instalar Run `npm run dev`

## Despliegue

Para desplegar el proyecto en GitHub Pages de forma automatizada:

1. Asegúrate de tener configurada la variable `GITHUB_TOKEN` en tu archivo `.env` (en la raíz del proyecto):
   ```env
   GITHUB_TOKEN=tu_token_de_github
   ```

2. Ejecuta el script de despliegue automatizado:
   ```bash
   npm run deploy
   ```

Este comando ejecuta `deploy.js`, el cual se encarga automáticamente de compilar el proyecto a producción (este proceso utiliza las variables de tu archivo `.env.production`), acceder a la carpeta `dist` y publicar los cambios a la rama `gh-pages`.

import * as fs from 'fs';
import * as path from 'path';

// Cargar el archivo openapi.yaml una sola vez cuando el Lambda se inicie.
const yamlSpec = fs.readFileSync(path.join(__dirname, '../../openapi.yaml'), 'utf8');

/**
 * @description Sirve la interfaz de usuario de Swagger UI.
 * Genera un HTML que carga los assets (CSS, JS) desde una CDN pública.
 */
export const ui = async () => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Swagger UI</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
      <script>
        window.onload = function() {
          // Iniciar Swagger UI
          window.ui = SwaggerUIBundle({
            url: "/openapi.yaml", // URL donde se sirve la especificación
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            plugins: [
              SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
          });
        };
      </script>
    </body>
    </html>
  `;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  };
};

/**
 * @description Sirve el archivo de especificación openapi.yaml directamente.
 * La interfaz de usuario de Swagger hará una petición a esta ruta para obtener la definición de la API.
 */
export const spec = async () => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/yaml',
        },
        body: yamlSpec,
    };
};

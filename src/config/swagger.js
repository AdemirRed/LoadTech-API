import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega o arquivo swagger.yaml
const swaggerDocument = YAML.load(join(__dirname, '../../swagger.yaml'));

/**
 * Configura Swagger UI na aplicação
 * @param {Express} app - Instância do Express
 */
export function setupSwagger(app) {
  // Configurações personalizadas do Swagger UI
  const options = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #007bff; }
      .swagger-ui .info .description { color: #6c757d; }
    `,
    customSiteTitle: "LoadTech Multi-Tenant API - Documentação"
  };

  // Rota para a documentação
  app.use('/docs/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));
  
  // Rota para acessar o JSON da documentação
  app.get('/docs/api.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });

  console.log('📖 Swagger UI disponível em: http://localhost:3001/docs/api');
}

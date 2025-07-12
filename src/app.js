import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './database/index.js';
import { connectRedis } from './config/redis.js';
import { setupSwagger } from './config/swagger.js';
import routes from './routes.js';
import { cryptoMiddleware, decryptMiddleware } from './app/middlewares/cryptoMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class App {
  constructor() {
    this.app = express();
    this.initRedis();
    this.createUploadFolders();
    this.middleware();
    this.setupSwagger();
    this.routes();
  }

  /**
   * Configura Swagger UI
   */
  setupSwagger() {
    setupSwagger(this.app);
  }

  /**
   * Inicializa conexão com Redis
   */
  async initRedis() {
    try {
      await connectRedis();
    } catch (error) {
      console.warn('⚠️  Redis: Não foi possível conectar. Continuando sem cache...', error.message);
    }
  }

  /**
   * Cria automaticamente as pastas de upload se não existirem
   * Útil para deploy no Render e outros ambientes de produção
   */
  createUploadFolders() {
    const uploadBasePath = path.join(__dirname, '../public/uploads');
    const uploadFolders = ['produtos', 'avatars', 'logos', 'banners', 'documentos'];
    
    try {
      // Criar pasta base de uploads se não existir
      if (!fs.existsSync(uploadBasePath)) {
        fs.mkdirSync(uploadBasePath, { recursive: true });
        console.log('✅ Pasta base de uploads criada:', uploadBasePath);
      }
      
      // Criar subpastas específicas
      uploadFolders.forEach(folder => {
        const folderPath = path.join(uploadBasePath, folder);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
          console.log(`✅ Pasta de upload criada: uploads/${folder}`);
          
          // Criar arquivo .gitkeep para manter a pasta no versionamento
          const gitkeepPath = path.join(folderPath, '.gitkeep');
          if (!fs.existsSync(gitkeepPath)) {
            fs.writeFileSync(gitkeepPath, '# Manter esta pasta no Git\n');
          }
        }
      });
      
      console.log('✅ Estrutura de pastas de upload verificada e configurada');
    } catch (error) {
      console.error('❌ Erro ao criar pastas de upload:', error.message);
    }
  }

  middleware() {
    // CORS simples e eficaz
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000'
      ];
      
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Accept-Crypto,X-Session-Id');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Middleware de descriptografia (antes das rotas)
    this.app.use(decryptMiddleware({
      enabled: process.env.CRYPTO_ENABLED === 'true',
      debug: process.env.NODE_ENV === 'development'
    }));

    // Servir arquivos estáticos da pasta public
    this.app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
    
    // Servir arquivos estáticos da raiz (HTML, CSS, JS)
    this.app.use(express.static(path.join(__dirname, '../')));
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Middleware de criptografia (depois do CORS, antes das rotas)
    this.app.use(cryptoMiddleware({
      enabled: process.env.CRYPTO_ENABLED === 'true',
      excludePaths: ['/health', '/uploads'],
      debug: process.env.NODE_ENV === 'development'
    }));
  }

  routes() {
    this.app.use(routes);
  }
}

export default new App().app;

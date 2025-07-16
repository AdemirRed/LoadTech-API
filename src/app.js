import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './database/index.js';
import { connectRedis } from './config/redis.js';
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
   
    this.routes();
  }

  /**
   * Configura  UI
   */
  

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
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:4173',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'https://loadtech.netlify.app'
      ];
      
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Accept-Crypto,x-accept-crypto,X-Crypto-Enabled,X-Session-Id,X-Requested-With,X-API-Key');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });

    // Parsing JSON (ANTES da descriptografia)
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Middleware de descriptografia (DEPOIS do parsing JSON)
    this.app.use(decryptMiddleware({
      enabled: process.env.CRYPTO_ENABLED === 'true',
      debug: process.env.CRYPTO_DEBUG === 'true'
    }));

    // Servir arquivos estáticos da pasta public
    this.app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
    
    // Servir arquivos estáticos da raiz (HTML, CSS, JS)
    this.app.use(express.static(path.join(__dirname, '../')));
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Middleware de criptografia (depois do CORS, antes das rotas)
    this.app.use(cryptoMiddleware({
      enabled: process.env.CRYPTO_ENABLED === 'true',
      excludePaths: ['/api/health', '/uploads', '/docs'],
      debug: process.env.CRYPTO_DEBUG === 'true'
    }));
  }

  routes() {
    // Aplicar prefixo /api para todas as rotas
    this.app.use('/api', routes);
    
    // Manter rotas de documentação sem prefixo
    this.app.get('/', (req, res) => {
      res.redirect('/docs/api');
    });
  }
}

export default new App().app;

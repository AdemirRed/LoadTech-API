import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './database/index.js';
import { connectRedis } from './config/redis.js';
import routes from './routes.js';

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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Servir arquivos estáticos da pasta public
    this.app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

    this.app.use(cors({
      origin: true, // Permite todas as origens em desenvolvimento
      credentials: true, // Permite envio de cookies e headers Authorization
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
  }

  routes() {
    this.app.use(routes);
  }
}

export default new App().app;

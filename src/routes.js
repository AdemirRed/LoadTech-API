import { Router } from 'express';

// Controllers
import UserController from './app/controllers/UserController.js';
import AuthController from './app/controllers/AuthController.js';
import PlanoController from './app/controllers/PlanoController.js';
import AssinaturaController from './app/controllers/AssinaturaController.js';
import LojaController from './app/controllers/LojaController.js';
import PublicShopController from './app/controllers/PublicShopController.js'; // REATIVANDO
import UploadController from './app/controllers/UploadController.js';
import CacheController from './app/controllers/CacheController.js';
import PaymentController from './app/controllers/PaymentController.js';

// Middlewares
import authMiddleware from './app/middlewares/authMiddleware.js';
import isAdminMiddleware from './app/middlewares/isAdminMiddleware.js';
import { cacheMiddleware, rateLimitMiddleware } from './app/middlewares/cacheMiddleware.js';
import { 
  setUploadType, 
  uploadSingle, 
  uploadMultiple, 
  processImages, 
  validateUpload, 
  handleUploadError 
} from './app/middlewares/uploadMiddleware.js';
import { decryptMiddleware, cryptoMiddleware } from './app/middlewares/cryptoMiddleware.js';

const routes = new Router();

// ===== WEBHOOKS (Sem autenticação) =====
routes.post('/webhooks/test', (req, res) => {
  console.log('🧪 Webhook teste recebido:', req.body);
  return res.json({ status: 'ok', received: true, timestamp: new Date().toISOString() });
});

routes.post('/webhooks/asaas', PaymentController.webhook);
routes.post('/webhooks/mercadopago', PaymentController.mercadoPagoWebhook);

// ===== ROTAS PÚBLICAS =====
routes.post('/login', UserController.login);
routes.post('/cadastro', UserController.store);
routes.post('/verificar-email', UserController.verifyEmail);
routes.post('/reenviar-codigo', UserController.resendVerificationCode);
routes.post('/esqueci-senha', AuthController.forgotPassword);
routes.post('/redefinir-senha', AuthController.resetPassword);

// Planos (público com cache)
routes.get('/planos', cacheMiddleware(600), PlanoController.index);
routes.get('/planos/comparar', cacheMiddleware(300), PlanoController.compare);
routes.get('/planos/:id', cacheMiddleware(600), PlanoController.show);

// APIs Públicas de Loja (para frontend)
routes.get('/api/loja/:slug', cacheMiddleware(300), (req, res) => PublicShopController.getLojaData(req, res));
routes.get('/api/loja/:slug/verificar', (req, res) => PublicShopController.verificarLoja(req, res));
routes.get('/api/loja/:slug/contato', cacheMiddleware(300), (req, res) => PublicShopController.getContato(req, res));
routes.get('/api/detectar-loja', (req, res) => PublicShopController.detectarLoja(req, res));

// Redirects para lojas
routes.get('/ir/:slug', (req, res) => PublicShopController.redirectToShop(req, res));

// Loja pública (compatibilidade - retorna JSON)
routes.get('/loja/:slug', cacheMiddleware(300), LojaController.showBySlug);

// Health checks
routes.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    message: 'LoadTech API está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

routes.get('/uploads/health', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const uploadBasePath = path.join(__dirname, '../public/uploads');
    const uploadFolders = ['produtos', 'avatars', 'logos', 'banners', 'documentos'];
    
    const foldersStatus = uploadFolders.map(folder => {
      const folderPath = path.join(uploadBasePath, folder);
      return {
        name: folder,
        exists: fs.existsSync(folderPath),
        path: `/uploads/${folder}`
      };
    });
    
    return res.json({
      status: 'ok',
      message: 'Sistema de upload funcionando',
      timestamp: new Date().toISOString(),
      folders: foldersStatus
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erro no sistema de upload',
      error: error.message
    });
  }
});

// Cache stats (público para desenvolvimento)
routes.get('/cache/stats', CacheController.stats);

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
routes.use(authMiddleware);

// ===== ROTAS PROTEGIDAS =====

// Usuário
routes.get('/usuario', UserController.show);
routes.put('/usuario', UserController.update);

// Assinaturas
routes.get('/assinaturas', AssinaturaController.index);
routes.get('/assinatura/atual', AssinaturaController.current);
routes.post('/assinaturas', AssinaturaController.store);
routes.put('/assinaturas/:id/cancelar', AssinaturaController.cancel);
routes.put('/assinaturas/:id/alterar-plano', AssinaturaController.changePlan);
routes.put('/assinaturas/:id/reativar', AssinaturaController.reactivate);

// Loja
routes.get('/minha-loja', LojaController.show);
routes.post('/loja', LojaController.store);
routes.put('/loja', LojaController.update);
routes.put('/loja/tema', LojaController.updateTheme);
routes.put('/loja/seo', LojaController.updateSEO);
routes.put('/loja/pagamentos', LojaController.updatePaymentSettings);
routes.put('/loja/status', LojaController.toggleStatus);

// ===== PAGAMENTOS =====

// Asaas - Criar cliente
routes.post('/payment/customer', PaymentController.createCustomer);

// Asaas - Assinaturas por forma de pagamento
routes.post('/payment/subscription/credit-card', PaymentController.createCreditCardSubscription);
routes.post('/payment/subscription/boleto', PaymentController.createBoletoSubscription);
routes.post('/payment/subscription/pix', PaymentController.createPixSubscription);
routes.post('/payment/subscription/debit', PaymentController.createDebitSubscription);
routes.post('/payment/subscription/transfer', PaymentController.createTransferSubscription);

// Asaas - Assinatura genérica (mantida para compatibilidade)
routes.post('/payment/subscription', PaymentController.createSubscription);
routes.delete('/payment/subscription/:assinaturaId', PaymentController.cancelSubscription);
routes.get('/payment/subscriptions', PaymentController.listUserSubscriptions);

// Asaas - Cobranças únicas
routes.post('/payment/single', PaymentController.createSinglePayment);

// Asaas - Cartões salvos
routes.get('/payment/credit-cards', PaymentController.listUserCreditCards);
routes.delete('/payment/credit-cards/:tokenId', PaymentController.deleteCreditCard);

// Asaas - PIX
routes.get('/payment/pix/qr-code/:paymentId', PaymentController.generatePixQrCode);

// Asaas - Status e utilitários
routes.get('/payment/status', PaymentController.getPaymentStatus);

// ===== GERENCIAMENTO DE CLIENTES ASAAS =====

// Listar clientes do Asaas
routes.get('/payment/customers', PaymentController.listAsaasCustomers);

// Obter cliente específico do Asaas
routes.get('/payment/customers/:customerId', PaymentController.getAsaasCustomer);

// Atualizar cliente no Asaas
routes.put('/payment/customers/:customerId', PaymentController.updateAsaasCustomer);

// Remover cliente do Asaas
routes.delete('/payment/customers/:customerId', PaymentController.deleteAsaasCustomer);

// Restaurar cliente removido do Asaas
routes.post('/payment/customers/:customerId/restore', PaymentController.restoreAsaasCustomer);

// Mercado Pago (Produtos)
routes.post('/payment/mercadopago/configure', PaymentController.configureMercadoPago);
routes.post('/payment/mercadopago/preference', PaymentController.createProductPayment);
routes.get('/payment/mercadopago/:paymentId', PaymentController.getMercadoPagoPayment);
routes.get('/payment/integrations/status', PaymentController.getIntegrationStatus);

// ===== UPLOADS =====
routes.get('/upload/info', UploadController.info);

// Upload de imagens de produtos
routes.post('/upload/produto/:produtoId', 
  setUploadType('produto'),
  uploadSingle('image'), 
  validateUpload(5, ['jpeg', 'jpg', 'png', 'webp']),
  processImages([
    { name: 'thumb', width: 150, height: 150, quality: 80 },
    { name: 'medium', width: 400, height: 400, quality: 85 },
    { name: 'large', width: 800, height: 800, quality: 90 }
  ]),
  UploadController.uploadProductImage
);

// Upload de logo da loja
routes.post('/upload/loja/logo', 
  setUploadType('logo'),
  uploadSingle('logo'), 
  validateUpload(2, ['jpeg', 'jpg', 'png', 'webp']),
  processImages([
    { name: 'small', width: 100, height: 100, quality: 90 },
    { name: 'medium', width: 200, height: 200, quality: 90 }
  ]),
  UploadController.uploadLojaLogo
);

// Upload de banner da loja
routes.post('/upload/loja/banner', 
  setUploadType('banner'),
  uploadSingle('banner'), 
  validateUpload(5, ['jpeg', 'jpg', 'png', 'webp']),
  processImages([
    { name: 'desktop', width: 1200, height: 400, quality: 85 },
    { name: 'mobile', width: 600, height: 300, quality: 85 }
  ]),
  UploadController.uploadLojaBanner
);

// Upload de avatar do usuário
routes.post('/upload/avatar', 
  setUploadType('avatar'),
  uploadSingle('avatar'), 
  validateUpload(2, ['jpeg', 'jpg', 'png', 'webp']),
  processImages([
    { name: 'small', width: 50, height: 50, quality: 90 },
    { name: 'medium', width: 150, height: 150, quality: 90 }
  ]),
  UploadController.uploadUserAvatar
);

// Upload de múltiplas imagens
routes.post('/upload/multiple', 
  setUploadType('produto'),
  uploadMultiple('images', 10), 
  validateUpload(5, ['jpeg', 'jpg', 'png', 'webp']),
  processImages([
    { name: 'thumb', width: 150, height: 150, quality: 80 },
    { name: 'medium', width: 400, height: 400, quality: 85 }
  ]),
  UploadController.uploadMultipleImages
);

// Upload de documentos
routes.post('/upload/documento', 
  setUploadType('documento'),
  uploadSingle('documento'), 
  validateUpload(10, ['pdf', 'doc', 'docx']),
  UploadController.uploadDocument
);

// Gerenciamento de arquivos
routes.get('/upload/loja/files', UploadController.listLojaFiles);
routes.delete('/upload/delete', UploadController.deleteFile);
routes.get('/upload/stats', UploadController.getUsageStats);

// Middleware de tratamento de erros para upload
routes.use(handleUploadError);

// ===== ADMIN =====
routes.use(isAdminMiddleware);

// Cache management
routes.post('/admin/cache/clear', CacheController.clear);
routes.get('/admin/cache/:key', CacheController.get);
routes.post('/admin/cache/:key', CacheController.set);
routes.delete('/admin/cache/:key', CacheController.delete);

// Gerenciamento de planos
routes.post('/admin/planos', PlanoController.store);
routes.put('/admin/planos/:id', PlanoController.update);
routes.delete('/admin/planos/:id', PlanoController.delete);

// Sincronização com Asaas
routes.post('/admin/sync/asaas-orphans', UserController.syncAsaasOrphans);

// ===== GERENCIAMENTO DE CLIENTES ASAAS =====

// Sincronizar dados do Asaas
routes.get('/payment/customer/sync', PaymentController.syncAsaasCustomers);

// Buscar cliente específico
routes.get('/payment/customer/:customerId', PaymentController.getAsaasCustomer);

// Atualizar cliente (Asaas primeiro, depois banco)
routes.put('/payment/customer', PaymentController.updateAsaasCustomer);

// Remover cliente (Asaas primeiro, depois banco)
routes.delete('/payment/customer', PaymentController.deleteAsaasCustomer);

// Restaurar cliente removido
routes.post('/payment/customer/restore', PaymentController.restoreAsaasCustomer);

// Sincronização com Asaas
routes.post('/admin/sync/asaas-orphans', UserController.syncAsaasOrphans);
routes.post('/admin/sync/asaas-customers', PaymentController.syncCustomersFromAsaas);

export default routes;

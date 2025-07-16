// #region 📦 Imports - Models, Controllers e Middlewares
import { Router } from 'express';

// Models
import User from './app/models/User.js';

// Controllers
import UserController from './app/controllers/UserController.js';
import AuthController from './app/controllers/AuthController.js';
import PlanoController from './app/controllers/PlanoController.js';
import AssinaturaController from './app/controllers/AssinaturaController.js';
import LojaController from './app/controllers/LojaController.js';
import PublicShopController from './app/controllers/PublicShopController.js';
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
import { lojaDbMiddleware } from './app/middlewares/lojaDbMiddleware.js';
// #endregion

const routes = new Router();

// #region 🔗 Webhooks - Endpoints Sem Autenticação
// ===== WEBHOOKS (Sem autenticação) =====
routes.post('/webhooks/test', (req, res) => {
  console.log('🧪 Webhook teste recebido:', req.body);
  return res.json({ status: 'ok', received: true, timestamp: new Date().toISOString() });
});

routes.post('/webhooks/asaas', PaymentController.webhook);
routes.post('/webhooks/mercadopago', PaymentController.mercadoPagoWebhook);
// #endregion

// #region 🌐 Rotas Públicas - Autenticação e Cadastro
// ===== ROTAS PÚBLICAS =====
routes.post('/login', UserController.login);
routes.post('/cadastro', UserController.store);
routes.post('/verificar-email', UserController.verifyEmail);
routes.post('/reenviar-codigo', UserController.resendVerificationCode);
routes.post('/esqueci-senha', AuthController.forgotPassword);
routes.post('/redefinir-senha', AuthController.resetPassword);
// #endregion

// #region 💰 Planos Públicos - Consulta e Comparação
// Planos (público com cache)
routes.get('/planos', cacheMiddleware(600), PlanoController.index);
routes.get('/planos/comparar', cacheMiddleware(300), PlanoController.compare);
routes.get('/planos/:id', cacheMiddleware(600), PlanoController.show);
// #endregion

// #region 🏪 APIs Públicas de Loja - Frontend e Multi-Tenant
// APIs Públicas de Loja (para frontend)
routes.get('/api/loja/:slug', cacheMiddleware(300), PublicShopController.getLojaData);
routes.get('/api/loja/:slug/verificar', PublicShopController.verificarLoja);
routes.get('/api/loja/:slug/contato', cacheMiddleware(300), PublicShopController.getContato);
routes.get('/api/detectar-loja', PublicShopController.detectarLoja);

// Redirects para lojas
routes.get('/ir/:slug', PublicShopController.redirectToShop);

// Loja pública (compatibilidade - retorna JSON)
routes.get('/loja/:slug', cacheMiddleware(300), LojaController.showBySlug);

// Rotas Multi-Tenant (públicas por loja)
routes.post('/loja/:slug/cliente/cadastro', lojaDbMiddleware, PublicShopController.cadastroCliente);
routes.post('/loja/:slug/cliente/login', lojaDbMiddleware, PublicShopController.loginCliente);
// #endregion

// #region 🔄 Sincronização Asaas - Público Pós Email Verificado
// ===== SINCRONIZAÇÃO ASAAS (Após verificação de email) - PÚBLICO =====
routes.post('/sync-asaas', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }

    // Buscar usuário
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Verificar se email foi verificado
    if (!user.email_verificado) {
      return res.status(400).json({ erro: 'Email ainda não foi verificado' });
    }

    // Verificar se já tem Asaas Customer ID
    if (user.asaas_customer_id) {
      return res.status(200).json({ 
        mensagem: 'Cliente já está sincronizado com Asaas',
        usuario: {
          id: user.id,
          email: user.email,
          asaas_customer_id: user.asaas_customer_id
        }
      });
    }

    console.log(`🔄 Sincronizando ${email} com Asaas após verificação...`);

    // Importar função de sincronização
    const { syncUserWithAsaas } = await import('./app/controllers/UserController.js');
    
    // Executar sincronização
    const syncResult = await syncUserWithAsaas(user, {
      phone: user.telefone,
      mobilePhone: user.telefone
    });

    console.log(`📊 Resultado sync para ${email}:`, syncResult);

    // Recarregar usuário para pegar dados atualizados
    await user.reload();

    if (syncResult.success) {
      return res.status(200).json({
        mensagem: 'Cliente sincronizado com Asaas com sucesso!',
        usuario: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          asaas_customer_id: user.asaas_customer_id,
          cpf_cnpj: user.cpf_cnpj
        },
        asaas: {
          customer_id: syncResult.customerId,
          action: syncResult.created ? 'created' : 'linked',
          message: syncResult.created ? 'Novo cliente criado no Asaas' : 'Cliente existente vinculado'
        }
      });
    } else {
      return res.status(500).json({
        erro: 'Falha na sincronização com Asaas',
        detalhes: syncResult.error,
        usuario: {
          id: user.id,
          email: user.email,
          asaas_customer_id: user.asaas_customer_id
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota sync-asaas:', error);
    return res.status(500).json({ 
      erro: 'Erro interno do servidor',
      detalhes: error.message 
    });
  }
});
// #endregion

// #region ⚡ Health Checks e Status da API
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
// #endregion

// #region 🔐 Middleware de Autenticação - Início das Rotas Protegidas
// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
routes.use(authMiddleware);
// #endregion

// #region 👤 Rotas Protegidas - Usuário
// ===== ROTAS PROTEGIDAS =====

// Usuário
routes.get('/usuario', UserController.show);
routes.put('/usuario', UserController.update);
// #endregion

// #region 📄 Assinaturas - Gerenciamento de Planos
// Assinaturas
routes.get('/assinaturas', AssinaturaController.index);
routes.get('/assinatura/atual', AssinaturaController.current);
routes.post('/assinaturas', AssinaturaController.store);
routes.post('/assinaturas/confirmar-asaas', AssinaturaController.confirmarAsaas); // Nova rota
routes.put('/assinaturas/:id/cancelar', AssinaturaController.cancel);
routes.put('/assinaturas/:id/alterar-plano', AssinaturaController.changePlan);
routes.put('/assinaturas/:id/reativar', AssinaturaController.reactivate);
// #endregion

// #region 🏬 Loja - Gerenciamento de Lojas do Usuário
// Loja
routes.get('/minha-loja', LojaController.show); // Minha loja principal
routes.get('/minhas-lojas', LojaController.index); // Listar todas as lojas do usuário
routes.post('/loja', LojaController.store); // Criar nova loja
routes.put('/loja', LojaController.update); // Atualizar loja
routes.put('/loja/tema', LojaController.updateTheme);
routes.put('/loja/seo', LojaController.updateSEO);
routes.put('/loja/pagamentos', LojaController.updatePaymentSettings);
routes.put('/loja/status', LojaController.toggleStatus); 
// #endregion

// #region 🔐 Sync Asaas Autenticado - Via Token JWT
// Rota para sincronizar via token JWT (após login)
routes.post('/sync-asaas-auth', async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    // Verificar se email foi verificado
    if (!user.email_verificado) {
      return res.status(400).json({ erro: 'Email ainda não foi verificado' });
    }

    // Verificar se já tem Asaas Customer ID
    if (user.asaas_customer_id) {
      return res.status(200).json({ 
        mensagem: 'Cliente já está sincronizado com Asaas',
        usuario: {
          id: user.id,
          email: user.email,
          asaas_customer_id: user.asaas_customer_id
        }
      });
    }

    console.log(`🔄 Sincronizando ${user.email} com Asaas (via token)...`);

    // Importar função de sincronização
    const { syncUserWithAsaas } = await import('./app/controllers/UserController.js');
    
    // Executar sincronização
    const syncResult = await syncUserWithAsaas(user, {
      phone: user.telefone,
      mobilePhone: user.telefone
    });

    console.log(`📊 Resultado sync para ${user.email}:`, syncResult);

    // Recarregar usuário
    await user.reload();

    if (syncResult.success) {
      return res.status(200).json({
        mensagem: 'Cliente sincronizado com Asaas com sucesso!',
        usuario: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          asaas_customer_id: user.asaas_customer_id,
          cpf_cnpj: user.cpf_cnpj
        },
        asaas: {
          customer_id: syncResult.customerId,
          action: syncResult.created ? 'created' : 'linked',
          message: syncResult.created ? 'Novo cliente criado no Asaas' : 'Cliente existente vinculado'
        }
      });
    } else {
      return res.status(500).json({
        erro: 'Falha na sincronização com Asaas',
        detalhes: syncResult.error,
        usuario: {
          id: user.id,
          email: user.email,
          asaas_customer_id: user.asaas_customer_id
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro na rota sync-asaas-auth:', error);
    return res.status(500).json({ 
      erro: 'Erro interno do servidor',
      detalhes: error.message 
    });
  }
});
// #endregion

// #region 💳 Pagamentos - Asaas e Mercado Pago
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
// Integração e status dos gateways
routes.get('/payment/integrations/status', PaymentController.getIntegrationStatus);
// #endregion

// #region 📤 Uploads - Gerenciamento de Arquivos
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
// #endregion

// #region 👑 Admin - Rotas Administrativas
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
routes.post('/admin/sync/asaas-customers', PaymentController.syncCustomersFromAsaas);
// #endregion

// #region 🧪 Rotas de Teste - Desenvolvimento e Debug
// ===== ROTAS DE TESTE =====
routes.get('/teste', (req, res) => {
  return res.json({
    status: 'ok',
    mensagem: 'LoadTech Multi-Tenant API funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

routes.get('/loja/:slug/teste', lojaDbMiddleware, async (req, res) => {
  const client = req.lojaDbClient;
  try {
    // Testa uma query simples no banco da loja
    await client.query('SELECT 1');
    return res.json({
      status: 'ok',
      loja: req.params.slug,
      banco: `loja_${req.params.slug.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}`,
      mensagem: 'Banco da loja conectado com sucesso'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      mensagem: 'Erro ao conectar com banco da loja'
    });
  } finally {
    await client.end();
  }
});

// Rota de teste para debug (temporária)
routes.post('/test-loja', (req, res) => {
  console.log('Teste de criação de loja - Body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', req.headers);
  return res.json({ 
    success: true, 
    body: req.body,
    message: 'Dados recebidos com sucesso' 
  });
});

routes.get('/test-sync-asaas/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { syncUserWithAsaas } = await import('./app/controllers/UserController.js');
    const User = await import('./app/models/User.js');
    
    const user = await User.default.findByPk(userId);
    if (!user) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    console.log(`🧪 Teste manual de sincronização para: ${user.email}`);
    
    const result = await syncUserWithAsaas(user, {
      phone: user.telefone,
      mobilePhone: user.telefone
    });

    await user.reload();

    return res.json({
      mensagem: 'Teste de sincronização executado',
      user: {
        id: user.id,
        email: user.email,
        asaas_customer_id: user.asaas_customer_id
      },
      sync_result: result
    });
  } catch (error) {
    console.error('Erro no teste sync:', error);
    return res.status(500).json({ erro: error.message });
  }
});
// #endregion

export default routes;

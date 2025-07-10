import { Router } from 'express';

// Controllers
import UserController from './app/controllers/UserController';
import AuthController from './app/controllers/AuthController';
import PlanoController from './app/controllers/PlanoController';
import AssinaturaController from './app/controllers/AssinaturaController';
import LojaController from './app/controllers/LojaController';

// Middlewares
import authMiddleware from './app/middlewares/authMiddleware';
import isAdminMiddleware from './app/middlewares/isAdminMiddleware';

const routes = new Router();

// ===== ROTAS PÚBLICAS =====

// Autenticação
routes.post('/login', UserController.login);
routes.post('/cadastro', UserController.store);
routes.post('/verificar-email', UserController.verifyEmail);
routes.post('/reenviar-codigo', UserController.resendVerificationCode);
routes.post('/esqueci-senha', AuthController.forgotPassword);
routes.post('/redefinir-senha', AuthController.resetPassword);

// Planos (público)
routes.get('/planos', PlanoController.index);
routes.get('/planos/:id', PlanoController.show);
routes.get('/planos/comparar', PlanoController.compare);

// Loja pública
routes.get('/loja/:slug', LojaController.showBySlug);

// ===== ROTAS PROTEGIDAS (Requer autenticação) =====
routes.use(authMiddleware);

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

// ===== ROTAS ADMINISTRATIVAS =====
routes.use(isAdminMiddleware);

// Planos (Admin)
routes.post('/admin/planos', PlanoController.store);
routes.put('/admin/planos/:id', PlanoController.update);
routes.delete('/admin/planos/:id', PlanoController.delete);
routes.get('/admin/planos/stats', PlanoController.stats);

// Assinaturas (Admin)
routes.get('/admin/assinaturas', AssinaturaController.listAll);

// Lojas (Admin)
routes.get('/admin/lojas', LojaController.listAll);

export default routes;

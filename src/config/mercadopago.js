/**
 * Configuração do Mercado Pago para vendas de produtos
 */

const MERCADOPAGO_CONFIG = {
  // URLs da API
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.mercadopago.com' 
    : 'https://api.mercadopago.com', // Mesma URL para prod/test
  
  // Configurações padrão
  timeout: 30000,
  
  // Webhooks URLs (definir após deploy)
  webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || 'https://sua-api.com/webhooks/mercadopago',
  
  // Configurações de cobrança
  defaultExpirationDays: 7, // Vencimento padrão em dias
  
  // Taxa LoadTech (porcentagem sobre vendas)
  loadtechFeePercentage: 5.0, // 5% de taxa
  
  // Configurações de notificação
  emailNotification: true,
  
  // URLs de redirecionamento padrão
  defaultUrls: {
    success: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/success` : 'https://sua-loja.com/success',
    failure: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/failure` : 'https://sua-loja.com/failure',
    pending: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/payment/pending` : 'https://sua-loja.com/pending'
  }
};

export default MERCADOPAGO_CONFIG;

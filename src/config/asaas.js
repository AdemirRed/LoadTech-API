/**
 * Configuração do Asaas para pagamentos de assinaturas
 */

const ASAAS_CONFIG = {
  // API Key de homologação fornecida
  apiKey: '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmJhZGNhOGZmLTlkYzgtNDI2ZC1hZjczLTIyMjI3ZWI3YmNkMTo6JGFhY2hfMmRiMTg4NzEtNTBhOC00M2I5LThhNjctNmY3NjJiZDI3M2Uw',
  
  // URLs da API
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://www.asaas.com/api/v3' 
    : 'https://sandbox.asaas.com/api/v3',
  
  // Configurações padrão
  timeout: 30000,
  
  // Webhooks URLs (definir após deploy)
  webhookUrl: process.env.ASAAS_WEBHOOK_URL || 'https://sua-api.com/webhooks/asaas',
  
  // Configurações de cobrança
  defaultDueDays: 7, // Vencimento padrão em dias
  defaultInterest: 1.0, // Juros por mês de atraso (%)
  defaultFine: 2.0, // Multa por atraso (%)
  
  // Configurações de notificação
  emailNotification: true,
  smsNotification: false,
  whatsappNotification: false
};

export default ASAAS_CONFIG;

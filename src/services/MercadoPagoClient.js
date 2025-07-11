/**
 * Cliente HTTP para integração com Mercado Pago
 * Gerencia pagamentos de produtos das lojas
 */

import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import MERCADOPAGO_CONFIG from '../config/mercadopago.js';

class MercadoPagoClient {
  /**
   * Inicializa cliente do Mercado Pago com credenciais da loja
   */
  initializeClient(accessToken) {
    return new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: MERCADOPAGO_CONFIG.timeout,
        idempotencyKey: this.generateIdempotencyKey()
      }
    });
  }

  /**
   * Gera chave de idempotência única
   */
  generateIdempotencyKey() {
    return `loadtech_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Cria preferência de pagamento
   */
  async createPreference(lojaCredentials, preferenceData) {
    try {
      const client = this.initializeClient(lojaCredentials.access_token);
      const preference = new Preference(client);

      console.log(`🔗 MercadoPago: Criando preferência para loja ${preferenceData.external_reference}`);

      const preferenceBody = {
        items: preferenceData.items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category_id: item.category || 'others',
          quantity: item.quantity,
          currency_id: 'BRL',
          unit_price: item.unit_price
        })),
        
        payer: {
          name: preferenceData.payer?.name,
          surname: preferenceData.payer?.surname,
          email: preferenceData.payer?.email,
          phone: preferenceData.payer?.phone ? {
            area_code: preferenceData.payer.phone.area_code,
            number: preferenceData.payer.phone.number
          } : undefined,
          identification: preferenceData.payer?.identification ? {
            type: preferenceData.payer.identification.type,
            number: preferenceData.payer.identification.number
          } : undefined
        },

        back_urls: {
          success: preferenceData.back_urls?.success || MERCADOPAGO_CONFIG.defaultUrls.success,
          failure: preferenceData.back_urls?.failure || MERCADOPAGO_CONFIG.defaultUrls.failure,
          pending: preferenceData.back_urls?.pending || MERCADOPAGO_CONFIG.defaultUrls.pending
        },

        auto_return: preferenceData.auto_return || 'approved',
        
        external_reference: preferenceData.external_reference,
        
        notification_url: preferenceData.notification_url || MERCADOPAGO_CONFIG.webhookUrl,
        
        payment_methods: {
          excluded_payment_methods: preferenceData.excluded_payment_methods || [],
          excluded_payment_types: preferenceData.excluded_payment_types || [],
          installments: preferenceData.installments || 12
        },

        shipments: preferenceData.shipments ? {
          mode: preferenceData.shipments.mode || 'not_specified',
          cost: preferenceData.shipments.cost || 0,
          free_shipping: preferenceData.shipments.free_shipping || false
        } : undefined,

        marketplace_fee: this.calculateLoadTechFee(preferenceData.items),

        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + (MERCADOPAGO_CONFIG.defaultExpirationDays * 24 * 60 * 60 * 1000)).toISOString(),

        metadata: {
          loja_id: preferenceData.loja_id,
          order_id: preferenceData.order_id,
          created_by: 'LoadTech-API'
        }
      };

      const result = await preference.create({ body: preferenceBody });
      
      console.log('✅ MercadoPago: Preferência criada com sucesso');
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar preferência MercadoPago:', error);
      throw new Error(`MercadoPago Error: ${error.message}`);
    }
  }

  /**
   * Calcula taxa LoadTech sobre o valor total
   */
  calculateLoadTechFee(items) {
    const totalValue = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const feeAmount = totalValue * (MERCADOPAGO_CONFIG.loadtechFeePercentage / 100);
    
    return Math.round(feeAmount * 100) / 100; // Arredonda para 2 casas decimais
  }

  /**
   * Busca informações de um pagamento
   */
  async getPayment(lojaCredentials, paymentId) {
    try {
      const client = this.initializeClient(lojaCredentials.access_token);
      const payment = new Payment(client);

      console.log(`🔗 MercadoPago: Buscando pagamento ${paymentId}`);
      
      const result = await payment.get({ id: paymentId });
      
      console.log('✅ MercadoPago: Pagamento encontrado');
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar pagamento MercadoPago:', error);
      throw new Error(`MercadoPago Error: ${error.message}`);
    }
  }

  /**
   * Processa refund de um pagamento
   */
  async refundPayment(lojaCredentials, paymentId, amount = null) {
    try {
      const client = this.initializeClient(lojaCredentials.access_token);
      const payment = new Payment(client);

      console.log(`🔗 MercadoPago: Processando refund para pagamento ${paymentId}`);
      
      const refundData = amount ? { amount: amount } : {};
      const result = await payment.refund({ id: paymentId, body: refundData });
      
      console.log('✅ MercadoPago: Refund processado com sucesso');
      return result;
    } catch (error) {
      console.error('❌ Erro ao processar refund MercadoPago:', error);
      throw new Error(`MercadoPago Error: ${error.message}`);
    }
  }

  /**
   * Valida credenciais do Mercado Pago
   */
  async validateCredentials(credentials) {
    try {
      const client = this.initializeClient(credentials.access_token);
      
      // Tenta fazer uma chamada simples para validar as credenciais
      const testPreference = new Preference(client);
      
      // Cria preferência de teste mínima
      await testPreference.create({
        body: {
          items: [{
            id: 'test',
            title: 'Test',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 0.01
          }],
          external_reference: 'test_credentials'
        }
      });
      
      return { valid: true, message: 'Credenciais válidas' };
    } catch (error) {
      return { 
        valid: false, 
        message: `Credenciais inválidas: ${error.message}` 
      };
    }
  }

  /**
   * Formata dados do webhook do Mercado Pago
   */
  formatWebhookData(webhookData) {
    return {
      id: webhookData.id,
      topic: webhookData.topic,
      type: webhookData.type,
      data_id: webhookData.data?.id,
      date_created: webhookData.date_created,
      application_id: webhookData.application_id,
      user_id: webhookData.user_id,
      version: webhookData.version,
      api_version: webhookData.api_version,
      action: webhookData.action,
      live_mode: webhookData.live_mode
    };
  }

  /**
   * Mapeia status do MercadoPago para status interno
   */
  mapPaymentStatus(mpStatus) {
    const statusMap = {
      'pending': 'pendente',
      'approved': 'aprovado',
      'authorized': 'autorizado',
      'in_process': 'processando',
      'in_mediation': 'mediacao',
      'rejected': 'rejeitado',
      'cancelled': 'cancelado',
      'refunded': 'estornado',
      'charged_back': 'chargeback'
    };

    return statusMap[mpStatus] || 'desconhecido';
  }

  /**
   * Verifica se um pagamento foi aprovado
   */
  isPaymentApproved(paymentData) {
    return paymentData.status === 'approved' && paymentData.status_detail === 'accredited';
  }

  /**
   * Extrai informações essenciais do pagamento
   */
  extractPaymentInfo(paymentData) {
    return {
      id: paymentData.id,
      status: this.mapPaymentStatus(paymentData.status),
      status_detail: paymentData.status_detail,
      payment_method_id: paymentData.payment_method_id,
      payment_type_id: paymentData.payment_type_id,
      transaction_amount: paymentData.transaction_amount,
      net_received_amount: paymentData.net_received_amount,
      total_paid_amount: paymentData.total_paid_amount,
      fee_details: paymentData.fee_details,
      date_created: paymentData.date_created,
      date_approved: paymentData.date_approved,
      external_reference: paymentData.external_reference,
      description: paymentData.description,
      payer: {
        id: paymentData.payer?.id,
        email: paymentData.payer?.email,
        identification: paymentData.payer?.identification
      },
      metadata: paymentData.metadata
    };
  }
}

export default new MercadoPagoClient();

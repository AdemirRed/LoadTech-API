/**
 * Cliente HTTP para integração com Asaas
 * Gerencia todas as requisições para a API do Asaas
 */

import fetch from 'node-fetch';
import ASAAS_CONFIG from '../config/asaas.js';

class AsaasClient {
  constructor() {
    this.baseUrl = ASAAS_CONFIG.baseUrl;
    this.apiKey = ASAAS_CONFIG.apiKey;
    this.timeout = ASAAS_CONFIG.timeout;
  }

  /**
   * Faz uma requisição para a API do Asaas
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.apiKey,
        'User-Agent': 'LoadTech-API/1.0.0',
        ...options.headers
      },
      ...options
    };

    try {
      console.log(`🔗 Asaas API: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Erro Asaas:', data);
        throw new Error(`Asaas API Error: ${response.status} - ${data.message || JSON.stringify(data)}`);
      }

      console.log('✅ Asaas Response:', response.status);
      return data;
    } catch (error) {
      console.error('❌ Erro na requisição Asaas:', error.message);
      throw error;
    }
  }

  // ===== CLIENTES =====

  /**
   * Cria um cliente no Asaas
   */
  async createCustomer(customerData) {
    return this.makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        mobilePhone: customerData.mobilePhone,
        cpfCnpj: customerData.cpfCnpj,
        postalCode: customerData.postalCode,
        address: customerData.address,
        addressNumber: customerData.addressNumber,
        complement: customerData.complement,
        province: customerData.province,
        city: customerData.city,
        state: customerData.state,
        externalReference: customerData.externalReference, // ID do usuário no nosso sistema
        notificationDisabled: !ASAAS_CONFIG.emailNotification,
        additionalEmails: customerData.additionalEmails
      })
    });
  }

  /**
   * Atualiza um cliente no Asaas
   */
  async updateCustomer(customerId, customerData) {
    return this.makeRequest(`/customers/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  /**
   * Busca cliente por ID
   */
  async getCustomer(customerId) {
    return this.makeRequest(`/customers/${customerId}`);
  }

  /**
   * Lista clientes
   */
  async listCustomers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/customers?${queryParams}`);
  }

  /**
   * Alias para listCustomers (compatibilidade)
   */
  async getCustomers(filters = {}) {
    return this.listCustomers(filters);
  }

  // ===== ASSINATURAS =====

  /**
   * Cria uma assinatura no Asaas com todas as opções de pagamento
   */
  async createSubscription(subscriptionData) {
    const payload = {
      customer: subscriptionData.customerId,
      billingType: subscriptionData.billingType || 'CREDIT_CARD',
      value: subscriptionData.value,
      nextDueDate: subscriptionData.nextDueDate,
      cycle: subscriptionData.cycle || 'MONTHLY',
      description: subscriptionData.description,
      externalReference: subscriptionData.externalReference
    };

    // Adiciona campos opcionais apenas se fornecidos
    if (subscriptionData.endDate) payload.endDate = subscriptionData.endDate;
    if (subscriptionData.maxPayments) payload.maxPayments = subscriptionData.maxPayments;
    if (subscriptionData.split) payload.split = subscriptionData.split;
    if (subscriptionData.discount) payload.discount = subscriptionData.discount;
    if (subscriptionData.interest) payload.interest = subscriptionData.interest;
    if (subscriptionData.fine) payload.fine = subscriptionData.fine;
    
    // Configurações específicas por tipo de pagamento
    if (subscriptionData.billingType === 'CREDIT_CARD') {
      if (subscriptionData.creditCard) payload.creditCard = subscriptionData.creditCard;
      if (subscriptionData.creditCardHolderInfo) payload.creditCardHolderInfo = subscriptionData.creditCardHolderInfo;
      if (subscriptionData.creditCardToken) payload.creditCardToken = subscriptionData.creditCardToken;
      if (subscriptionData.remoteIp) payload.remoteIp = subscriptionData.remoteIp;
    }

    // PIX - configurações específicas
    if (subscriptionData.billingType === 'PIX') {
      payload.pixAddressKey = subscriptionData.pixAddressKey || 'generated';
      if (subscriptionData.pixQrCodeId) payload.pixQrCodeId = subscriptionData.pixQrCodeId;
    }

    // Boleto - configurações específicas
    if (subscriptionData.billingType === 'BOLETO') {
      if (subscriptionData.postalService !== undefined) payload.postalService = subscriptionData.postalService;
    }

    // Débito em conta - configurações específicas
    if (subscriptionData.billingType === 'DEBIT') {
      if (subscriptionData.bankInfo) payload.bankInfo = subscriptionData.bankInfo;
    }

    return this.makeRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Atualiza uma assinatura
   */
  async updateSubscription(subscriptionId, subscriptionData) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Busca assinatura por ID
   */
  async getSubscription(subscriptionId) {
    return this.makeRequest(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Lista assinaturas
   */
  async listSubscriptions(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/subscriptions?${queryParams}`);
  }

  // ===== COBRANÇAS =====

  /**
   * Cria uma cobrança avulsa
   */
  async createPayment(paymentData) {
    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: paymentData.customerId,
        billingType: paymentData.billingType || 'CREDIT_CARD',
        value: paymentData.value,
        dueDate: paymentData.dueDate,
        description: paymentData.description,
        externalReference: paymentData.externalReference,
        installmentCount: paymentData.installmentCount,
        installmentValue: paymentData.installmentValue,
        discount: paymentData.discount,
        interest: paymentData.interest || ASAAS_CONFIG.defaultInterest,
        fine: paymentData.fine || ASAAS_CONFIG.defaultFine,
        postalService: paymentData.postalService,
        split: paymentData.split,
        callback: paymentData.callback,
        creditCard: paymentData.creditCard,
        creditCardHolderInfo: paymentData.creditCardHolderInfo
      })
    });
  }

  /**
   * Busca cobrança por ID
   */
  async getPayment(paymentId) {
    return this.makeRequest(`/payments/${paymentId}`);
  }

  /**
   * Lista cobranças
   */
  async listPayments(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.makeRequest(`/payments?${queryParams}`);
  }

  /**
   * Estorna uma cobrança
   */
  async refundPayment(paymentId, refundData = {}) {
    return this.makeRequest(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData)
    });
  }

  // ===== WEBHOOKS =====

  /**
   * Configura webhooks
   */
  async configureWebhook(webhookData) {
    return this.makeRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url: webhookData.url || ASAAS_CONFIG.webhookUrl,
        email: webhookData.email,
        sendType: webhookData.sendType || 'SEQUENTIALLY',
        enabled: webhookData.enabled !== false,
        interrupted: false,
        authToken: webhookData.authToken,
        events: webhookData.events || [
          'PAYMENT_CREATED',
          'PAYMENT_UPDATED',
          'PAYMENT_CONFIRMED',
          'PAYMENT_RECEIVED',
          'PAYMENT_OVERDUE',
          'PAYMENT_DELETED',
          'PAYMENT_RESTORED',
          'PAYMENT_REFUNDED',
          'PAYMENT_RECEIVED_IN_CASH_UNDONE',
          'PAYMENT_CHARGEBACK_REQUESTED',
          'PAYMENT_CHARGEBACK_DISPUTE',
          'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
          'PAYMENT_DUNNING_RECEIVED',
          'PAYMENT_DUNNING_REQUESTED',
          'PAYMENT_BANK_SLIP_VIEWED',
          'PAYMENT_CHECKOUT_VIEWED'
        ]
      })
    });
  }

  /**
   * Lista webhooks configurados
   */
  async listWebhooks() {
    return this.makeRequest('/webhooks');
  }

  // ===== UTILITÁRIOS =====

  /**
   * Verifica status da API
   */
  async getApiStatus() {
    try {
      await this.makeRequest('/finance/balance');
      return { status: 'ok', message: 'API Asaas operacional' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Busca saldo da conta
   */
  async getBalance() {
    return this.makeRequest('/finance/balance');
  }

  /**
   * Valida se os dados do cartão são válidos
   */
  validateCreditCard(creditCardData) {
    const required = ['holderName', 'number', 'expiryMonth', 'expiryYear', 'ccv'];
    const missing = required.filter(field => !creditCardData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Dados do cartão incompletos: ${missing.join(', ')}`);
    }

    // Validação básica do cartão
    const cardNumber = creditCardData.number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNumber)) {
      throw new Error('Número do cartão inválido');
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    if (creditCardData.expiryYear < currentYear || 
        (creditCardData.expiryYear === currentYear && creditCardData.expiryMonth < currentMonth)) {
      throw new Error('Cartão expirado');
    }

    return true;
  }

  // ===== MÉTODOS ESPECÍFICOS POR TIPO DE PAGAMENTO =====

  /**
   * Cria assinatura com cartão de crédito
   */
  async createCreditCardSubscription(subscriptionData, creditCardData, holderInfo) {
    return this.createSubscription({
      ...subscriptionData,
      billingType: 'CREDIT_CARD',
      creditCard: creditCardData,
      creditCardHolderInfo: holderInfo
    });
  }

  /**
   * Cria assinatura com boleto bancário
   */
  async createBoletoSubscription(subscriptionData, boletoOptions = {}) {
    return this.createSubscription({
      ...subscriptionData,
      billingType: 'BOLETO',
      postalService: boletoOptions.postalService || false, // Envio pelos Correios
      interest: boletoOptions.interest || ASAAS_CONFIG.defaultInterest,
      fine: boletoOptions.fine || ASAAS_CONFIG.defaultFine
    });
  }

  /**
   * Cria assinatura com PIX
   */
  async createPixSubscription(subscriptionData, pixOptions = {}) {
    return this.createSubscription({
      ...subscriptionData,
      billingType: 'PIX',
      pixAddressKey: pixOptions.pixAddressKey || 'generated',
      pixQrCodeId: pixOptions.pixQrCodeId
    });
  }

  /**
   * Cria assinatura com débito em conta
   */
  async createDebitSubscription(subscriptionData, bankInfo) {
    return this.createSubscription({
      ...subscriptionData,
      billingType: 'DEBIT',
      bankInfo: bankInfo
    });
  }

  /**
   * Cria assinatura com transferência/depósito bancário
   */
  async createTransferSubscription(subscriptionData) {
    return this.createSubscription({
      ...subscriptionData,
      billingType: 'TRANSFER'
    });
  }

  /**
   * Cria cobrança única (não recorrente) com todas as opções
   */
  async createPaymentWithAllOptions(paymentData) {
    const payload = {
      customer: paymentData.customerId,
      billingType: paymentData.billingType || 'CREDIT_CARD',
      value: paymentData.value,
      dueDate: paymentData.dueDate,
      description: paymentData.description,
      externalReference: paymentData.externalReference
    };

    // Campos opcionais gerais
    if (paymentData.installmentCount) payload.installmentCount = paymentData.installmentCount;
    if (paymentData.installmentValue) payload.installmentValue = paymentData.installmentValue;
    if (paymentData.discount) payload.discount = paymentData.discount;
    if (paymentData.interest) payload.interest = paymentData.interest;
    if (paymentData.fine) payload.fine = paymentData.fine;
    if (paymentData.split) payload.split = paymentData.split;
    if (paymentData.callback) payload.callback = paymentData.callback;

    // Cartão de crédito
    if (paymentData.billingType === 'CREDIT_CARD') {
      if (paymentData.creditCard) payload.creditCard = paymentData.creditCard;
      if (paymentData.creditCardHolderInfo) payload.creditCardHolderInfo = paymentData.creditCardHolderInfo;
      if (paymentData.creditCardToken) payload.creditCardToken = paymentData.creditCardToken;
      if (paymentData.remoteIp) payload.remoteIp = paymentData.remoteIp;
    }

    // PIX
    if (paymentData.billingType === 'PIX') {
      payload.pixAddressKey = paymentData.pixAddressKey || 'generated';
      if (paymentData.pixQrCodeId) payload.pixQrCodeId = paymentData.pixQrCodeId;
    }

    // Boleto
    if (paymentData.billingType === 'BOLETO') {
      if (paymentData.postalService !== undefined) payload.postalService = paymentData.postalService;
    }

    // Débito em conta
    if (paymentData.billingType === 'DEBIT') {
      if (paymentData.bankInfo) payload.bankInfo = paymentData.bankInfo;
    }

    return this.makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Tokeniza cartão de crédito para uso futuro
   */
  async tokenizeCreditCard(customerId, creditCardData) {
    return this.makeRequest('/creditCard/tokenize', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        creditCard: creditCardData
      })
    });
  }

  /**
   * Lista cartões tokenizados do cliente
   */
  async listCustomerCreditCards(customerId) {
    return this.makeRequest(`/customers/${customerId}/creditCards`);
  }

  /**
   * Remove cartão tokenizado
   */
  async deleteCreditCardToken(tokenId) {
    return this.makeRequest(`/creditCard/${tokenId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Gera QR Code PIX para cobrança
   */
  async generatePixQrCode(paymentId) {
    return this.makeRequest(`/payments/${paymentId}/pixQrCode`);
  }

  /**
   * Busca dados bancários para transferência
   */
  async getBankTransferInfo() {
    return this.makeRequest('/myAccount/commercialInfo');
  }
}

export default new AsaasClient();

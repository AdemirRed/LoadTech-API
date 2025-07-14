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
    if (!customerId) {
      throw new Error('ID do cliente é obrigatório para atualização');
    }

    console.log(`🔄 Atualizando cliente Asaas: ${customerId}`);
    console.log('📝 Dados para atualização:', customerData);

    // Preparar dados conforme API do Asaas
    const asaasData = {};

    // Mapear campos obrigatórios e opcionais
    if (customerData.name !== undefined) asaasData.name = customerData.name;
    if (customerData.email !== undefined) asaasData.email = customerData.email;
    if (customerData.cpfCnpj !== undefined) asaasData.cpfCnpj = customerData.cpfCnpj;
    if (customerData.phone !== undefined) asaasData.phone = customerData.phone;
    if (customerData.mobilePhone !== undefined) asaasData.mobilePhone = customerData.mobilePhone;
    if (customerData.address !== undefined) asaasData.address = customerData.address;
    if (customerData.addressNumber !== undefined) asaasData.addressNumber = customerData.addressNumber;
    if (customerData.complement !== undefined) asaasData.complement = customerData.complement;
    if (customerData.province !== undefined) asaasData.province = customerData.province;
    if (customerData.postalCode !== undefined) asaasData.postalCode = customerData.postalCode;
    if (customerData.externalReference !== undefined) asaasData.externalReference = customerData.externalReference;
    if (customerData.notificationDisabled !== undefined) asaasData.notificationDisabled = customerData.notificationDisabled;
    if (customerData.additionalEmails !== undefined) asaasData.additionalEmails = customerData.additionalEmails;
    if (customerData.municipalInscription !== undefined) asaasData.municipalInscription = customerData.municipalInscription;
    if (customerData.stateInscription !== undefined) asaasData.stateInscription = customerData.stateInscription;
    if (customerData.observations !== undefined) asaasData.observations = customerData.observations;
    if (customerData.groupName !== undefined) asaasData.groupName = customerData.groupName;
    if (customerData.company !== undefined) asaasData.company = customerData.company;
    if (customerData.foreignCustomer !== undefined) asaasData.foreignCustomer = customerData.foreignCustomer;

    // Remover campos null ou undefined para não sobrescrever com valores vazios
    Object.keys(asaasData).forEach(key => {
      if (asaasData[key] === null || asaasData[key] === undefined || asaasData[key] === '') {
        delete asaasData[key];
      }
    });

    console.log('📤 Dados finais para Asaas:', asaasData);

    try {
      const result = await this.makeRequest(`/customers/${customerId}`, {
        method: 'PUT', // Usar PUT conforme documentação Asaas
        body: JSON.stringify(asaasData)
      });

      console.log('✅ Cliente Asaas atualizado com sucesso:', result.id);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao atualizar cliente ${customerId}:`, error.message);
      throw error;
    }
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

  // ===== GERENCIAMENTO DE CLIENTES =====

  /**
   * Listar todos os clientes do Asaas
   */
  async listCustomers(filters = {}) {
    const queryParams = new URLSearchParams();
    
    // Adiciona filtros se fornecidos
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.email) queryParams.append('email', filters.email);
    if (filters.cpfCnpj) queryParams.append('cpfCnpj', filters.cpfCnpj);
    if (filters.groupName) queryParams.append('groupName', filters.groupName);
    if (filters.externalReference) queryParams.append('externalReference', filters.externalReference);
    if (filters.offset) queryParams.append('offset', filters.offset);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return await this.makeRequest(endpoint, {
      method: 'GET'
    });
  }

  /**
   * Buscar cliente específico por ID
   */
  async getCustomerById(customerId) {
    if (!customerId) {
      throw new Error('ID do cliente é obrigatório');
    }

    return await this.makeRequest(`/customers/${customerId}`, {
      method: 'GET'
    });
  }

  /**
   * Buscar clientes por email, CPF ou nome (para sincronização)
   */
  async findCustomerByIdentifier(identifier) {
    // Tenta buscar por email primeiro
    let customers = await this.listCustomers({ email: identifier });
    if (customers.data && customers.data.length > 0) {
      return customers.data[0];
    }

    // Se não encontrou por email, tenta por CPF
    customers = await this.listCustomers({ cpfCnpj: identifier });
    if (customers.data && customers.data.length > 0) {
      return customers.data[0];
    }

    // Se não encontrou por CPF, tenta por nome
    customers = await this.listCustomers({ name: identifier });
    if (customers.data && customers.data.length > 0) {
      return customers.data[0];
    }

    return null;
  }

  /**
   * Atualizar cliente existente
   */
  async updateCustomer(customerId, customerData) {
    if (!customerId) {
      throw new Error('ID do cliente é obrigatório');
    }

    return await this.makeRequest(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  }

  /**
   * Remover cliente
   */
  async deleteCustomer(customerId) {
    if (!customerId) {
      throw new Error('ID do cliente é obrigatório');
    }

    return await this.makeRequest(`/customers/${customerId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Restaurar cliente removido
   */
  async restoreCustomer(customerId) {
    if (!customerId) {
      throw new Error('ID do cliente é obrigatório');
    }

    return await this.makeRequest(`/customers/${customerId}/restore`, {
      method: 'POST'
    });
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

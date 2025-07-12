/**
 * Controller para gerenciar pagamentos e assinaturas via Asaas
 */

import AsaasClient from '../../services/AsaasClient.js';
import MercadoPagoClient from '../../services/MercadoPagoClient.js';
import User from '../models/User.js';
import Plano from '../models/Plano.js';
import Assinatura from '../models/Assinatura.js';

class PaymentController {
  /**
   * Criar cliente no Asaas com dados completos (NOVA ABORDAGEM)
   * Só salva dados essenciais no nosso banco (email, cpf, nome, senha)
   * Requer verificação de email primeiro
   */
  async createCustomer(req, res) {
    try {
      const userId = req.user.id;
      const {
        // Campos obrigatórios do Asaas
        cpfCnpj, // required
        
        // Campos opcionais de contato
        phone,
        mobilePhone,
        
        // Campos de endereço
        address,
        addressNumber,
        complement,
        province,
        postalCode,
        
        // Campos adicionais do Asaas
        externalReference,
        notificationDisabled,
        additionalEmails,
        municipalInscription,
        stateInscription,
        observations,
        groupName,
        company,
        foreignCustomer
      } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      // ⚠️ VERIFICAR SE EMAIL FOI VERIFICADO ANTES DE CRIAR CONTA NO ASAAS
      if (user.status !== 'ativo') {
        return res.status(400).json({ 
          erro: 'Email deve ser verificado antes de criar dados de pagamento',
          status: user.status,
          action: 'verify_email_first'
        });
      }

      // Verifica se já existe cliente Asaas para este usuário
      if (user.asaas_customer_id) {
        return res.status(400).json({ 
          erro: 'Cliente já possui conta de pagamento associada',
          customerId: user.asaas_customer_id
        });
      }

      // Validar CPF/CNPJ obrigatório
      if (!cpfCnpj) {
        return res.status(400).json({ erro: 'CPF ou CNPJ é obrigatório' });
      }

      // 🚀 PRIMEIRO: CRIAR CLIENTE NO ASAAS COM TODOS OS DADOS
      const customerData = {
        name: user.nome, // required
        cpfCnpj: cpfCnpj, // required
        email: user.email,
        phone: phone,
        mobilePhone: mobilePhone,
        address: address,
        addressNumber: addressNumber,
        complement: complement,
        province: province,
        postalCode: postalCode,
        externalReference: externalReference || user.id.toString(),
        notificationDisabled: notificationDisabled || false,
        additionalEmails: additionalEmails,
        municipalInscription: municipalInscription,
        stateInscription: stateInscription,
        observations: observations,
        groupName: groupName,
        company: company,
        foreignCustomer: foreignCustomer || false
      };

      // Remover campos undefined para não enviar ao Asaas
      Object.keys(customerData).forEach(key => {
        if (customerData[key] === undefined) {
          delete customerData[key];
        }
      });

      console.log('📤 Criando cliente no Asaas:', customerData);

      const asaasCustomer = await AsaasClient.createCustomer(customerData);

      // 🎯 SEGUNDO: SALVAR APENAS DADOS ESSENCIAIS NO NOSSO BANCO
      await user.update({
        asaas_customer_id: asaasCustomer.id,
        cpf_cnpj: cpfCnpj // Salvar CPF para referência e validações futuras
      });

      console.log('✅ Cliente criado no Asaas e ID salvo no banco:', asaasCustomer.id);

      return res.status(201).json({
        mensagem: 'Cliente criado com sucesso no sistema de pagamento',
        customer: {
          id: asaasCustomer.id,
          name: asaasCustomer.name,
          email: asaasCustomer.email,
          cpfCnpj: asaasCustomer.cpfCnpj
        }
      });
    } catch (error) {
      console.error('Erro ao criar cliente Asaas:', error);
      return res.status(500).json({
        erro: 'Erro ao criar cliente no sistema de pagamento',
        detalhes: error.message
      });
    }
  }

  /**
   * Criar assinatura de plano
   */
  async createSubscription(req, res) {
    try {
      const userId = req.user.id; // Corrigido de req.userId para req.user.id
      const { planoId, billingType, creditCard, creditCardHolderInfo } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      if (!user.asaas_customer_id) {
        return res.status(400).json({ 
          erro: 'É necessário criar dados de pagamento antes de assinar um plano' 
        });
      }

      const plano = await Plano.findByPk(planoId);
      if (!plano) {
        return res.status(404).json({ erro: 'Plano não encontrado' });
      }

      // Verifica se usuário já tem assinatura ativa
      const assinaturaAtiva = await Assinatura.findOne({
        where: { 
          usuario_id: userId, 
          status: 'ativa' 
        }
      });

      if (assinaturaAtiva) {
        return res.status(400).json({ 
          erro: 'Usuário já possui uma assinatura ativa' 
        });
      }

      // Validação do cartão se for pagamento por cartão
      if (billingType === 'CREDIT_CARD') {
        if (!creditCard || !creditCardHolderInfo) {
          return res.status(400).json({ 
            erro: 'Dados do cartão de crédito são obrigatórios para este tipo de pagamento' 
          });
        }
        AsaasClient.validateCreditCard(creditCard);
      }

      // Calcula próxima data de vencimento (7 dias a partir de hoje)
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 7);

      const subscriptionData = {
        customerId: user.asaas_customer_id,
        billingType: billingType || 'CREDIT_CARD',
        value: plano.preco,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${plano.nome} - LoadTech`,
        externalReference: `${userId}_${planoId}_${Date.now()}`,
        creditCard: creditCard,
        creditCardHolderInfo: creditCardHolderInfo
      };

      const asaasSubscription = await AsaasClient.createSubscription(subscriptionData);

      // Cria registro da assinatura no banco
      const assinatura = await Assinatura.create({
        usuario_id: userId,
        plano_id: planoId,
        asaas_subscription_id: asaasSubscription.id,
        status: 'pendente',
        data_inicio: new Date(),
        data_fim: null,
        valor: plano.preco,
        forma_pagamento: billingType,
        metadata: {
          asaas_customer_id: user.asaas_customer_id,
          external_reference: subscriptionData.externalReference
        }
      });

      return res.status(201).json({
        mensagem: 'Assinatura criada com sucesso',
        assinatura: {
          id: assinatura.id,
          plano: plano.nome,
          valor: plano.preco,
          status: assinatura.status,
          proxima_cobranca: nextDueDate,
          asaas_subscription_id: asaasSubscription.id
        },
        payment_url: asaasSubscription.invoiceUrl
      });
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      return res.status(500).json({
        erro: 'Erro ao criar assinatura',
        detalhes: error.message
      });
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { assinaturaId } = req.params;

      const assinatura = await Assinatura.findOne({
        where: { 
          id: assinaturaId,
          usuario_id: userId 
        },
        include: [Plano]
      });

      if (!assinatura) {
        return res.status(404).json({ erro: 'Assinatura não encontrada' });
      }

      if (assinatura.status === 'cancelada') {
        return res.status(400).json({ erro: 'Assinatura já está cancelada' });
      }

      // Cancela no Asaas
      await AsaasClient.cancelSubscription(assinatura.asaas_subscription_id);

      // Atualiza no banco
      assinatura.status = 'cancelada';
      assinatura.data_cancelamento = new Date();
      await assinatura.save();

      return res.json({
        mensagem: 'Assinatura cancelada com sucesso',
        assinatura: {
          id: assinatura.id,
          plano: assinatura.Plano.nome,
          status: assinatura.status,
          data_cancelamento: assinatura.data_cancelamento
        }
      });
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return res.status(500).json({
        erro: 'Erro ao cancelar assinatura',
        detalhes: error.message
      });
    }
  }

  /**
   * Listar assinaturas do usuário
   */
  async listUserSubscriptions(req, res) {
    try {
      const userId = req.user.id;

      const assinaturas = await Assinatura.findAll({
        where: { user_id: userId },
        include: [{ 
          model: Plano, 
          as: 'plano' 
        }],
        order: [['createdAt', 'DESC']]
      });

      const assinaturasFormatadas = assinaturas.map(assinatura => ({
        id: assinatura.id,
        plano: {
          id: assinatura.plano.id,
          nome: assinatura.plano.nome,
          preco: assinatura.plano.preco_mensal || assinatura.plano.preco
        },
        status: assinatura.status,
        valor: assinatura.valor_pago,
        forma_pagamento: assinatura.metodo_pagamento,
        data_inicio: assinatura.data_inicio,
        data_fim: assinatura.data_fim,
        data_cancelamento: assinatura.data_cancelamento,
        criado_em: assinatura.createdAt
      }));

      return res.json({
        assinaturas: assinaturasFormatadas,
        total: assinaturas.length
      });
    } catch (error) {
      console.error('Erro ao listar assinaturas:', error);
      return res.status(500).json({
        erro: 'Erro ao buscar assinaturas',
        detalhes: error.message
      });
    }
  }

  /**
   * Webhook do Asaas para receber notificações de pagamento
   */
  async webhook(req, res) {
    try {
      const { event, payment, subscription } = req.body;
      
      console.log('📨 Webhook Asaas recebido:', { event, paymentId: payment?.id, subscriptionId: subscription?.id });

      switch (event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          await PaymentController.handlePaymentConfirmed(payment, subscription);
          break;
          
        case 'PAYMENT_OVERDUE':
          await PaymentController.handlePaymentOverdue(payment, subscription);
          break;
          
        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
          await PaymentController.handlePaymentCancelled(payment, subscription);
          break;
          
        default:
          console.log(`ℹ️ Evento não tratado: ${event}`);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('Erro no webhook Asaas:', error);
      return res.status(500).json({ erro: 'Erro interno no webhook' });
    }
  }

  /**
   * Processa pagamento confirmado
   */
  static async handlePaymentConfirmed(payment, subscription) {
    if (subscription) {
      const assinatura = await Assinatura.findOne({
        where: { asaas_subscription_id: subscription.id }
      });

      if (assinatura) {
        assinatura.status = 'ativa';
        assinatura.ultimo_pagamento = new Date();
        
        // Calcula próxima data de vencimento
        const dataFim = new Date();
        dataFim.setMonth(dataFim.getMonth() + 1);
        assinatura.data_fim = dataFim;
        
        await assinatura.save();
        
        console.log(`✅ Assinatura ${assinatura.id} ativada - Pagamento confirmado`);
      }
    }
  }

  /**
   * Processa pagamento em atraso
   */
  static async handlePaymentOverdue(payment, subscription) {
    if (subscription) {
      const assinatura = await Assinatura.findOne({
        where: { asaas_subscription_id: subscription.id }
      });

      if (assinatura && assinatura.status === 'ativa') {
        assinatura.status = 'inadimplente';
        await assinatura.save();
        
        console.log(`⚠️ Assinatura ${assinatura.id} marcada como inadimplente`);
      }
    }
  }

  /**
   * Processa pagamento cancelado/estornado
   */
  static async handlePaymentCancelled(payment, subscription) {
    if (subscription) {
      const assinatura = await Assinatura.findOne({
        where: { asaas_subscription_id: subscription.id }
      });

      if (assinatura) {
        assinatura.status = 'cancelada';
        assinatura.data_cancelamento = new Date();
        await assinatura.save();
        
        console.log(`❌ Assinatura ${assinatura.id} cancelada - Pagamento estornado`);
      }
    }
  }

  /**
   * Status da integração com Asaas
   */
  async getPaymentStatus(req, res) {
    try {
      const status = await AsaasClient.getApiStatus();
      const balance = await AsaasClient.getBalance();
      
      return res.json({
        asaas_status: status,
        account_balance: balance,
        integration_status: 'operational'
      });
    } catch (error) {
      return res.status(500).json({
        erro: 'Erro ao verificar status do sistema de pagamento',
        detalhes: error.message
      });
    }
  }

  // ===== MERCADO PAGO - VENDAS DE PRODUTOS =====

  /**
   * Configurar credenciais do Mercado Pago para a loja
   */
  async configureMercadoPago(req, res) {
    try {
      const userId = req.user.id;
      const { access_token, public_key, webhook_url } = req.body;

      // Busca a loja do usuário
      const loja = await Loja.findOne({ where: { usuario_id: userId } });
      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada. Crie sua loja primeiro.' });
      }

      // Valida as credenciais
      const validation = await MercadoPagoClient.validateCredentials({ access_token });
      if (!validation.valid) {
        return res.status(400).json({ 
          erro: 'Credenciais do Mercado Pago inválidas',
          detalhes: validation.message
        });
      }

      // Atualiza configurações de pagamento da loja
      const configuracoesPagamento = loja.configuracoes_pagamento || {};
      configuracoesPagamento.mercadopago = {
        access_token: access_token,
        public_key: public_key,
        webhook_url: webhook_url,
        enabled: true,
        configured_at: new Date().toISOString()
      };

      loja.configuracoes_pagamento = configuracoesPagamento;
      await loja.save();

      return res.json({
        mensagem: 'Mercado Pago configurado com sucesso',
        loja: {
          id: loja.id,
          nome: loja.nome,
          mercadopago_enabled: true
        }
      });
    } catch (error) {
      console.error('Erro ao configurar Mercado Pago:', error);
      return res.status(500).json({
        erro: 'Erro ao configurar Mercado Pago',
        detalhes: error.message
      });
    }
  }

  /**
   * Criar preferência de pagamento para produtos
   */
  async createProductPayment(req, res) {
    try {
      const userId = req.user.id;
      const { 
        items, 
        payer, 
        shipments, 
        back_urls, 
        external_reference,
        installments,
        excluded_payment_methods 
      } = req.body;

      // Busca a loja do usuário
      const loja = await Loja.findOne({ where: { usuario_id: userId } });
      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada' });
      }

      // Verifica se Mercado Pago está configurado
      const mpConfig = loja.configuracoes_pagamento?.mercadopago;
      if (!mpConfig || !mpConfig.enabled || !mpConfig.access_token) {
        return res.status(400).json({ 
          erro: 'Mercado Pago não configurado para esta loja' 
        });
      }

      // Validações básicas
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ erro: 'Items são obrigatórios' });
      }

      // Prepara dados da preferência
      const preferenceData = {
        items: items,
        payer: payer,
        shipments: shipments,
        back_urls: back_urls,
        external_reference: external_reference || `loja_${loja.id}_${Date.now()}`,
        installments: installments,
        excluded_payment_methods: excluded_payment_methods,
        loja_id: loja.id,
        notification_url: mpConfig.webhook_url
      };

      // Cria preferência no Mercado Pago
      const preference = await MercadoPagoClient.createPreference(mpConfig, preferenceData);

      return res.status(201).json({
        mensagem: 'Preferência de pagamento criada com sucesso',
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        external_reference: preference.external_reference,
        marketplace_fee: MercadoPagoClient.calculateLoadTechFee(items),
        expires_at: preference.expiration_date_to
      });
    } catch (error) {
      console.error('Erro ao criar preferência de pagamento:', error);
      return res.status(500).json({
        erro: 'Erro ao criar preferência de pagamento',
        detalhes: error.message
      });
    }
  }

  /**
   * Webhook do Mercado Pago para notificações de pagamento
   */
  async mercadoPagoWebhook(req, res) {
    try {
      const webhookData = MercadoPagoClient.formatWebhookData(req.body);
      
      console.log('📨 Webhook MercadoPago recebido:', webhookData);

      // Responde rapidamente ao MP
      res.status(200).json({ received: true });

      // Processa webhook de forma assíncrona
      if (webhookData.topic === 'payment') {
        await this.processMercadoPagoPayment(webhookData.data_id);
      }
    } catch (error) {
      console.error('Erro no webhook MercadoPago:', error);
      return res.status(500).json({ erro: 'Erro interno no webhook' });
    }
  }

  /**
   * Processa pagamento do Mercado Pago
   */
  async processMercadoPagoPayment(paymentId) {
    try {
      // Busca todas as lojas com MP configurado para tentar encontrar o pagamento
      const lojas = await Loja.findAll({
        where: {
          'configuracoes_pagamento.mercadopago.enabled': true
        }
      });

      for (const loja of lojas) {
        try {
          const mpConfig = loja.configuracoes_pagamento.mercadopago;
          const payment = await MercadoPagoClient.getPayment(mpConfig, paymentId);
          
          if (payment) {
            await this.handleMercadoPagoPayment(payment, loja);
            break;
          }
        } catch (error) {
          // Continua tentando com outras lojas
          continue;
        }
      }
    } catch (error) {
      console.error('Erro ao processar pagamento MP:', error);
    }
  }

  /**
   * Processa status do pagamento MP
   */
  async handleMercadoPagoPayment(paymentData, loja) {
    const paymentInfo = MercadoPagoClient.extractPaymentInfo(paymentData);
    
    console.log(`💳 Pagamento MP processado: ${paymentInfo.id} - Status: ${paymentInfo.status}`);
    
    // Aqui você pode implementar a lógica específica do seu negócio:
    // - Atualizar status do pedido
    // - Enviar email de confirmação
    // - Atualizar estoque
    // - Etc.

    // Por enquanto, apenas loga a informação
    console.log(`🏪 Loja: ${loja.nome} - Valor: R$ ${paymentInfo.transaction_amount}`);
  }

  /**
   * Buscar informações de um pagamento MP
   */
  async getMercadoPagoPayment(req, res) {
    try {
      const userId = req.user.id;
      const { paymentId } = req.params;

      const loja = await Loja.findOne({ where: { usuario_id: userId } });
      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada' });
      }

      const mpConfig = loja.configuracoes_pagamento?.mercadopago;
      if (!mpConfig || !mpConfig.enabled) {
        return res.status(400).json({ erro: 'Mercado Pago não configurado' });
      }

      const payment = await MercadoPagoClient.getPayment(mpConfig, paymentId);
      const paymentInfo = MercadoPagoClient.extractPaymentInfo(payment);

      return res.json({
        pagamento: paymentInfo,
        is_approved: MercadoPagoClient.isPaymentApproved(payment)
      });
    } catch (error) {
      console.error('Erro ao buscar pagamento MP:', error);
      return res.status(500).json({
        erro: 'Erro ao buscar pagamento',
        detalhes: error.message
      });
    }
  }

  /**
   * Status das integrações de pagamento
   */
  async getIntegrationStatus(req, res) {
    try {
      const userId = req.user.id;
      
      // Status Asaas (global)
      const asaasStatus = await AsaasClient.getApiStatus();
      
      // Status Mercado Pago (por loja)
      const loja = await Loja.findOne({ where: { usuario_id: userId } });
      let mercadoPagoStatus = { configured: false };
      
      if (loja?.configuracoes_pagamento?.mercadopago?.enabled) {
        const mpConfig = loja.configuracoes_pagamento.mercadopago;
        const validation = await MercadoPagoClient.validateCredentials(mpConfig);
        mercadoPagoStatus = {
          configured: true,
          valid: validation.valid,
          message: validation.message,
          configured_at: mpConfig.configured_at
        };
      }
      
      return res.json({
        asaas: asaasStatus,
        mercadopago: mercadoPagoStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        erro: 'Erro ao verificar status das integrações',
        detalhes: error.message
      });
    }
  }

  /**
   * Criar assinatura com cartão de crédito
   */
  async createCreditCardSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { 
        planoId, 
        creditCard, 
        creditCardHolderInfo, 
        remoteIp,
        saveCard = false 
      } = req.body;

      const result = await validateUserAndPlan(userId, planoId);
      if (result.error) return res.status(result.status).json({ erro: result.error });

      const { user, plano } = result;

      // Validação específica do cartão
      AsaasClient.validateCreditCard(creditCard);

      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 7);

      // Tokenizar cartão se solicitado
      let creditCardToken = null;
      if (saveCard) {
        try {
          const tokenResult = await AsaasClient.tokenizeCreditCard(user.asaas_customer_id, creditCard);
          creditCardToken = tokenResult.creditCardToken;
        } catch (error) {
          console.log('Aviso: Não foi possível tokenizar o cartão:', error.message);
        }
      }

      const subscriptionData = {
        customerId: user.asaas_customer_id,
        billingType: 'CREDIT_CARD',
        value: plano.preco,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${plano.nome} - LoadTech`,
        externalReference: `${userId}_${planoId}_${Date.now()}`,
        creditCard: creditCard,
        creditCardHolderInfo: creditCardHolderInfo,
        remoteIp: remoteIp
      };

      const asaasSubscription = await AsaasClient.createCreditCardSubscription(
        subscriptionData, 
        creditCard, 
        creditCardHolderInfo
      );

      const assinatura = await createSubscriptionRecord(
        userId, planoId, asaasSubscription, 'CREDIT_CARD', plano.preco, {
          creditCardToken,
          lastFourDigits: creditCard.number.slice(-4)
        }
      );

      return res.status(201).json({
        mensagem: 'Assinatura com cartão de crédito criada com sucesso',
        assinatura: formatSubscriptionResponse(assinatura, plano, nextDueDate),
        payment_url: asaasSubscription.invoiceUrl,
        credit_card_saved: !!creditCardToken
      });
    } catch (error) {
      console.error('Erro ao criar assinatura com cartão:', error);
      return res.status(500).json({
        erro: 'Erro ao criar assinatura com cartão de crédito',
        detalhes: error.message
      });
    }
  }

  /**
   * Criar assinatura com boleto bancário
   */
  async createBoletoSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { planoId, postalService = false, interest, fine } = req.body;

      const result = await validateUserAndPlan(userId, planoId);
      if (result.error) return res.status(result.status).json({ erro: result.error });

      const { user, plano } = result;

      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 7);

      const subscriptionData = {
        customerId: user.asaas_customer_id,
        value: plano.preco,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${plano.nome} - LoadTech`,
        externalReference: `${userId}_${planoId}_${Date.now()}`
      };

      const asaasSubscription = await AsaasClient.createBoletoSubscription(
        subscriptionData, 
        { postalService, interest, fine }
      );

      const assinatura = await createSubscriptionRecord(
        userId, planoId, asaasSubscription, 'BOLETO', plano.preco, {
          postalService
        }
      );

      return res.status(201).json({
        mensagem: 'Assinatura com boleto bancário criada com sucesso',
        assinatura: formatSubscriptionResponse(assinatura, plano, nextDueDate),
        payment_url: asaasSubscription.invoiceUrl,
        boleto_url: asaasSubscription.bankSlipUrl
      });
    } catch (error) {
      console.error('Erro ao criar assinatura com boleto:', error);
      return res.status(500).json({
        erro: 'Erro ao criar assinatura com boleto bancário',
        detalhes: error.message
      });
    }
  }

  /**
   * Criar assinatura com PIX
   */
  async createPixSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { planoId, pixAddressKey, pixQrCodeId } = req.body;

      const result = await validateUserAndPlan(userId, planoId);
      if (result.error) return res.status(result.status).json({ erro: result.error });

      const { user, plano } = result;

      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 7);

      const subscriptionData = {
        customerId: user.asaas_customer_id,
        value: plano.preco,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${plano.nome} - LoadTech`,
        externalReference: `${userId}_${planoId}_${Date.now()}`
      };

      const asaasSubscription = await AsaasClient.createPixSubscription(
        subscriptionData, 
        { pixAddressKey, pixQrCodeId }
      );

      const assinatura = await createSubscriptionRecord(
        userId, planoId, asaasSubscription, 'PIX', plano.preco, {
          pixAddressKey
        }
      );

      return res.status(201).json({
        mensagem: 'Assinatura com PIX criada com sucesso',
        assinatura: formatSubscriptionResponse(assinatura, plano, nextDueDate),
        payment_url: asaasSubscription.invoiceUrl,
        pix_copy_paste: asaasSubscription.pixCopyAndPaste,
        pix_qr_code: asaasSubscription.pixQrCodeId
      });
    } catch (error) {
      console.error('Erro ao criar assinatura com PIX:', error);
      return res.status(500).json({
        erro: 'Erro ao criar assinatura com PIX',
        detalhes: error.message
      });
    }
  }

  /**
   * Criar assinatura com débito em conta
   */
  async createDebitSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { planoId, bankInfo } = req.body;

      if (!bankInfo || !bankInfo.bank || !bankInfo.accountType || !bankInfo.agency || !bankInfo.account) {
        return res.status(400).json({ 
          erro: 'Dados bancários completos são obrigatórios para débito em conta' 
        });
      }

      const result = await validateUserAndPlan(userId, planoId);
      if (result.error) return res.status(result.status).json({ erro: result.error });

      const { user, plano } = result;

      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 7);

      const subscriptionData = {
        customerId: user.asaas_customer_id,
        value: plano.preco,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${plano.nome} - LoadTech`,
        externalReference: `${userId}_${planoId}_${Date.now()}`
      };

      const asaasSubscription = await AsaasClient.createDebitSubscription(
        subscriptionData, 
        bankInfo
      );

      const assinatura = await createSubscriptionRecord(
        userId, planoId, asaasSubscription, 'DEBIT', plano.preco, {
          bank: bankInfo.bank,
          agency: bankInfo.agency,
          account: bankInfo.account.replace(/.(?=.{4})/g, '*') // Mascarar conta
        }
      );

      return res.status(201).json({
        mensagem: 'Assinatura com débito em conta criada com sucesso',
        assinatura: formatSubscriptionResponse(assinatura, plano, nextDueDate),
        payment_url: asaasSubscription.invoiceUrl
      });
    } catch (error) {
      console.error('Erro ao criar assinatura com débito:', error);
      return res.status(500).json({
        erro: 'Erro ao criar assinatura com débito em conta',
        detalhes: error.message
      });
    }
  }

  /**
   * Criar assinatura com transferência bancária
   */
  async createTransferSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { planoId } = req.body;

      const result = await validateUserAndPlan(userId, planoId);
      if (result.error) return res.status(result.status).json({ erro: result.error });

      const { user, plano } = result;

      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + 7);

      const subscriptionData = {
        customerId: user.asaas_customer_id,
        value: plano.preco,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        cycle: 'MONTHLY',
        description: `Assinatura ${plano.nome} - LoadTech`,
        externalReference: `${userId}_${planoId}_${Date.now()}`
      };

      const asaasSubscription = await AsaasClient.createTransferSubscription(subscriptionData);

      // Buscar dados bancários para transferência
      const bankTransferInfo = await AsaasClient.getBankTransferInfo();

      const assinatura = await createSubscriptionRecord(
        userId, planoId, asaasSubscription, 'TRANSFER', plano.preco, {
          bankInfo: bankTransferInfo
        }
      );

      return res.status(201).json({
        mensagem: 'Assinatura com transferência bancária criada com sucesso',
        assinatura: formatSubscriptionResponse(assinatura, plano, nextDueDate),
        payment_url: asaasSubscription.invoiceUrl,
        bank_transfer_info: {
          bank: bankTransferInfo.bank,
          agency: bankTransferInfo.agency,
          account: bankTransferInfo.account,
          accountDigit: bankTransferInfo.accountDigit,
          companyDocument: bankTransferInfo.companyDocument,
          companyName: bankTransferInfo.companyName
        }
      });
    } catch (error) {
      console.error('Erro ao criar assinatura com transferência:', error);
      return res.status(500).json({
        erro: 'Erro ao criar assinatura com transferência bancária',
        detalhes: error.message
      });
    }
  }

  /**
   * Sincronizar dados do Asaas para o nosso banco
   * Busca clientes no Asaas e atualiza dados locais
   */
  async syncAsaasCustomers(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      if (!user.asaas_customer_id) {
        return res.status(400).json({ erro: 'Usuário não possui cliente Asaas associado' });
      }

      // 🔍 BUSCAR DADOS COMPLETOS DO CLIENTE NO ASAAS
      const asaasCustomer = await AsaasClient.getCustomerById(user.asaas_customer_id);

      // 📥 ATUALIZAR DADOS LOCAIS COM INFORMAÇÕES DO ASAAS
      await user.update({
        // Manter apenas dados essenciais + alguns dados úteis do Asaas
        cpf_cnpj: asaasCustomer.cpfCnpj,
        telefone: asaasCustomer.mobilePhone || asaasCustomer.phone || user.telefone
      });

      console.log(`🔄 Dados sincronizados para usuário ${user.email}`);

      return res.json({
        mensagem: 'Dados sincronizados com sucesso',
        customer: {
          id: asaasCustomer.id,
          name: asaasCustomer.name,
          email: asaasCustomer.email,
          cpfCnpj: asaasCustomer.cpfCnpj,
          phone: asaasCustomer.phone,
          mobilePhone: asaasCustomer.mobilePhone,
          address: asaasCustomer.address,
          city: asaasCustomer.city,
          state: asaasCustomer.state,
          postalCode: asaasCustomer.postalCode
        }
      });
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      return res.status(500).json({
        erro: 'Erro ao sincronizar dados do cliente',
        detalhes: error.message
      });
    }
  }

  /**
   * Listar todos os clientes do Asaas (apenas para admin)
   */
  async listAsaasCustomers(req, res) {
    try {
      const { name, email, cpfCnpj, offset = 0, limit = 20 } = req.query;

      const filters = {
        offset: parseInt(offset),
        limit: parseInt(limit)
      };

      if (name) filters.name = name;
      if (email) filters.email = email;
      if (cpfCnpj) filters.cpfCnpj = cpfCnpj;

      const customers = await AsaasClient.listCustomers(filters);

      return res.json({
        customers: customers.data || [],
        totalCount: customers.totalCount || 0,
        hasMore: customers.hasMore || false,
        offset: filters.offset,
        limit: filters.limit
      });
    } catch (error) {
      console.error('Erro ao listar clientes Asaas:', error);
      return res.status(500).json({
        erro: 'Erro ao buscar clientes do sistema de pagamento',
        detalhes: error.message
      });
    }
  }

  /**
   * Buscar cliente específico no Asaas
   */
  async getAsaasCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      // Verificar se o usuário pode acessar este cliente
      if (user.asaas_customer_id !== customerId && !user.is_admin) {
        return res.status(403).json({ erro: 'Acesso negado a este cliente' });
      }

      const customer = await AsaasClient.getCustomerById(customerId);

      return res.json({
        customer: customer
      });
    } catch (error) {
      console.error('Erro ao buscar cliente Asaas:', error);
      return res.status(500).json({
        erro: 'Erro ao buscar cliente no sistema de pagamento',
        detalhes: error.message
      });
    }
  }

  /**
   * Atualizar cliente no Asaas (ASAAS PRIMEIRO, depois nosso banco)
   */
  async updateAsaasCustomer(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      if (!user.asaas_customer_id) {
        return res.status(400).json({ erro: 'Cliente não possui conta de pagamento associada' });
      }

      const updateData = req.body;

      // 🚀 PRIMEIRO: ATUALIZAR NO ASAAS
      const updatedCustomer = await AsaasClient.updateCustomer(user.asaas_customer_id, updateData);

      // 📝 SEGUNDO: ATUALIZAR DADOS ESSENCIAIS NO NOSSO BANCO
      const localUpdates = {};
      if (updateData.cpfCnpj) localUpdates.cpf_cnpj = updateData.cpfCnpj;
      if (updateData.mobilePhone || updateData.phone) {
        localUpdates.telefone = updateData.mobilePhone || updateData.phone;
      }

      if (Object.keys(localUpdates).length > 0) {
        await user.update(localUpdates);
      }

      console.log(`🔄 Cliente ${user.asaas_customer_id} atualizado no Asaas e banco`);

      return res.json({
        mensagem: 'Cliente atualizado com sucesso',
        customer: updatedCustomer
      });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return res.status(500).json({
        erro: 'Erro ao atualizar cliente no sistema de pagamento',
        detalhes: error.message
      });
    }
  }

  /**
   * Remover cliente (ASAAS PRIMEIRO, depois nosso banco)
   */
  async deleteAsaasCustomer(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      if (!user.asaas_customer_id) {
        return res.status(400).json({ erro: 'Cliente não possui conta de pagamento associada' });
      }

      // 🗑️ PRIMEIRO: REMOVER NO ASAAS
      await AsaasClient.deleteCustomer(user.asaas_customer_id);

      // 📝 SEGUNDO: LIMPAR REFERÊNCIA NO NOSSO BANCO
      await user.update({
        asaas_customer_id: null,
        cpf_cnpj: null // Limpar também o CPF se desejar
      });

      console.log(`🗑️ Cliente ${user.email} removido do Asaas e banco`);

      return res.json({
        mensagem: 'Cliente removido com sucesso do sistema de pagamento'
      });
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      return res.status(500).json({
        erro: 'Erro ao remover cliente do sistema de pagamento',
        detalhes: error.message
      });
    }
  }

  /**
   * Restaurar cliente removido (ASAAS PRIMEIRO, depois nosso banco)
   */
  async restoreAsaasCustomer(req, res) {
    try {
      const { customerId } = req.body;
      const userId = req.user.id;

      if (!customerId) {
        return res.status(400).json({ erro: 'ID do cliente é obrigatório' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }

      // 🔄 PRIMEIRO: RESTAURAR NO ASAAS
      const restoredCustomer = await AsaasClient.restoreCustomer(customerId);

      // 📝 SEGUNDO: ASSOCIAR NOVAMENTE NO NOSSO BANCO
      await user.update({
        asaas_customer_id: restoredCustomer.id,
        cpf_cnpj: restoredCustomer.cpfCnpj
      });

      console.log(`🔄 Cliente ${customerId} restaurado no Asaas e vinculado ao usuário ${user.email}`);

      return res.json({
        mensagem: 'Cliente restaurado com sucesso',
        customer: restoredCustomer
      });
    } catch (error) {
      console.error('Erro ao restaurar cliente:', error);
      return res.status(500).json({
        erro: 'Erro ao restaurar cliente no sistema de pagamento',
        detalhes: error.message
      });
    }
  }

  /**
   * Validar usuário e plano (método auxiliar)
   */
  async validateUserAndPlan(userId, planoId) {
    const user = await User.findByPk(userId);
    if (!user) {
      return { error: 'Usuário não encontrado', status: 404 };
    }

    if (!user.asaas_customer_id) {
      return { 
        error: 'É necessário criar dados de pagamento antes de assinar um plano', 
        status: 400 
      };
    }

    const plano = await Plano.findByPk(planoId);
    if (!plano) {
      return { error: 'Plano não encontrado', status: 404 };
    }

    // Verifica se usuário já tem assinatura ativa
    const assinaturaAtiva = await Assinatura.findOne({
      where: { 
        usuario_id: userId, 
        status: 'ativa' 
      }
    });

    if (assinaturaAtiva) {
      return { 
        error: 'Usuário já possui uma assinatura ativa', 
        status: 400 
      };
    }

    return { user, plano };
  }

  /**
   * Criar registro de assinatura no banco (método auxiliar)
   */
  async createSubscriptionRecord(userId, planoId, asaasSubscription, billingType, value, metadata = {}) {
    return await Assinatura.create({
      usuario_id: userId,
      plano_id: planoId,
      asaas_subscription_id: asaasSubscription.id,
      status: 'pendente',
      data_inicio: new Date(),
      data_fim: null,
      valor: value,
      forma_pagamento: billingType,
      metadata: {
        asaas_customer_id: asaasSubscription.customer,
        external_reference: asaasSubscription.externalReference,
        ...metadata
      }
    });
  }

  /**
   * Formatar resposta da assinatura (método auxiliar)
   */
  formatSubscriptionResponse(assinatura, plano, nextDueDate) {
    return {
      id: assinatura.id,
      plano: plano.nome,
      valor: plano.preco,
      status: assinatura.status,
      forma_pagamento: assinatura.forma_pagamento,
      proxima_cobranca: nextDueDate,
      asaas_subscription_id: assinatura.asaas_subscription_id
    };
  }

  /**
   * Listar cartões salvos do usuário
   */
  async listUserCreditCards(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user || !user.asaas_customer_id) {
        return res.status(404).json({ erro: 'Usuário ou dados de pagamento não encontrados' });
      }

      const creditCards = await AsaasClient.listCustomerCreditCards(user.asaas_customer_id);

      const cartoesFormatados = creditCards.data.map(card => ({
        token: card.creditCardToken,
        brand: card.creditCardBrand,
        lastFourDigits: card.creditCardNumber,
        holderName: card.holderName,
        createdAt: card.dateCreated
      }));

      return res.json({
        cartoes: cartoesFormatados,
        total: creditCards.totalCount
      });
    } catch (error) {
      console.error('Erro ao listar cartões:', error);
      return res.status(500).json({
        erro: 'Erro ao buscar cartões salvos',
        detalhes: error.message
      });
    }
  }

  /**
   * Remover cartão salvo
   */
  async deleteCreditCard(req, res) {
    try {
      const { tokenId } = req.params;

      await AsaasClient.deleteCreditCardToken(tokenId);

      return res.json({
        mensagem: 'Cartão removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover cartão:', error);
      return res.status(500).json({
        erro: 'Erro ao remover cartão',
        detalhes: error.message
      });
    }
  }

  /**
   * Gerar QR Code PIX para cobrança
   */
  async generatePixQrCode(req, res) {
    try {
      const { paymentId } = req.params;

      const pixQrCode = await AsaasClient.generatePixQrCode(paymentId);

      return res.json({
        qr_code: pixQrCode.encodedImage,
        payload: pixQrCode.payload,
        expires_at: pixQrCode.expirationDate
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code PIX:', error);
      return res.status(500).json({
        erro: 'Erro ao gerar QR Code PIX',
        detalhes: error.message
      });
    }
  }

  /**
   * Criar cobrança única (não recorrente)
   */
  async createSinglePayment(req, res) {
    try {
      const userId = req.user.id;
      const { 
        valor, 
        descricao, 
        vencimento, 
        billingType, 
        creditCard, 
        creditCardHolderInfo,
        installmentCount 
      } = req.body;

      const user = await User.findByPk(userId);
      if (!user || !user.asaas_customer_id) {
        return res.status(404).json({ erro: 'Usuário ou dados de pagamento não encontrados' });
      }

      if (billingType === 'CREDIT_CARD' && installmentCount > 1) {
        // Cobrança parcelada
        const installmentValue = Math.round((valor / installmentCount) * 100) / 100;
        
        const paymentData = {
          customerId: user.asaas_customer_id,
          billingType: 'CREDIT_CARD',
          value: valor,
          dueDate: vencimento,
          description: descricao,
          externalReference: `single_${userId}_${Date.now()}`,
          installmentCount: installmentCount,
          installmentValue: installmentValue,
          creditCard: creditCard,
          creditCardHolderInfo: creditCardHolderInfo
        };

        const payment = await AsaasClient.createPaymentWithAllOptions(paymentData);

        return res.status(201).json({
          mensagem: 'Cobrança parcelada criada com sucesso',
          payment: {
            id: payment.id,
            valor: payment.value,
            parcelas: installmentCount,
            valor_parcela: installmentValue,
            status: payment.status,
            vencimento: payment.dueDate
          },
          payment_url: payment.invoiceUrl
        });
      } else {
        // Cobrança única
        const paymentData = {
          customerId: user.asaas_customer_id,
          billingType: billingType,
          value: valor,
          dueDate: vencimento,
          description: descricao,
          externalReference: `single_${userId}_${Date.now()}`,
          creditCard: creditCard,
          creditCardHolderInfo: creditCardHolderInfo
        };

        const payment = await AsaasClient.createPaymentWithAllOptions(paymentData);

        return res.status(201).json({
          mensagem: 'Cobrança criada com sucesso',
          payment: {
            id: payment.id,
            valor: payment.value,
            status: payment.status,
            vencimento: payment.dueDate,
            forma_pagamento: payment.billingType
          },
          payment_url: payment.invoiceUrl,
          boleto_url: payment.bankSlipUrl,
          pix_copy_paste: payment.pixCopyAndPaste
        });
      }
    } catch (error) {
      console.error('Erro ao criar cobrança única:', error);
      return res.status(500).json({
        erro: 'Erro ao criar cobrança',
        detalhes: error.message
      });
    }
  }

  // ===== NOVOS MÉTODOS DE GERENCIAMENTO DE CLIENTES =====

  /**
   * Listar todos os clientes do Asaas
   */
  async listAsaasCustomers(req, res) {
    try {
      const { name, email, cpfCnpj, offset = 0, limit = 20 } = req.query;

      const filters = {
        offset: parseInt(offset),
        limit: parseInt(limit)
      };

      if (name) filters.name = name;
      if (email) filters.email = email;
      if (cpfCnpj) filters.cpfCnpj = cpfCnpj;

      console.log('📋 Listando clientes Asaas com filtros:', filters);

      const response = await AsaasClient.listCustomers(filters);

      return res.json({
        sucesso: true,
        clientes: response.data || [],
        totalCount: response.totalCount || 0,
        hasMore: response.hasMore || false,
        offset: response.offset || 0,
        limit: response.limit || 20
      });

    } catch (error) {
      console.error('❌ Erro ao listar clientes Asaas:', error);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao listar clientes',
        detalhes: error.message
      });
    }
  }

  /**
   * Obter dados de um cliente específico do Asaas
   */
  async getAsaasCustomer(req, res) {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({
          sucesso: false,
          erro: 'ID do cliente é obrigatório'
        });
      }

      console.log('🔍 Buscando cliente Asaas:', customerId);

      const customer = await AsaasClient.getCustomer(customerId);

      return res.json({
        sucesso: true,
        cliente: customer
      });

    } catch (error) {
      console.error('❌ Erro ao buscar cliente Asaas:', error);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao buscar cliente',
        detalhes: error.message
      });
    }
  }

  /**
   * Sincronizar clientes do Asaas com o banco local
   * Busca clientes por email, CPF e nome que já temos no banco
   */
  async syncCustomersFromAsaas(req, res) {
    try {
      console.log('🔄 Iniciando sincronização de clientes...');

      // Buscar usuários do banco local que não têm asaas_customer_id
      const usersWithoutAsaas = await User.findAll({
        where: {
          asaas_customer_id: null,
          email_verificado: true // Só sincronizar usuários com email verificado
        },
        attributes: ['id', 'nome', 'email', 'cpf']
      });

      console.log(`📊 Encontrados ${usersWithoutAsaas.length} usuários para sincronizar`);

      const syncResults = {
        total: usersWithoutAsaas.length,
        sincronizados: 0,
        erros: 0,
        detalhes: []
      };

      for (const user of usersWithoutAsaas) {
        try {
          console.log(`🔍 Sincronizando usuário: ${user.email}`);

          // Buscar no Asaas por email
          const asaasResponse = await AsaasClient.listCustomers({
            email: user.email,
            limit: 1
          });

          if (asaasResponse.data && asaasResponse.data.length > 0) {
            const asaasCustomer = asaasResponse.data[0];

            // Verificar se CPF/nome são compatíveis
            const isCompatible = 
              asaasCustomer.name.toLowerCase().includes(user.nome.toLowerCase()) ||
              user.nome.toLowerCase().includes(asaasCustomer.name.toLowerCase()) ||
              (user.cpf && asaasCustomer.cpfCnpj === user.cpf);

            if (isCompatible) {
              // Sincronizar dados
              await user.update({
                asaas_customer_id: asaasCustomer.id
              });

              syncResults.sincronizados++;
              syncResults.detalhes.push({
                usuario_id: user.id,
                email: user.email,
                asaas_customer_id: asaasCustomer.id,
                status: 'sincronizado'
              });

              console.log(`✅ Usuário ${user.email} sincronizado com Asaas ID: ${asaasCustomer.id}`);
            } else {
              syncResults.detalhes.push({
                usuario_id: user.id,
                email: user.email,
                status: 'incompatível',
                motivo: 'Nome ou CPF não conferem'
              });
            }
          } else {
            syncResults.detalhes.push({
              usuario_id: user.id,
              email: user.email,
              status: 'não_encontrado'
            });
          }

        } catch (error) {
          console.error(`❌ Erro ao sincronizar usuário ${user.email}:`, error);
          syncResults.erros++;
          syncResults.detalhes.push({
            usuario_id: user.id,
            email: user.email,
            status: 'erro',
            erro: error.message
          });
        }
      }

      console.log('✅ Sincronização concluída:', syncResults);

      return res.json({
        sucesso: true,
        mensagem: 'Sincronização concluída',
        resultados: syncResults
      });

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro na sincronização',
        detalhes: error.message
      });
    }
  }

  /**
   * Atualizar cliente no Asaas
   */
  async updateAsaasCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const updateData = req.body;

      if (!customerId) {
        return res.status(400).json({
          sucesso: false,
          erro: 'ID do cliente é obrigatório'
        });
      }

      console.log('🔄 Atualizando cliente Asaas:', customerId);

      // 1. Atualizar no Asaas PRIMEIRO
      const updatedCustomer = await AsaasClient.updateCustomer(customerId, updateData);

      // 2. Atualizar no banco local se necessário
      if (updateData.cpfCnpj) {
        const user = await User.findOne({
          where: { asaas_customer_id: customerId }
        });

        if (user) {
          await user.update({
            cpf: updateData.cpfCnpj
          });
        }
      }

      return res.json({
        sucesso: true,
        mensagem: 'Cliente atualizado com sucesso',
        cliente: updatedCustomer
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao atualizar cliente',
        detalhes: error.message
      });
    }
  }

  /**
   * Remover cliente do Asaas
   */
  async deleteAsaasCustomer(req, res) {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({
          sucesso: false,
          erro: 'ID do cliente é obrigatório'
        });
      }

      console.log('🗑️ Removendo cliente Asaas:', customerId);

      // 1. Remover do Asaas PRIMEIRO
      await AsaasClient.deleteCustomer(customerId);

      // 2. Remover referência do banco local
      const user = await User.findOne({
        where: { asaas_customer_id: customerId }
      });

      if (user) {
        await user.update({
          asaas_customer_id: null
        });
      }

      return res.json({
        sucesso: true,
        mensagem: 'Cliente removido com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao remover cliente:', error);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao remover cliente',
        detalhes: error.message
      });
    }
  }

  /**
   * Restaurar cliente removido do Asaas
   */
  async restoreAsaasCustomer(req, res) {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({
          sucesso: false,
          erro: 'ID do cliente é obrigatório'
        });
      }

      console.log('🔄 Restaurando cliente Asaas:', customerId);

      // 1. Restaurar no Asaas PRIMEIRO
      const restoredCustomer = await AsaasClient.restoreCustomer(customerId);

      // 2. Restaurar referência no banco local
      const user = await User.findOne({
        where: { 
          email: restoredCustomer.email 
        }
      });

      if (user) {
        await user.update({
          asaas_customer_id: customerId
        });
      }

      return res.json({
        sucesso: true,
        mensagem: 'Cliente restaurado com sucesso',
        cliente: restoredCustomer
      });

    } catch (error) {
      console.error('❌ Erro ao restaurar cliente:', error);
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao restaurar cliente',
        detalhes: error.message
      });
    }
  }
}

export default new PaymentController();

import * as Yup from 'yup';
import Loja from '../models/Loja.js';
import User from '../models/User.js';
import { createLojaDatabase } from '../../utils/createLojaDatabase.js';

class LojaController {
  // Criar nova loja
  async store(req, res) {
    try {
      // Verificar se body existe
      if (!req.body || typeof req.body !== 'object') {
        console.log('❌ Body vazio ou inválido:', req.body);
        return res.status(400).json({ 
          erro: 'Dados da requisição não foram recebidos corretamente',
          detalhes: 'Body da requisição está vazio ou não é um objeto JSON válido'
        });
      }

      // Debug: log do body recebido
      console.log('Body recebido:', JSON.stringify(req.body, null, 2));
      console.log('Chaves do body:', Object.keys(req.body));
      console.log('nome_loja:', req.body.nome_loja);
      console.log('Tipo de nome_loja:', typeof req.body.nome_loja);

      // Normalizar dados - aceitar tanto 'nome' quanto 'nome_loja'
      const dadosNormalizados = {
        ...req.body,
        nome_loja: req.body.nome_loja || req.body.nome,
        telefone_loja: req.body.telefone_loja || req.body.telefone,
        email_loja: req.body.email_loja || req.body.email,
      };

      console.log('Dados normalizados:', JSON.stringify(dadosNormalizados, null, 2));
      console.log('nome_loja após normalização:', dadosNormalizados.nome_loja);

      // Validação básica manual antes do Yup
      if (!dadosNormalizados.nome_loja || dadosNormalizados.nome_loja.trim() === '') {
        return res.status(400).json({ erro: 'Nome da loja é obrigatório' });
      }

      const schema = Yup.object().shape({
        nome_loja: Yup.string().required('Nome da loja é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
        descricao: Yup.string().nullable(),
        telefone_loja: Yup.string().nullable(),
        email_loja: Yup.string().email('E-mail inválido').nullable(),
        whatsapp: Yup.string().nullable(),
        endereco: Yup.object({
          cep: Yup.string(),
          logradouro: Yup.string(),
          numero: Yup.string(),
          complemento: Yup.string(),
          bairro: Yup.string(),
          cidade: Yup.string(),
          estado: Yup.string(),
          pais: Yup.string().default('Brasil'),
        }).nullable(),
        redes_sociais: Yup.object({
          instagram: Yup.string().url().nullable(),
          facebook: Yup.string().url().nullable(),
          twitter: Yup.string().url().nullable(),
          youtube: Yup.string().url().nullable(),
        }).nullable(),
        tema_cor_primaria: Yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Cor primária deve ser um hex válido').default('#007bff'),
        tema_cor_secundaria: Yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Cor secundária deve ser um hex válido').default('#6c757d'),
      });

      const dadosValidados = await schema.validate(dadosNormalizados);

      // Verificar se usuário pode criar loja
      const user = await User.findByPk(req.user.id);
      const podecriarLoja = await user.podecriarLoja();

      if (!podecriarLoja) {
        return res.status(403).json({ erro: 'Você precisa de uma assinatura ativa para criar uma loja.' });
      }

      // Verificar se usuário já tem loja
      const lojaExistente = await Loja.findOne({ where: { user_id: req.user.id } });
      if (lojaExistente) {
        return res.status(400).json({ erro: 'Você já possui uma loja.' });
      }

      // Gerar slug único
      const slug = await Loja.gerarSlugUnico(dadosValidados.nome_loja);

      // TEMPORÁRIO: Desabilitar criação de banco exclusivo para resolver problema do usuário
      // TODO: Reabilitar após configurar corretamente o PostgreSQL para criação de bancos
      // const dbCriado = await createLojaDatabase(slug);
      // if (!dbCriado) {
      //   return res.status(500).json({ erro: 'Não foi possível criar o banco de dados exclusivo da loja.' });
      // }
      console.log(`📝 DEBUG: Pulando criação de banco exclusivo para loja ${slug}`);

      const loja = await Loja.create({
        ...dadosValidados,
        user_id: req.user.id,
        slug,
      });

      return res.status(201).json({
        mensagem: 'Loja criada com sucesso.',
        loja: {
          ...loja.toJSON(),
          url: loja.getUrl(),
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao criar loja:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Obter loja do usuário
  async show(req, res) {
    try {
      // Debug: verificar dados do usuário no request
      console.log('🔍 Debug /minha-loja - req.user:', req.user);
      console.log('🔍 Debug /minha-loja - req.userId:', req.userId);
      
      const userId = req.user?.id || req.userId;
      console.log('🔍 Debug /minha-loja - userId final:', userId);
      
      if (!userId) {
        return res.status(401).json({ erro: 'Usuário não identificado no token' });
      }

      // Teste sem associação para debug
      const loja = await Loja.findOne({
        where: { user_id: userId }
      });

      console.log('🔍 Debug LojaController.show - Resultado da query SEM associação:', loja);
      console.log('🔍 Debug LojaController.show - Loja é null?', loja === null);

      if (!loja) {
        console.log('❌ Debug LojaController.show - Loja não encontrada para userId:', userId);
        return res.status(404).json({ erro: 'Loja não encontrada.' });
      }

      console.log('✅ Debug LojaController.show - Loja encontrada:', loja.id, loja.nome_loja);

      return res.json({
        ...loja.toJSON(),
        url: loja.getUrl(),
        is_ativa: loja.isAtiva(),
        tem_dominio_personalizado: loja.temDominioPersonalizado(),
      });
    } catch (error) {
      console.error('Erro ao buscar loja:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Obter loja por slug (público)
  async showBySlug(req, res) {
    try {
      const { slug } = req.params;

      const loja = await Loja.findOne({
        where: { slug, status: 'ativa' },
      });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada.' });
      }

      return res.json(loja.getDadosPublicos());
    } catch (error) {
      console.error('Erro ao buscar loja por slug:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Atualizar loja
  async update(req, res) {
    try {
      const schema = Yup.object().shape({
        nome_loja: Yup.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
        descricao: Yup.string().nullable(),
        telefone_loja: Yup.string().nullable(),
        email_loja: Yup.string().email('E-mail inválido').nullable(),
        whatsapp: Yup.string().nullable(),
        endereco: Yup.object({
          cep: Yup.string(),
          logradouro: Yup.string(),
          numero: Yup.string(),
          complemento: Yup.string(),
          bairro: Yup.string(),
          cidade: Yup.string(),
          estado: Yup.string(),
          pais: Yup.string(),
        }).nullable(),
        redes_sociais: Yup.object({
          instagram: Yup.string().url().nullable(),
          facebook: Yup.string().url().nullable(),
          twitter: Yup.string().url().nullable(),
          youtube: Yup.string().url().nullable(),
        }).nullable(),
        tema_cor_primaria: Yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Cor primária deve ser um hex válido'),
        tema_cor_secundaria: Yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Cor secundária deve ser um hex válido'),
        seo_titulo: Yup.string().nullable(),
        seo_descricao: Yup.string().nullable(),
        seo_palavras_chave: Yup.string().nullable(),
      });

      const dadosValidados = await schema.validate(req.body);

      const loja = await Loja.findOne({ where: { user_id: req.user.id } });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada.' });
      }

      // Se está alterando o nome da loja, gerar novo slug
      if (dadosValidados.nome_loja && dadosValidados.nome_loja !== loja.nome_loja) {
        dadosValidados.slug = await Loja.gerarSlugUnico(dadosValidados.nome_loja);
      }

      await loja.update(dadosValidados);

      return res.json({
        mensagem: 'Loja atualizada com sucesso.',
        loja: {
          ...loja.toJSON(),
          url: loja.getUrl(),
          is_ativa: loja.isAtiva(),
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao atualizar loja:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Configurar tema da loja
  async updateTheme(req, res) {
    try {
      const schema = Yup.object().shape({
        tema_cor_primaria: Yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Cor primária deve ser um hex válido').required(),
        tema_cor_secundaria: Yup.string().matches(/^#[0-9A-Fa-f]{6}$/, 'Cor secundária deve ser um hex válido').required(),
      });

      const { tema_cor_primaria, tema_cor_secundaria } = await schema.validate(req.body);

      const loja = await Loja.findOne({ where: { user_id: req.user.id } });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada.' });
      }

      await loja.configurarTema(tema_cor_primaria, tema_cor_secundaria);

      return res.json({
        mensagem: 'Tema atualizado com sucesso.',
        tema: {
          cor_primaria: loja.tema_cor_primaria,
          cor_secundaria: loja.tema_cor_secundaria,
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao atualizar tema:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Configurar SEO da loja
  async updateSEO(req, res) {
    try {
      const schema = Yup.object().shape({
        seo_titulo: Yup.string().max(60, 'Título deve ter no máximo 60 caracteres').nullable(),
        seo_descricao: Yup.string().max(160, 'Descrição deve ter no máximo 160 caracteres').nullable(),
        seo_palavras_chave: Yup.string().nullable(),
      });

      const dadosSEO = await schema.validate(req.body);

      const loja = await Loja.findOne({ where: { user_id: req.user.id } });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada.' });
      }

      await loja.configurarSEO(dadosSEO);

      return res.json({
        mensagem: 'Configurações de SEO atualizadas com sucesso.',
        seo: {
          titulo: loja.seo_titulo,
          descricao: loja.seo_descricao,
          palavras_chave: loja.seo_palavras_chave,
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao atualizar SEO:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Configurar pagamentos da loja
  async updatePaymentSettings(req, res) {
    try {
      const schema = Yup.object().shape({
        configuracoes_pagamento: Yup.object({
          mercadopago: Yup.object({
            public_key: Yup.string(),
            access_token: Yup.string(),
          }).nullable(),
          pagseguro: Yup.object({
            email: Yup.string().email(),
            token: Yup.string(),
          }).nullable(),
          stripe: Yup.object({
            public_key: Yup.string(),
            secret_key: Yup.string(),
          }).nullable(),
        }).required(),
      });

      const { configuracoes_pagamento } = await schema.validate(req.body);

      const loja = await Loja.findOne({ where: { user_id: req.user.id } });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada.' });
      }

      await loja.configurarPagamento(configuracoes_pagamento);

      return res.json({
        mensagem: 'Configurações de pagamento atualizadas com sucesso.',
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao atualizar configurações de pagamento:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Ativar/Desativar loja
  async toggleStatus(req, res) {
    try {
      const loja = await Loja.findOne({ where: { user_id: req.user.id } });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada.' });
      }

      if (loja.status === 'ativa') {
        await loja.desativar();
      } else {
        await loja.ativar();
      }

      return res.json({
        mensagem: `Loja ${loja.status === 'ativa' ? 'ativada' : 'desativada'} com sucesso.`,
        status: loja.status,
      });
    } catch (error) {
      console.error('Erro ao alterar status da loja:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Listar todas as lojas (Admin)
  async listAll(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const where = {};
      if (status) where.status = status;

      const offset = (page - 1) * limit;

      const lojas = await Loja.findAndCountAll({
        where,
        include: [
          {
            association: 'proprietario',
            attributes: ['id', 'nome', 'email'],
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return res.json({
        lojas: lojas.rows,
        total: lojas.count,
        pages: Math.ceil(lojas.count / limit),
        current_page: parseInt(page),
      });
    } catch (error) {
      console.error('Erro ao listar todas as lojas:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Listar lojas do usuário
  async index(req, res) {
    try {
      const lojas = await Loja.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            association: 'proprietario',
            attributes: ['id', 'nome', 'email'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      const lojasFormatadas = lojas.map(loja => ({
        ...loja.toJSON(),
        url_publica: loja.getUrl(),
      }));

      return res.json({
        lojas: lojasFormatadas,
        total: lojas.length,
        mensagem: lojas.length === 0 ? 'Você ainda não possui lojas cadastradas.' : undefined,
      });
    } catch (error) {
      console.error('Erro ao listar lojas:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }
}

export default new LojaController();

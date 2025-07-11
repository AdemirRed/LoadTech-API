import * as Yup from 'yup';
import Assinatura from '../models/Assinatura.js';
import Plano from '../models/Plano.js';
import User from '../models/User.js';
import Pagamento from '../models/Pagamento.js';

class AssinaturaController {
  // Listar assinaturas do usuário
  async index(req, res) {
    try {
      const assinaturas = await Assinatura.findAll({
        where: { user_id: req.user.id },
        include: [
          {
            association: 'plano',
            attributes: ['id', 'nome', 'preco_mensal', 'preco_anual', 'funcionalidades'],
          },
          {
            association: 'pagamentos',
            attributes: ['id', 'valor', 'status', 'data_pagamento', 'metodo_pagamento'],
            limit: 5,
            order: [['created_at', 'DESC']],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      const assinaturasComDados = assinaturas.map((assinatura) => ({
        ...assinatura.toJSON(),
        dias_restantes: assinatura.getDiasRestantes(),
        is_ativa: assinatura.isAtiva(),
        is_periodo_gratuito: assinatura.isPeriodoGratuito(),
        proxima_vencimento: assinatura.isProximaVencimento(),
      }));

      return res.json(assinaturasComDados);
    } catch (error) {
      console.error('Erro ao listar assinaturas:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Obter assinatura ativa atual
  async current(req, res) {
    try {
      const assinatura = await Assinatura.findOne({
        where: {
          user_id: req.user.id,
          status: ['ativa', 'periodo_gratuito'],
        },
        include: [
          {
            association: 'plano',
            attributes: ['id', 'nome', 'preco_mensal', 'preco_anual', 'funcionalidades', 'limite_produtos', 'limite_vendas_mes'],
          },
        ],
      });

      if (!assinatura) {
        return res.status(404).json({ erro: 'Nenhuma assinatura ativa encontrada.' });
      }

      return res.json({
        ...assinatura.toJSON(),
        dias_restantes: assinatura.getDiasRestantes(),
        is_ativa: assinatura.isAtiva(),
        is_periodo_gratuito: assinatura.isPeriodoGratuito(),
        proxima_vencimento: assinatura.isProximaVencimento(),
      });
    } catch (error) {
      console.error('Erro ao buscar assinatura atual:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Criar nova assinatura
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        plano_id: Yup.string().uuid().required('Plano é obrigatório'),
        tipo_periodo: Yup.string().oneOf(['mensal', 'anual']).default('mensal'),
        metodo_pagamento: Yup.string().oneOf(['cartao_credito', 'cartao_debito', 'pix', 'boleto']).default('cartao_credito'),
      });

      const dadosValidados = await schema.validate(req.body);
      const { plano_id, tipo_periodo, metodo_pagamento } = dadosValidados;

      // Verificar se o plano existe e está ativo
      const plano = await Plano.findByPk(plano_id);
      if (!plano || plano.status !== 'ativo') {
        return res.status(400).json({ erro: 'Plano inválido ou inativo.' });
      }

      // Verificar se usuário já tem assinatura ativa
      const assinaturaExistente = await Assinatura.findOne({
        where: {
          user_id: req.user.id,
          status: ['ativa', 'periodo_gratuito'],
        },
      });

      if (assinaturaExistente) {
        return res.status(400).json({ erro: 'Você já possui uma assinatura ativa.' });
      }

      // Calcular datas
      const dataInicio = new Date();
      let dataFim = new Date();

      // Se tem período gratuito, usar ele primeiro
      if (plano.periodo_gratuito > 0) {
        dataFim.setDate(dataFim.getDate() + plano.periodo_gratuito);
      } else {
        // Senão, calcular baseado no tipo de período
        if (tipo_periodo === 'anual') {
          dataFim.setFullYear(dataFim.getFullYear() + 1);
        } else {
          dataFim.setMonth(dataFim.getMonth() + 1);
        }
      }

      // Calcular valor
      let valor = 0;
      if (plano.periodo_gratuito === 0) {
        valor = tipo_periodo === 'anual' ? plano.getPrecoAnualComDesconto() : plano.preco_mensal;
      }

      // Criar assinatura
      const assinatura = await Assinatura.create({
        user_id: req.user.id,
        plano_id: plano.id,
        tipo_periodo,
        status: plano.periodo_gratuito > 0 ? 'periodo_gratuito' : 'ativa',
        data_inicio: dataInicio,
        data_fim: dataFim,
        data_proxima_cobranca: plano.periodo_gratuito > 0 ? dataFim : dataFim,
        valor_pago: valor,
        metodo_pagamento: plano.periodo_gratuito > 0 ? 'gratuito' : metodo_pagamento,
      });

      // Se não é período gratuito, criar pagamento
      if (plano.periodo_gratuito === 0 && valor > 0) {
        await Pagamento.create({
          assinatura_id: assinatura.id,
          valor,
          status: 'pendente',
          metodo_pagamento,
          gateway: 'mercadopago', // Definir baseado na configuração
          valor_liquido: valor,
          descricao: `Assinatura ${plano.nome} - ${tipo_periodo}`,
        });
      }

      const assinaturaCompleta = await Assinatura.findByPk(assinatura.id, {
        include: ['plano'],
      });

      return res.status(201).json({
        mensagem: 'Assinatura criada com sucesso.',
        assinatura: {
          ...assinaturaCompleta.toJSON(),
          dias_restantes: assinaturaCompleta.getDiasRestantes(),
          is_ativa: assinaturaCompleta.isAtiva(),
          is_periodo_gratuito: assinaturaCompleta.isPeriodoGratuito(),
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao criar assinatura:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Cancelar assinatura
  async cancel(req, res) {
    try {
      const { id } = req.params;
      
      const schema = Yup.object().shape({
        motivo: Yup.string().nullable(),
      });

      const { motivo } = await schema.validate(req.body);

      const assinatura = await Assinatura.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
        include: ['plano'],
      });

      if (!assinatura) {
        return res.status(404).json({ erro: 'Assinatura não encontrada.' });
      }

      if (assinatura.status === 'cancelada') {
        return res.status(400).json({ erro: 'Assinatura já foi cancelada.' });
      }

      await assinatura.cancelar(motivo);

      return res.json({
        mensagem: 'Assinatura cancelada com sucesso.',
        assinatura: {
          ...assinatura.toJSON(),
          is_ativa: false,
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao cancelar assinatura:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Alterar plano da assinatura
  async changePlan(req, res) {
    try {
      const { id } = req.params;
      
      const schema = Yup.object().shape({
        novo_plano_id: Yup.string().uuid().required('Novo plano é obrigatório'),
        tipo_periodo: Yup.string().oneOf(['mensal', 'anual']).default('mensal'),
      });

      const { novo_plano_id, tipo_periodo } = await schema.validate(req.body);

      const assinatura = await Assinatura.findOne({
        where: {
          id,
          user_id: req.user.id,
          status: ['ativa', 'periodo_gratuito'],
        },
        include: ['plano'],
      });

      if (!assinatura) {
        return res.status(404).json({ erro: 'Assinatura ativa não encontrada.' });
      }

      const novoPlano = await Plano.findByPk(novo_plano_id);
      if (!novoPlano || novoPlano.status !== 'ativo') {
        return res.status(400).json({ erro: 'Novo plano inválido ou inativo.' });
      }

      // Cancelar assinatura atual
      await assinatura.cancelar('Alteração de plano');

      // Criar nova assinatura
      const dataInicio = new Date();
      let dataFim = new Date();

      if (tipo_periodo === 'anual') {
        dataFim.setFullYear(dataFim.getFullYear() + 1);
      } else {
        dataFim.setMonth(dataFim.getMonth() + 1);
      }

      const valor = tipo_periodo === 'anual' ? novoPlano.getPrecoAnualComDesconto() : novoPlano.preco_mensal;

      const novaAssinatura = await Assinatura.create({
        user_id: req.user.id,
        plano_id: novoPlano.id,
        tipo_periodo,
        status: 'ativa',
        data_inicio: dataInicio,
        data_fim: dataFim,
        data_proxima_cobranca: dataFim,
        valor_pago: valor,
        metodo_pagamento: assinatura.metodo_pagamento,
      });

      const assinaturaCompleta = await Assinatura.findByPk(novaAssinatura.id, {
        include: ['plano'],
      });

      return res.json({
        mensagem: 'Plano alterado com sucesso.',
        assinatura: {
          ...assinaturaCompleta.toJSON(),
          dias_restantes: assinaturaCompleta.getDiasRestantes(),
          is_ativa: assinaturaCompleta.isAtiva(),
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao alterar plano:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Reativar assinatura
  async reactivate(req, res) {
    try {
      const { id } = req.params;

      const assinatura = await Assinatura.findOne({
        where: {
          id,
          user_id: req.user.id,
        },
        include: ['plano'],
      });

      if (!assinatura) {
        return res.status(404).json({ erro: 'Assinatura não encontrada.' });
      }

      if (assinatura.status !== 'suspensa') {
        return res.status(400).json({ erro: 'Apenas assinaturas suspensas podem ser reativadas.' });
      }

      await assinatura.reativar();

      return res.json({
        mensagem: 'Assinatura reativada com sucesso.',
        assinatura: {
          ...assinatura.toJSON(),
          is_ativa: assinatura.isAtiva(),
        },
      });
    } catch (error) {
      console.error('Erro ao reativar assinatura:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Listar todas as assinaturas (Admin)
  async listAll(req, res) {
    try {
      const { page = 1, limit = 20, status, plano_id } = req.query;

      const where = {};
      if (status) where.status = status;
      if (plano_id) where.plano_id = plano_id;

      const offset = (page - 1) * limit;

      const assinaturas = await Assinatura.findAndCountAll({
        where,
        include: [
          {
            association: 'usuario',
            attributes: ['id', 'nome', 'email'],
          },
          {
            association: 'plano',
            attributes: ['id', 'nome', 'preco_mensal'],
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return res.json({
        assinaturas: assinaturas.rows,
        total: assinaturas.count,
        pages: Math.ceil(assinaturas.count / limit),
        current_page: parseInt(page),
      });
    } catch (error) {
      console.error('Erro ao listar todas as assinaturas:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }
}

export default new AssinaturaController();

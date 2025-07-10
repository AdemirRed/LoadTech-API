import * as Yup from 'yup';
import Plano from '../models/Plano';
import Assinatura from '../models/Assinatura';

class PlanoController {
  // Listar todos os planos ativos
  async index(req, res) {
    try {
      const planos = await Plano.scope('ativos').findAll({
        order: [
          ['destaque', 'DESC'],
          ['ordem_exibicao', 'ASC'],
          ['preco_mensal', 'ASC'],
        ],
      });

      // Adicionar dados calculados
      const planosComDados = planos.map((plano) => ({
        ...plano.toJSON(),
        preco_anual_com_desconto: plano.getPrecoAnualComDesconto(),
        economia_anual: plano.getEconomiaAnual(),
        tem_periodo_gratuito: plano.temPeriodoGratuito(),
      }));

      return res.json(planosComDados);
    } catch (error) {
      console.error('Erro ao listar planos:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Obter detalhes de um plano específico
  async show(req, res) {
    try {
      const { id } = req.params;

      const plano = await Plano.findByPk(id);

      if (!plano) {
        return res.status(404).json({ erro: 'Plano não encontrado.' });
      }

      if (plano.status !== 'ativo') {
        return res.status(400).json({ erro: 'Plano não está disponível.' });
      }

      return res.json({
        ...plano.toJSON(),
        preco_anual_com_desconto: plano.getPrecoAnualComDesconto(),
        economia_anual: plano.getEconomiaAnual(),
        tem_periodo_gratuito: plano.temPeriodoGratuito(),
      });
    } catch (error) {
      console.error('Erro ao buscar plano:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Criar novo plano (Admin)
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        nome: Yup.string().required('Nome é obrigatório'),
        descricao: Yup.string().nullable(),
        preco_mensal: Yup.number().min(0, 'Preço deve ser positivo').required('Preço mensal é obrigatório'),
        preco_anual: Yup.number().min(0, 'Preço anual deve ser positivo').nullable(),
        desconto_anual: Yup.number().min(0).max(100, 'Desconto deve estar entre 0 e 100').default(0),
        limite_produtos: Yup.number().min(0).nullable(),
        limite_vendas_mes: Yup.number().min(0).nullable(),
        taxa_transacao: Yup.number().min(0).max(100, 'Taxa deve estar entre 0 e 100').default(0),
        funcionalidades: Yup.array().of(Yup.string()).default([]),
        periodo_gratuito: Yup.number().min(0, 'Período gratuito deve ser positivo').default(0),
        destaque: Yup.boolean().default(false),
        ordem_exibicao: Yup.number().default(0),
      });

      const dadosValidados = await schema.validate(req.body);

      const plano = await Plano.create(dadosValidados);

      return res.status(201).json({
        mensagem: 'Plano criado com sucesso.',
        plano,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao criar plano:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Atualizar plano (Admin)
  async update(req, res) {
    try {
      const { id } = req.params;

      const schema = Yup.object().shape({
        nome: Yup.string(),
        descricao: Yup.string().nullable(),
        preco_mensal: Yup.number().min(0, 'Preço deve ser positivo'),
        preco_anual: Yup.number().min(0, 'Preço anual deve ser positivo').nullable(),
        desconto_anual: Yup.number().min(0).max(100, 'Desconto deve estar entre 0 e 100'),
        limite_produtos: Yup.number().min(0).nullable(),
        limite_vendas_mes: Yup.number().min(0).nullable(),
        taxa_transacao: Yup.number().min(0).max(100, 'Taxa deve estar entre 0 e 100'),
        funcionalidades: Yup.array().of(Yup.string()),
        status: Yup.string().oneOf(['ativo', 'inativo']),
        periodo_gratuito: Yup.number().min(0, 'Período gratuito deve ser positivo'),
        destaque: Yup.boolean(),
        ordem_exibicao: Yup.number(),
      });

      const dadosValidados = await schema.validate(req.body);

      const plano = await Plano.findByPk(id);

      if (!plano) {
        return res.status(404).json({ erro: 'Plano não encontrado.' });
      }

      await plano.update(dadosValidados);

      return res.json({
        mensagem: 'Plano atualizado com sucesso.',
        plano,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao atualizar plano:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Excluir plano (Admin)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const plano = await Plano.findByPk(id);

      if (!plano) {
        return res.status(404).json({ erro: 'Plano não encontrado.' });
      }

      // Verificar se existem assinaturas ativas com este plano
      const assinaturasAtivas = await Assinatura.count({
        where: {
          plano_id: id,
          status: ['ativa', 'periodo_gratuito'],
        },
      });

      if (assinaturasAtivas > 0) {
        return res.status(400).json({
          erro: 'Não é possível excluir um plano com assinaturas ativas.',
        });
      }

      await plano.destroy();

      return res.json({
        mensagem: 'Plano excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Comparar planos
  async compare(req, res) {
    try {
      const { plano_ids } = req.query;

      if (!plano_ids) {
        return res.status(400).json({ erro: 'IDs dos planos são obrigatórios.' });
      }

      const ids = plano_ids.split(',');

      const planos = await Plano.findAll({
        where: {
          id: ids,
          status: 'ativo',
        },
        order: [['preco_mensal', 'ASC']],
      });

      if (planos.length === 0) {
        return res.status(404).json({ erro: 'Nenhum plano encontrado.' });
      }

      const comparacao = planos.map((plano) => ({
        ...plano.toJSON(),
        preco_anual_com_desconto: plano.getPrecoAnualComDesconto(),
        economia_anual: plano.getEconomiaAnual(),
        tem_periodo_gratuito: plano.temPeriodoGratuito(),
      }));

      return res.json(comparacao);
    } catch (error) {
      console.error('Erro ao comparar planos:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Obter estatísticas dos planos (Admin)
  async stats(req, res) {
    try {
      const estatisticas = await Plano.findAll({
        attributes: [
          'id',
          'nome',
          'preco_mensal',
          'status',
        ],
        include: [
          {
            association: 'assinaturas',
            attributes: ['status'],
            required: false,
          },
        ],
      });

      const stats = estatisticas.map((plano) => {
        const assinaturas = plano.assinaturas || [];
        return {
          id: plano.id,
          nome: plano.nome,
          preco_mensal: plano.preco_mensal,
          status: plano.status,
          total_assinaturas: assinaturas.length,
          assinaturas_ativas: assinaturas.filter((a) => ['ativa', 'periodo_gratuito'].includes(a.status)).length,
          assinaturas_canceladas: assinaturas.filter((a) => a.status === 'cancelada').length,
          receita_mensal_estimada: assinaturas
            .filter((a) => a.status === 'ativa')
            .length * parseFloat(plano.preco_mensal),
        };
      });

      return res.json(stats);
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }
}

export default new PlanoController();

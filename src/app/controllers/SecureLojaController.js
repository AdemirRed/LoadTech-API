import { encryptResponse, decryptRequest } from '../middlewares/cryptoMiddleware.js';
import Loja from '../models/Loja.js';
import User from '../models/User.js';

/**
 * Controller de exemplo para demonstrar uso de criptografia manual
 * Este controller mostra como usar criptografia em situações específicas
 */

class SecureLojaController {
  /**
   * Obter dados sensíveis da loja (criptografado manualmente)
   * GET /api/secure/loja/:slug
   */
  async getDadosSensiveis(req, res) {
    try {
      const { slug } = req.params;
      
      // Verificar autenticação (apenas proprietário pode ver dados sensíveis)
      if (!req.user) {
        return res.status(401).json({ erro: 'Autenticação necessária' });
      }

      const loja = await Loja.findOne({
        where: { slug, user_id: req.user.id }
      });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada' });
      }

      // Dados sensíveis que devem ser sempre criptografados
      const dadosSensiveis = {
        id: loja.id,
        user_id: loja.user_id,
        configuracoes_pagamento: loja.configuracoes_pagamento,
        analytics_code: loja.analytics_code,
        endereco_completo: loja.endereco,
        created_at: loja.created_at,
        updated_at: loja.updated_at,
        // Dados administrativos
        total_vendas: 1250.50, // Exemplo
        comissao_plataforma: 62.53,
        proxima_cobranca: '2025-08-12'
      };

      // Forçar criptografia mesmo se middleware estiver desabilitado
      const encryptedData = encryptResponse(dadosSensiveis, req);

      return res.json({
        encrypted: true,
        payload: encryptedData
      });

    } catch (error) {
      console.error('Erro ao buscar dados sensíveis:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualizar configurações sensíveis (recebe dados criptografados)
   * PUT /api/secure/loja/:slug/config
   */
  async atualizarConfigSensivel(req, res) {
    try {
      const { slug } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ erro: 'Autenticação necessária' });
      }

      const loja = await Loja.findOne({
        where: { slug, user_id: req.user.id }
      });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada' });
      }

      // Se dados vieram criptografados, descriptografar manualmente
      let dadosConfig = req.body;
      if (req.body.encrypted && req.body.payload) {
        dadosConfig = decryptRequest(req.body.payload, req);
      }

      // Validar estrutura dos dados
      const { configuracoes_pagamento, analytics_code, endereco_completo } = dadosConfig;

      // Atualizar apenas campos permitidos
      if (configuracoes_pagamento) {
        await loja.configurarPagamento(configuracoes_pagamento);
      }

      if (analytics_code) {
        loja.analytics_code = analytics_code;
      }

      if (endereco_completo) {
        loja.endereco = endereco_completo;
      }

      await loja.save();

      // Resposta criptografada
      const resposta = {
        message: 'Configurações atualizadas com sucesso',
        loja_id: loja.id,
        timestamp: new Date().toISOString()
      };

      const encryptedResponse = encryptResponse(resposta, req);

      return res.json({
        encrypted: true,
        payload: encryptedResponse
      });

    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }

  /**
   * Relatório financeiro (sempre criptografado)
   * GET /api/secure/loja/:slug/financeiro
   */
  async getRelatorioFinanceiro(req, res) {
    try {
      const { slug } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ erro: 'Autenticação necessária' });
      }

      const loja = await Loja.findOne({
        where: { slug, user_id: req.user.id }
      });

      if (!loja) {
        return res.status(404).json({ erro: 'Loja não encontrada' });
      }

      // Simular dados financeiros sensíveis
      const relatorio = {
        periodo: {
          inicio: '2025-01-01',
          fim: '2025-07-12'
        },
        vendas: {
          total_bruto: 15430.80,
          total_liquido: 14179.23,
          quantidade: 127,
          ticket_medio: 121.50
        },
        taxas: {
          comissao_plataforma: 771.54,
          taxa_pagamento: 480.03,
          total_taxas: 1251.57
        },
        assinatura: {
          plano: 'Básico',
          valor_mensal: 29.90,
          proximo_vencimento: '2025-08-12',
          status: 'ativa'
        },
        configuracoes_pagamento: loja.configuracoes_pagamento,
        contas_bancarias: [
          {
            banco: 'Banco do Brasil',
            agencia: '1234-5',
            conta: '98765-4',
            tipo: 'corrente'
          }
        ]
      };

      // SEMPRE criptografar dados financeiros
      const encryptedData = encryptResponse(relatorio, req);

      return res.json({
        encrypted: true,
        payload: encryptedData,
        warning: 'Dados financeiros sempre criptografados'
      });

    } catch (error) {
      console.error('Erro ao gerar relatório financeiro:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor' });
    }
  }
}

const secureLojaController = new SecureLojaController();
export default secureLojaController;

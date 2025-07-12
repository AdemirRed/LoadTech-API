import Loja from '../models/Loja.js';
import User from '../models/User.js';

class PublicShopController {
  /**
   * API para obter dados completos da loja
   * GET /api/loja/:slug
   */
  async getLojaData(req, res) {
    try {
      const { slug } = req.params;
      
      // Validação de entrada
      if (!slug || typeof slug !== 'string' || slug.length > 100) {
        return res.status(400).json({ 
          success: false,
          erro: 'Slug inválido' 
        });
      }
      
      // Sanitizar slug (apenas alfanuméricos e hífen)
      const slugLimpo = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (slugLimpo !== slug) {
        return res.status(400).json({ 
          success: false,
          erro: 'Slug contém caracteres inválidos' 
        });
      }
      
      const loja = await Loja.findOne({
        where: { slug: slugLimpo, status: 'ativa' },
        // Excluir campos sensíveis na consulta
        attributes: { 
          exclude: [
            'user_id', 
            'configuracoes_pagamento', 
            'analytics_code',
            'created_at',
            'updated_at'
          ] 
        }
      });
      
      if (!loja) {
        return res.status(404).json({ 
          success: false,
          erro: 'Loja não encontrada ou inativa' 
        });
      }
      
      // Buscar dados do proprietário (apenas se necessário e autorizado)
      const proprietario = await User.findByPk(loja.user_id, {
        attributes: ['nome', 'created_at']
      });
      
      const dadosLoja = {
        ...loja.getDadosPublicos(),
        // Dados do proprietário apenas se explicitamente permitido
        // TODO: Implementar configuração de privacidade do proprietário
        proprietario: proprietario ? {
          nome: proprietario.nome,
          membro_desde: proprietario.created_at?.toISOString()?.split('T')[0] // Apenas ano-mês-dia
        } : null,
        url_base: loja.getUrl(),
        tem_dominio_personalizado: loja.temDominioPersonalizado()
      };
      
      return res.json({
        success: true,
        data: dadosLoja
      });
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      return res.status(500).json({ 
        success: false,
        erro: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * API para verificar se loja existe por slug
   * GET /api/loja/:slug/verificar
   */
  async verificarLoja(req, res) {
    try {
      const { slug } = req.params;
      
      // Validação de entrada
      if (!slug || typeof slug !== 'string' || slug.length > 100) {
        return res.status(400).json({ 
          success: false,
          erro: 'Slug inválido' 
        });
      }
      
      // Sanitizar slug
      const slugLimpo = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (slugLimpo !== slug) {
        return res.status(400).json({ 
          success: false,
          erro: 'Slug contém caracteres inválidos' 
        });
      }
      
      const loja = await Loja.findOne({
        where: { slug: slugLimpo, status: 'ativa' },
        attributes: ['slug', 'nome_loja', 'status']
      });
      
      return res.json({
        success: true,
        existe: !!loja,
        data: loja ? {
          slug: loja.slug,
          nome_loja: loja.nome_loja,
          status: loja.status
        } : null
      });
    } catch (error) {
      console.error('Erro ao verificar loja:', error);
      return res.status(500).json({ 
        success: false,
        erro: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * API para detectar loja por domínio/subdomínio
   * GET /api/detectar-loja
   */
  async detectarLoja(req, res) {
    try {
      const host = req.get('host') || '';
      
      // Validação básica do host
      if (host.length > 255) {
        return res.status(400).json({ 
          success: false,
          erro: 'Host inválido' 
        });
      }
      
      let loja = null;
      
      // 1. Tentar por domínio personalizado
      loja = await Loja.findOne({
        where: { 
          dominio_personalizado: host,
          status: 'ativa'
        }
      });
      
      // 2. Tentar por subdomínio
      if (!loja) {
        const subdomain = this.getSubdomain(host);
        if (subdomain) {
          loja = await Loja.findOne({
            where: { 
              slug: subdomain,
              status: 'ativa'
            }
          });
        }
      }
      
      return res.json({
        success: true,
        encontrada: !!loja,
        host: host,
        data: loja ? loja.getDadosPublicos() : null
      });
    } catch (error) {
      console.error('Erro ao detectar loja:', error);
      return res.status(500).json({ 
        success: false,
        erro: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * API para obter informações de contato da loja
   * GET /api/loja/:slug/contato
   */
  async getContato(req, res) {
    try {
      const { slug } = req.params;
      
      // Validação de entrada
      if (!slug || typeof slug !== 'string' || slug.length > 100) {
        return res.status(400).json({ 
          success: false,
          erro: 'Slug inválido' 
        });
      }
      
      // Sanitizar slug
      const slugLimpo = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (slugLimpo !== slug) {
        return res.status(400).json({ 
          success: false,
          erro: 'Slug contém caracteres inválidos' 
        });
      }
      
      const loja = await Loja.findOne({
        where: { slug: slugLimpo, status: 'ativa' },
        attributes: [
          'nome_loja', 'telefone_loja', 'email_loja', 
          'whatsapp', 'endereco', 'redes_sociais'
        ]
      });
      
      if (!loja) {
        return res.status(404).json({ 
          success: false,
          erro: 'Loja não encontrada' 
        });
      }
      
      return res.json({
        success: true,
        data: loja.getDadosContato() // Usar método seguro
      });
    } catch (error) {
      console.error('Erro ao buscar contato da loja:', error);
      return res.status(500).json({ 
        success: false,
        erro: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * Redirect para frontend da loja
   * GET /ir/:slug
   */
  async redirectToShop(req, res) {
    try {
      const { slug } = req.params;
      
      // Validação de entrada
      if (!slug || typeof slug !== 'string' || slug.length > 100) {
        return res.status(400).json({ 
          success: false,
          erro: 'Slug inválido' 
        });
      }
      
      // Sanitizar slug
      const slugLimpo = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (slugLimpo !== slug) {
        return res.status(400).json({ 
          success: false,
          erro: 'Slug contém caracteres inválidos' 
        });
      }
      
      const loja = await Loja.findOne({
        where: { slug: slugLimpo, status: 'ativa' },
        attributes: ['slug', 'dominio_personalizado', 'certificado_ssl']
      });
      
      if (!loja) {
        return res.status(404).json({ 
          success: false,
          erro: 'Loja não encontrada' 
        });
      }
      
      // Determinar URL para redirect
      let redirectUrl;
      if (loja.dominio_personalizado) {
        const protocolo = loja.certificado_ssl ? 'https' : 'http';
        redirectUrl = `${protocolo}://${loja.dominio_personalizado}`;
      } else {
        // Redirect para o frontend com o slug
        redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/loja/${loja.slug}`;
      }
      
      return res.redirect(301, redirectUrl);
    } catch (error) {
      console.error('Erro ao redirecionar para loja:', error);
      return res.status(500).json({ 
        success: false,
        erro: 'Erro interno do servidor' 
      });
    }
  }

  /**
   * Cadastro de cliente na loja multi-tenant
   * POST /loja/:slug/cliente/cadastro
   */
  async cadastroCliente(req, res) {
    const client = req.lojaDbClient;
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }
    try {
      // Verifica se já existe
      const existe = await client.query('SELECT 1 FROM clientes WHERE email = $1', [email]);
      if (existe.rowCount > 0) {
        return res.status(400).json({ erro: 'E-mail já cadastrado.' });
      }
      // Cria cliente
      await client.query('INSERT INTO clientes (nome, email, senha) VALUES ($1, $2, $3)', [nome, email, senha]);
      return res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso.' });
    } catch (error) {
      return res.status(500).json({ erro: 'Erro ao cadastrar cliente.' });
    } finally {
      await client.end();
    }
  }

  /**
   * Login de cliente na loja multi-tenant
   * POST /loja/:slug/cliente/login
   */
  async loginCliente(req, res) {
    const client = req.lojaDbClient;
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }
    try {
      const result = await client.query('SELECT * FROM clientes WHERE email = $1 AND senha = $2', [email, senha]);
      if (result.rowCount === 0) {
        return res.status(401).json({ erro: 'Credenciais inválidas.' });
      }
      return res.json({ mensagem: 'Login realizado com sucesso.', cliente: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ erro: 'Erro ao realizar login.' });
    } finally {
      await client.end();
    }
  }

  /**
   * Utilitário para extrair subdomínio
   */
  getSubdomain(host) {
    const parts = host.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  }
}

const publicShopController = new PublicShopController();
export default publicShopController;

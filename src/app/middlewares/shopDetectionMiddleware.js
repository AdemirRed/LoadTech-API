import Loja from '../models/Loja.js';

/**
 * Middleware para detectar lojas por domínio ou slug
 * Captura URLs como:
 * - universoredblack.com.br/loja/ademir
 * - ademir.universoredblack.com.br
 * - loja-custom.com (domínio personalizado)
 */
class ShopDetectionMiddleware {
  /**
   * Middleware principal para detectar loja
   */
  static async detectShop(req, res, next) {
    try {
      let loja = null;
      const host = req.get('host') || '';
      const subdomain = ShopDetectionMiddleware.getSubdomain(host);
      
      // 1. Primeiro tenta por domínio personalizado
      if (host && !subdomain) {
        loja = await Loja.findOne({
          where: { 
            dominio_personalizado: host,
            status: 'ativa'
          }
        });
      }
      
      // 2. Depois tenta por subdomínio
      if (!loja && subdomain) {
        loja = await Loja.findOne({
          where: { 
            slug: subdomain,
            status: 'ativa'
          }
        });
      }
      
      // 3. Por último, tenta por slug na URL (/loja/:slug)
      if (!loja && req.params.slug) {
        loja = await Loja.findOne({
          where: { 
            slug: req.params.slug,
            status: 'ativa'
          }
        });
      }
      
      if (loja) {
        req.loja = loja;
        req.isShopPage = true;
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de detecção de loja:', error);
      next();
    }
  }
  
  /**
   * Extrai subdomínio do host
   */
  static getSubdomain(host) {
    const parts = host.split('.');
    // Se tem 3 ou mais partes (sub.domain.com), pega a primeira
    if (parts.length >= 3) {
      return parts[0];
    }
    return null;
  }
  
  /**
   * Middleware específico para páginas de loja
   * Usado em rotas como /loja/:slug/*
   */
  static async requireShop(req, res, next) {
    await ShopDetectionMiddleware.detectShop(req, res, () => {
      if (!req.loja) {
        return res.status(404).render('shop-not-found', {
          message: 'Loja não encontrada ou inativa'
        });
      }
      next();
    });
  }
}

export default ShopDetectionMiddleware;

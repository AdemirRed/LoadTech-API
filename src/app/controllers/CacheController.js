import { cache, redisClient } from '../../config/redis.js';

class CacheController {
  /**
   * Obter estatísticas do cache
   */
  async stats(req, res) {
    try {
      const info = await cache.info();
      const keys = await cache.keys('cache:*');
      const rateLimitKeys = await cache.keys('rate_limit:*');
      
      return res.json({
        status: 'success',
        redis: {
          connected: redisClient.isReady,
          info: info ? info.split('\r\n').slice(0, 10) : null, // Primeiras 10 linhas
        },
        cache: {
          total_keys: keys.length,
          rate_limit_keys: rateLimitKeys.length,
          sample_keys: keys.slice(0, 10) // Primeiras 10 chaves como exemplo
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas do cache:', error.message);
      return res.status(500).json({
        status: 'error',
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Limpar todo o cache
   */
  async clear(req, res) {
    try {
      const { pattern } = req.query;
      
      if (pattern) {
        // Limpar por padrão específico
        const keys = await cache.keys(pattern);
        let deletedCount = 0;
        
        for (const key of keys) {
          const deleted = await cache.del(key);
          if (deleted) deletedCount++;
        }
        
        return res.json({
          status: 'success',
          message: `Cache limpo com padrão: ${pattern}`,
          deleted_keys: deletedCount,
          timestamp: new Date().toISOString()
        });
      } else {
        // Limpar todo o cache
        const keys = await cache.keys('cache:*');
        let deletedCount = 0;
        
        for (const key of keys) {
          const deleted = await cache.del(key);
          if (deleted) deletedCount++;
        }
        
        return res.json({
          status: 'success',
          message: 'Todo o cache foi limpo',
          deleted_keys: deletedCount,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error.message);
      return res.status(500).json({
        status: 'error',
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Obter valor específico do cache
   */
  async get(req, res) {
    try {
      const { key } = req.params;
      
      if (!key) {
        return res.status(400).json({
          status: 'error',
          erro: 'Chave é obrigatória'
        });
      }
      
      const value = await cache.get(key);
      const exists = await cache.exists(key);
      
      return res.json({
        status: 'success',
        key,
        exists,
        value,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao obter cache:', error.message);
      return res.status(500).json({
        status: 'error',
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Definir valor no cache
   */
  async set(req, res) {
    try {
      const { key } = req.params;
      const { value, ttl = 3600 } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({
          status: 'error',
          erro: 'Chave e valor são obrigatórios'
        });
      }
      
      const success = await cache.set(key, value, ttl);
      
      return res.json({
        status: success ? 'success' : 'error',
        message: success ? 'Valor definido no cache' : 'Erro ao definir valor',
        key,
        ttl,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao definir cache:', error.message);
      return res.status(500).json({
        status: 'error',
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }

  /**
   * Deletar chave específica do cache
   */
  async delete(req, res) {
    try {
      const { key } = req.params;
      
      if (!key) {
        return res.status(400).json({
          status: 'error',
          erro: 'Chave é obrigatória'
        });
      }
      
      const deleted = await cache.del(key);
      
      return res.json({
        status: 'success',
        message: deleted ? 'Chave deletada' : 'Chave não encontrada',
        key,
        deleted,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao deletar cache:', error.message);
      return res.status(500).json({
        status: 'error',
        erro: 'Erro interno do servidor',
        message: error.message
      });
    }
  }
}

export default new CacheController();

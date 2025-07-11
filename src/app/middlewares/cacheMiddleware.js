import { cache } from '../../config/redis.js';

/**
 * Middleware de cache para rotas GET
 * @param {number} ttlSeconds - Tempo de vida do cache em segundos (padrão: 5 minutos)
 */
const cacheMiddleware = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Só aplica cache em métodos GET
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Gera chave única baseada na URL e query params
      const cacheKey = `cache:${req.originalUrl}`;
      
      // Tenta obter do cache
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`🚀 Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`📦 Cache MISS: ${cacheKey}`);

      // Intercepta a resposta para salvar no cache
      const originalJson = res.json;
      res.json = function(data) {
        // Salva no cache apenas se for resposta de sucesso
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttlSeconds).catch(err => {
            console.warn('⚠️  Erro ao salvar cache:', err.message);
          });
        }
        
        // Chama o método original
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.warn('⚠️  Erro no middleware de cache:', error.message);
      next(); // Continua sem cache em caso de erro
    }
  };
};

/**
 * Middleware para invalidar cache
 * @param {string|string[]} patterns - Padrões de chave para invalidar
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    try {
      const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
      
      for (const pattern of patternsArray) {
        const keys = await cache.keys(pattern);
        for (const key of keys) {
          await cache.del(key);
        }
        console.log(`🗑️  Cache invalidado: ${pattern} (${keys.length} chaves)`);
      }
    } catch (error) {
      console.warn('⚠️  Erro ao invalidar cache:', error.message);
    }
    
    next();
  };
};

/**
 * Middleware de rate limiting usando Redis
 * @param {number} maxRequests - Máximo de requisições
 * @param {number} windowSeconds - Janela de tempo em segundos
 */
const rateLimitMiddleware = (maxRequests = 100, windowSeconds = 900) => {
  return async (req, res, next) => {
    try {
      // Usa IP do cliente como identificador
      const clientId = req.ip || req.connection.remoteAddress;
      const key = `rate_limit:${clientId}`;
      
      const currentRequests = await cache.incr(key, windowSeconds);
      
      // Adiciona headers informativos
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentRequests));
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowSeconds * 1000).toISOString());
      
      if (currentRequests > maxRequests) {
        console.warn(`🚫 Rate limit excedido para IP: ${clientId} (${currentRequests}/${maxRequests})`);
        return res.status(429).json({
          erro: 'Muitas requisições. Tente novamente mais tarde.',
          limite: maxRequests,
          janela: `${windowSeconds} segundos`,
          tentativas: currentRequests
        });
      }
      
      next();
    } catch (error) {
      console.warn('⚠️  Erro no rate limiting:', error.message);
      next(); // Continua sem rate limiting em caso de erro
    }
  };
};

export { cacheMiddleware, invalidateCache, rateLimitMiddleware };

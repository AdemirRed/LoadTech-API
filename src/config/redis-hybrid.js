import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

// Cliente Redis para produção (Upstash) ou desenvolvimento (local)
let redisClient;
let isUpstash = false;

if (process.env.NODE_ENV === 'production' && process.env.UPSTASH_REDIS_REST_URL) {
  // 🌐 PRODUÇÃO: Upstash Redis (HTTP REST)
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  isUpstash = true;
  console.log('🌐 Redis: Usando Upstash (produção)');
} else {
  // 🏠 DESENVOLVIMENTO: Redis local
  const { createClient } = await import('redis');
  
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.error('❌ Redis: Máximo de tentativas de reconexão atingido');
          return new Error('Máximo de tentativas de reconexão atingido');
        }
        console.log(`🔄 Redis: Tentativa de reconexão ${retries + 1}`);
        return Math.min(retries * 50, 500);
      }
    },
    password: process.env.REDIS_PASSWORD || undefined,
    legacyMode: false
  });

  // Event listeners para Redis local
  redisClient.on('connect', () => {
    console.log('🟢 Redis: Conectando...');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis: Conectado e pronto para uso (local)');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis: Erro de conexão:', err.message);
  });

  redisClient.on('end', () => {
    console.log('🔴 Redis: Conexão encerrada');
  });
}

// Conectar ao Redis (apenas para Redis local)
const connectRedis = async () => {
  try {
    if (isUpstash) {
      // Upstash não precisa conectar
      console.log('✅ Upstash Redis: Pronto para uso');
      return true;
    } else {
      // Redis local precisa conectar
      await redisClient.connect();
      return true;
    }
  } catch (error) {
    console.error('❌ Redis: Falha na conexão:', error.message);
    return false;
  }
};

// Função para desconectar
const disconnectRedis = async () => {
  try {
    if (!isUpstash) {
      await redisClient.quit();
      console.log('✅ Redis: Desconectado com sucesso');
    }
  } catch (error) {
    console.error('❌ Redis: Erro ao desconectar:', error.message);
  }
};

// Funções utilitárias universais (funcionam com Upstash e Redis local)
const cache = {
  // Definir cache com TTL
  set: async (key, value, ttlSeconds = 3600) => {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (isUpstash) {
        // Upstash Redis
        await redisClient.setex(key, ttlSeconds, serializedValue);
      } else {
        // Redis local
        await redisClient.setEx(key, ttlSeconds, serializedValue);
      }
      return true;
    } catch (error) {
      console.error('❌ Redis: Erro ao definir cache:', error.message);
      return false;
    }
  },

  // Obter cache
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Redis: Erro ao obter cache:', error.message);
      return null;
    }
  },

  // Deletar cache
  del: async (key) => {
    try {
      const result = await redisClient.del(key);
      return result > 0;
    } catch (error) {
      console.error('❌ Redis: Erro ao deletar cache:', error.message);
      return false;
    }
  },

  // Verificar se existe
  exists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Redis: Erro ao verificar existência:', error.message);
      return false;
    }
  },

  // Incrementar contador
  incr: async (key, ttlSeconds = 3600) => {
    try {
      const value = await redisClient.incr(key);
      if (value === 1) {
        // Se é a primeira vez, define TTL
        await redisClient.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      console.error('❌ Redis: Erro ao incrementar:', error.message);
      return 0;
    }
  },

  // Listar chaves
  keys: async (pattern = '*') => {
    try {
      if (isUpstash) {
        // Upstash pode ter limitações com KEYS
        console.warn('⚠️  Upstash: KEYS pode ser limitado em produção');
        return await redisClient.keys(pattern);
      } else {
        return await redisClient.keys(pattern);
      }
    } catch (error) {
      console.error('❌ Redis: Erro ao listar chaves:', error.message);
      return [];
    }
  },

  // Obter informações
  info: async () => {
    try {
      if (isUpstash) {
        // Upstash pode não ter INFO command
        return 'Upstash Redis - INFO não disponível';
      } else {
        return await redisClient.info();
      }
    } catch (error) {
      console.error('❌ Redis: Erro ao obter informações:', error.message);
      return null;
    }
  }
};

export { redisClient, connectRedis, disconnectRedis, cache, isUpstash };

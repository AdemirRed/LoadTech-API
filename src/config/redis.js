import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do cliente Redis
const redisClient = createClient({
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

// Event listeners para monitorar conexão
redisClient.on('connect', () => {
  console.log('🟢 Redis: Conectando...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Conectado e pronto para uso');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis: Erro de conexão:', err.message);
});

redisClient.on('end', () => {
  console.log('🔴 Redis: Conexão encerrada');
});

// Conectar ao Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('❌ Redis: Falha na conexão:', error.message);
    return false;
  }
};

// Função para desconectar (útil para testes e encerramento)
const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    console.log('✅ Redis: Desconectado com sucesso');
  } catch (error) {
    console.error('❌ Redis: Erro ao desconectar:', error.message);
  }
};

// Funções utilitárias para cache
const cache = {
  // Definir cache com TTL (Time To Live)
  set: async (key, value, ttlSeconds = 3600) => {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.setEx(key, ttlSeconds, serializedValue);
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

  // Incrementar contador (útil para rate limiting)
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

  // Listar todas as chaves (cuidado em produção!)
  keys: async (pattern = '*') => {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      console.error('❌ Redis: Erro ao listar chaves:', error.message);
      return [];
    }
  },

  // Obter informações do Redis
  info: async () => {
    try {
      return await redisClient.info();
    } catch (error) {
      console.error('❌ Redis: Erro ao obter informações:', error.message);
      return null;
    }
  }
};

export { redisClient, connectRedis, disconnectRedis, cache };

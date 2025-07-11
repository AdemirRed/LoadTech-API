/**
 * 💾 CACHE EM MEMÓRIA SIMPLES
 * Fallback quando Redis não está disponível
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  // Definir cache com TTL
  set(key, value, ttlSeconds = 3600) {
    try {
      // Limpar timer existente
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
      }

      // Salvar valor
      this.cache.set(key, value);

      // Definir expiração
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttlSeconds * 1000);

      this.timers.set(key, timer);
      return true;
    } catch (error) {
      console.error('❌ MemoryCache: Erro ao definir cache:', error.message);
      return false;
    }
  }

  // Obter cache
  get(key) {
    try {
      return this.cache.get(key) || null;
    } catch (error) {
      console.error('❌ MemoryCache: Erro ao obter cache:', error.message);
      return null;
    }
  }

  // Verificar se existe
  exists(key) {
    return this.cache.has(key);
  }

  // Deletar
  del(key) {
    try {
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      return this.cache.delete(key);
    } catch (error) {
      console.error('❌ MemoryCache: Erro ao deletar cache:', error.message);
      return false;
    }
  }

  // Listar chaves
  keys(pattern = '*') {
    const keys = Array.from(this.cache.keys());
    
    if (pattern === '*') {
      return keys;
    }
    
    // Simples pattern matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return keys.filter(key => regex.test(key));
  }

  // Estatísticas
  info() {
    return `Memory Cache - ${this.cache.size} keys`;
  }

  // Limpar tudo
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }
}

export default MemoryCache;

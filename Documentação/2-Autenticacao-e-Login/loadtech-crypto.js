/**
 * 🔐 LoadTech Crypto - Utilitário de Criptografia de Ponta a Ponta V2.0
 * 
 * Como usar:
 * 1. npm install crypto-js
 * 2. Copiar este arquivo para src/utils/loadtech-crypto.js
 * 3. Importar: import loadtechCrypto from '@/utils/loadtech-crypto'
 * 4. Usar: await loadtechCrypto.secureRequest('/usuario', { headers: { Authorization: 'Bearer token' } })
 */

import CryptoJS from 'crypto-js';

class LoadTechCrypto {
  constructor() {
    this.version = '2.0';
    this.sessionId = this.generateSessionId();
    this.debug = process.env.NODE_ENV === 'development';
    
    if (this.debug) {
      console.log('🔐 LoadTech Crypto inicializado - Session ID:', this.sessionId);
    }
  }

  /**
   * Gerar session ID único para esta sessão
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Criptografar dados para enviar ao backend
   * @param {Object} data - Dados para criptografar
   * @returns {string} - Dados criptografados
   */
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.sessionId).toString();
      
      if (this.debug) {
        console.log('🔐 Dados criptografados:', {
          original: jsonString.length + ' chars',
          encrypted: encrypted.length + ' chars',
          sessionId: this.sessionId.substring(0, 8) + '...'
        });
      }
      
      return encrypted;
    } catch (error) {
      console.error('❌ Erro ao criptografar:', error);
      throw new Error('Falha na criptografia dos dados');
    }
  }

  /**
   * Descriptografar dados recebidos do backend
   * @param {string} encryptedData - Dados criptografados
   * @returns {Object} - Dados descriptografados
   */
  decrypt(encryptedData) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.sessionId);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Dados descriptografados estão vazios - Session ID pode estar incorreto');
      }
      
      const data = JSON.parse(jsonString);
      
      if (this.debug) {
        console.log('🔓 Dados descriptografados:', {
          decrypted: jsonString.length + ' chars',
          sessionId: this.sessionId.substring(0, 8) + '...'
        });
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia dos dados');
    }
  }

  /**
   * Wrapper para requisições automáticas com criptografia
   * @param {string} url - URL da API
   * @param {Object} options - Opções do fetch
   * @returns {Promise<Object>} - Dados descriptografados ou normais
   */
  async secureRequest(url, options = {}) {
    try {
      // Se há body e é um objeto, criptografar
      if (options.body && typeof options.body === 'object') {
        if (this.debug) {
          console.log('🔐 Criptografando body para:', url);
        }
        
        const encryptedBody = {
          encrypted: true,
          version: this.version,
          payload: this.encrypt(options.body)
        };
        
        options.body = JSON.stringify(encryptedBody);
      }

      // Headers obrigatórios para criptografia
      options.headers = {
        'Content-Type': 'application/json',
        'x-accept-crypto': 'true',           // Aceitar dados criptografados
        'x-session-id': this.sessionId,      // Session ID para descriptografar
        ...options.headers
      };

      if (this.debug) {
        console.log('🌐 Fazendo requisição segura:', {
          url,
          method: options.method || 'GET',
          hasBody: !!options.body,
          sessionId: this.sessionId.substring(0, 8) + '...'
        });
      }

      // Fazer requisição
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      // Se resposta está criptografada, descriptografar
      if (data.encrypted && data.payload) {
        if (this.debug) {
          console.log('🔓 Descriptografando resposta de:', url);
        }
        return this.decrypt(data.payload);
      }

      // Senão, retornar dados normais
      if (this.debug) {
        console.log('📄 Resposta não criptografada de:', url);
      }
      return data;

    } catch (error) {
      console.error(`❌ Erro na requisição segura para ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Fazer login (rota não criptografada)
   * @param {string} email 
   * @param {string} senha 
   * @returns {Promise<Object>}
   */
  async login(email, senha) {
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });

      if (!response.ok) {
        throw new Error(`Login falhou: ${response.status}`);
      }

      const data = await response.json();
      
      if (this.debug) {
        console.log('✅ Login realizado:', data.usuario?.nome);
      }

      return data;
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  }

  /**
   * Buscar dados do usuário (sempre criptografado)
   * @param {string} token 
   * @returns {Promise<Object>}
   */
  async getUser(token) {
    return this.secureRequest('/usuario', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Criar loja (sempre criptografado)
   * @param {Object} dadosLoja 
   * @param {string} token 
   * @returns {Promise<Object>}
   */
  async createLoja(dadosLoja, token) {
    return this.secureRequest('/loja', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: dadosLoja
    });
  }

  /**
   * Listar lojas do usuário (sempre criptografado)
   * @param {string} token 
   * @returns {Promise<Object>}
   */
  async getMinhasLojas(token) {
    return this.secureRequest('/minhas-lojas', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Buscar assinatura atual (sempre criptografado)
   * @param {string} token 
   * @returns {Promise<Object>}
   */
  async getAssinaturaAtual(token) {
    return this.secureRequest('/assinatura/atual', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Buscar planos disponíveis (não criptografado - rota pública)
   * @returns {Promise<Object>}
   */
  async getPlanos() {
    const response = await fetch('/planos');
    return response.json();
  }
}

// Singleton - uma instância por sessão
const loadtechCrypto = new LoadTechCrypto();

// Exportar para uso em toda a aplicação
export default loadtechCrypto;

// Exportar classe para casos especiais
export { LoadTechCrypto };

/**
 * EXEMPLOS DE USO:
 * 
 * // 1. Login
 * const { token } = await loadtechCrypto.login('user@email.com', 'senha123');
 * 
 * // 2. Buscar usuário
 * const usuario = await loadtechCrypto.getUser(token);
 * 
 * // 3. Criar loja
 * const novaLoja = await loadtechCrypto.createLoja({
 *   nome: 'Minha Loja',
 *   categoria: 'tecnologia',
 *   cor_tema: '#3b82f6'
 * }, token);
 * 
 * // 4. Listar lojas
 * const { lojas } = await loadtechCrypto.getMinhasLojas(token);
 * 
 * // 5. Requisição personalizada
 * const resultado = await loadtechCrypto.secureRequest('/algum-endpoint', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: { dados: 'aqui' }
 * });
 */

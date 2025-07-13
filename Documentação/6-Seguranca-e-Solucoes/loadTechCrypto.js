/**
 * 🔐 Utilitário de Criptografia para Frontend - LoadTech API
 * Configuração padrão para integração com backend criptografado
 * 
 * IMPORTANTE: Em produção, mova a MASTER_KEY para variáveis de ambiente!
 */

import CryptoJS from 'crypto-js';

// Configuração baseada na chave fornecida
const CRYPTO_CONFIG = {
  MASTER_KEY: "loadtech_crypto_master_key_2025_muito_segura_producao_deve_ser_diferente",
  API_BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  VERSION: "2.0",
  DEBUG: process.env.NODE_ENV === 'development'
};

class LoadTechCrypto {
  constructor(sessionId = null) {
    this.sessionId = sessionId || this.generateSessionId();
    this.masterKey = CRYPTO_CONFIG.MASTER_KEY;
    this.version = CRYPTO_CONFIG.VERSION;
    this.baseURL = CRYPTO_CONFIG.API_BASE_URL;
    this.debug = CRYPTO_CONFIG.DEBUG;
    
    if (this.debug) {
      console.log('🔐 LoadTechCrypto inicializado:', {
        sessionId: this.sessionId,
        version: this.version,
        baseURL: this.baseURL
      });
    }
  }

  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Criptografar dados para envio ao backend
   * Retorna formato compatível: { encrypted, iv }
   */
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.sessionId).toString();
      
      // Gerar IV simulado (CryptoJS gerencia internamente)
      const iv = CryptoJS.lib.WordArray.random(16).toString();
      
      const result = {
        encrypted: encrypted,
        iv: iv
      };

      if (this.debug) {
        console.log('🔐 Dados criptografados:', {
          originalSize: jsonString.length,
          encryptedSize: encrypted.length,
          sessionId: this.sessionId
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao criptografar:', error);
      throw new Error('Falha na criptografia');
    }
  }

  /**
   * Descriptografar dados do backend
   * Aceita múltiplos formatos de payload
   */
  decrypt(payload) {
    try {
      let dataToDecrypt;

      // Formato frontend: { encrypted, iv }
      if (payload.encrypted && payload.iv) {
        dataToDecrypt = payload.encrypted;
        if (this.debug) {
          console.log('🔐 Formato frontend detectado:', { encrypted: true, iv: true });
        }
      }
      // Formato backend: { data, iv, tag, timestamp, signature }
      else if (payload.data) {
        dataToDecrypt = payload.data;
        if (this.debug) {
          console.log('🔐 Formato backend detectado:', { 
            data: true, 
            iv: !!payload.iv, 
            tag: !!payload.tag 
          });
        }
      }
      // String direta
      else if (typeof payload === 'string') {
        dataToDecrypt = payload;
        if (this.debug) {
          console.log('🔐 String direta detectada');
        }
      } else {
        throw new Error('Formato de payload não reconhecido');
      }

      const decrypted = CryptoJS.AES.decrypt(dataToDecrypt, this.sessionId);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Falha ao descriptografar - chave incorreta?');
      }
      
      const result = JSON.parse(jsonString);
      
      if (this.debug) {
        console.log('🔐 Dados descriptografados com sucesso');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao descriptografar:', error);
      throw new Error('Falha na descriptografia: ' + error.message);
    }
  }

  /**
   * Requisição criptografada automática
   */
  async secureRequest(endpoint, options = {}) {
    const url = this.baseURL + endpoint;
    
    const headers = {
      'Content-Type': 'application/json',
      'x-accept-crypto': 'true',
      'x-session-id': this.sessionId,
      'x-crypto-version': this.version,
      ...options.headers
    };

    // Criptografar body se existir
    if (options.body && typeof options.body === 'object') {
      const cryptoPayload = this.encrypt(options.body);
      
      options.body = JSON.stringify({
        encrypted: true,
        version: this.version,
        payload: cryptoPayload
      });
      
      if (this.debug) {
        console.log('🔐 Enviando requisição criptografada para:', endpoint);
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Descriptografar resposta se necessário
      if (data.encrypted && data.payload) {
        if (this.debug) {
          console.log('🔐 Resposta criptografada recebida, descriptografando...');
        }
        return this.decrypt(data.payload);
      }

      if (this.debug) {
        console.log('🔐 Resposta não criptografada recebida');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro na requisição segura:', error);
      throw error;
    }
  }

  /**
   * Requisição sem criptografia (para debug/desenvolvimento)
   */
  async plainRequest(endpoint, options = {}) {
    const url = this.baseURL + endpoint;
    
    const headers = {
      'Content-Type': 'application/json',
      'x-accept-crypto': 'false',
      ...options.headers
    };

    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }

    if (this.debug) {
      console.log('📡 Enviando requisição não criptografada para:', endpoint);
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Teste de conectividade com API
   */
  async testConnection() {
    try {
      const response = await this.plainRequest('/health');
      
      if (this.debug) {
        console.log('✅ Conectividade com API confirmada:', response);
      }
      
      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro de conectividade:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Teste de criptografia bidirecional
   */
  async testCrypto() {
    const testData = {
      test: true,
      timestamp: Date.now(),
      message: 'Teste de criptografia LoadTech'
    };

    try {
      // Teste local
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      
      const localTest = JSON.stringify(testData) === JSON.stringify(decrypted);
      
      if (this.debug) {
        console.log('🔐 Teste local de criptografia:', localTest ? '✅' : '❌');
      }

      // Teste com backend (se disponível)
      let backendTest = null;
      try {
        const response = await this.secureRequest('/test-crypto', {
          method: 'POST',
          body: testData
        });
        backendTest = response.success === true;
      } catch (error) {
        if (this.debug) {
          console.log('⚠️ Endpoint /test-crypto não disponível');
        }
      }

      return {
        local: localTest,
        backend: backendTest,
        overall: localTest && (backendTest !== false)
      };
    } catch (error) {
      console.error('❌ Erro no teste de criptografia:', error);
      return {
        local: false,
        backend: false,
        overall: false,
        error: error.message
      };
    }
  }
}

export default LoadTechCrypto;

// Instância global para facilidade de uso
export const cryptoAPI = new LoadTechCrypto();

// Utilitários auxiliares
export const CryptoHelpers = {
  // Gerar chave de sessão baseada em dados do usuário
  generateUserSessionId(userId, timestamp = Date.now()) {
    return `sess_${userId}_${timestamp}`;
  },

  // Validar formato de payload criptografado
  isValidCryptoPayload(payload) {
    return (
      payload &&
      typeof payload === 'object' &&
      (
        (payload.encrypted && payload.iv) ||
        (payload.data && payload.iv)
      )
    );
  },

  // Detectar se resposta está criptografada
  isEncryptedResponse(response) {
    return (
      response &&
      response.encrypted === true &&
      response.payload &&
      typeof response.payload === 'object'
    );
  }
};

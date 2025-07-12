/**
 * Cliente de criptografia para Frontend
 * Biblioteca JavaScript para comunicação criptografada com a API LoadTech
 */

class LoadTechCryptoClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:3001';
    this.masterKey = options.masterKey || 'loadtech_default_key_2025_muito_segura';
    this.sessionId = options.sessionId || this.generateSessionId();
    this.enabled = options.enabled !== false;
    this.debug = options.debug || false;
    
    // Cache para Web Crypto API
    this.cryptoKey = null;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  /**
   * Gera um session ID único
   */
  generateSessionId() {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    // Fallback para Node.js ou ambientes sem crypto
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Deriva uma chave criptográfica da chave mestra
   */
  async deriveKey(salt) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API não disponível');
    }

    // Importar chave mestra
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      this.encoder.encode(this.masterKey),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derivar chave usando PBKDF2
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Criptografa dados para envio
   */
  async encrypt(data) {
    if (!this.enabled) return data;

    try {
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Gerar IV aleatório
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Derivar chave
      const key = await this.deriveKey(this.sessionId);
      
      // Criptografar
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        this.encoder.encode(plaintext)
      );
      
      // Timestamp para proteção contra replay
      const timestamp = Date.now();
      
      // Converter para hex (compatível com backend)
      const encryptedData = {
        data: this.arrayBufferToHex(encrypted),
        iv: this.arrayBufferToHex(iv),
        tag: '', // GCM inclui tag automaticamente
        timestamp: timestamp,
        signature: await this.generateSignature(encrypted, iv, timestamp)
      };

      if (this.debug) {
        console.log('🔐 Dados criptografados:', { sessionId: this.sessionId.substring(0, 8) + '...' });
      }

      return encryptedData;
    } catch (error) {
      console.error('Erro na criptografia frontend:', error);
      throw error;
    }
  }

  /**
   * Descriptografa dados recebidos
   */
  async decrypt(encryptedData, maxAge = 300000) {
    if (!this.enabled) return encryptedData;

    try {
      const { data, iv, timestamp, signature } = encryptedData;
      
      // Verificar timestamp
      if (Date.now() - timestamp > maxAge) {
        throw new Error('Dados expirados');
      }
      
      // Converter de base64
      const encrypted = this.base64ToArrayBuffer(data);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      
      // Verificar assinatura
      const expectedSignature = await this.generateSignature(encrypted, ivBuffer, timestamp);
      if (signature !== expectedSignature) {
        throw new Error('Assinatura inválida');
      }
      
      // Derivar chave
      const key = await this.deriveKey(this.sessionId);
      
      // Descriptografar
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        key,
        encrypted
      );
      
      const plaintext = this.decoder.decode(decrypted);
      
      if (this.debug) {
        console.log('🔓 Dados descriptografados com sucesso');
      }
      
      // Tentar fazer parse como JSON
      try {
        return JSON.parse(plaintext);
      } catch {
        return plaintext;
      }
    } catch (error) {
      console.error('Erro na descriptografia frontend:', error);
      throw error;
    }
  }

  /**
   * Gera assinatura para verificação de integridade
   */
  async generateSignature(encrypted, iv, timestamp) {
    const key = await window.crypto.subtle.importKey(
      'raw',
      this.encoder.encode(this.masterKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const data = new Uint8Array([
      ...new Uint8Array(encrypted),
      ...new Uint8Array(iv),
      ...this.encoder.encode(timestamp.toString()),
      ...this.encoder.encode(this.sessionId)
    ]);

    const signature = await window.crypto.subtle.sign('HMAC', key, data);
    return this.arrayBufferToBase64(signature);
  }

  /**
   * Faz requisição HTTP com criptografia automática
   */
  async fetch(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Preparar headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Accept-Crypto': this.enabled ? 'true' : 'false',
      'X-Session-Id': this.sessionId,
      ...options.headers
    };

    // Criptografar body se necessário
    let body = options.body;
    if (body && this.enabled && typeof body === 'object') {
      const encryptedBody = await this.encrypt(body);
      body = JSON.stringify({
        encrypted: true,
        payload: encryptedBody
      });
    } else if (body && typeof body === 'object') {
      body = JSON.stringify(body);
    }

    // Fazer requisição
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      body
    });

    // Processar resposta
    const responseData = await response.json();

    // Descriptografar se necessário
    if (responseData.encrypted && responseData.payload) {
      return {
        ...response,
        data: await this.decrypt(responseData.payload),
        json: async () => await this.decrypt(responseData.payload)
      };
    }

    return {
      ...response,
      data: responseData,
      json: async () => responseData
    };
  }

  // Métodos de conveniência para HTTP
  async get(url, options = {}) {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  async post(url, body, options = {}) {
    return this.fetch(url, { ...options, method: 'POST', body });
  }

  async put(url, body, options = {}) {
    return this.fetch(url, { ...options, method: 'PUT', body });
  }

  async delete(url, options = {}) {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }

  // Utilitários de conversão
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Configuração dinâmica
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setDebug(debug) {
    this.debug = debug;
  }
}

// Instância global
let cryptoClient = null;

/**
 * Inicializa o cliente de criptografia
 */
function initCrypto(options = {}) {
  cryptoClient = new LoadTechCryptoClient(options);
  return cryptoClient;
}

/**
 * Obtém a instância do cliente
 */
function getCryptoClient() {
  if (!cryptoClient) {
    cryptoClient = new LoadTechCryptoClient();
  }
  return cryptoClient;
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LoadTechCryptoClient, initCrypto, getCryptoClient };
}

// Disponibilizar globalmente no browser
if (typeof window !== 'undefined') {
  window.LoadTechCrypto = { LoadTechCryptoClient, initCrypto, getCryptoClient };
}
